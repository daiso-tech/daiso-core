/**
 * @module CircuitBreaker
 */

import {
    type CircuitBreakerState,
    type CircuitBreakerTrigger,
    type ICircuitBreaker,
    OpenCircuitBreakerError,
    IsolatedCircuitBreakerError,
    CIRCUIT_BREAKER_TRIGGER,
    type ICircuitBreakerAdapter,
    CIRCUIT_BREAKER_STATE,
    type CircuitBreakerEventMap,
    CIRCUIT_BREAKER_EVENTS,
} from "@/circuit-breaker/contracts/_module.js";
import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    resolveAsyncLazyable,
    type AsyncLazy,
    type ErrorPolicy,
    type InvokableFn,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type CircuitBreakerSettings = {
    enableAsyncTracking: boolean;
    eventDispatcher: IEventDispatcher<CircuitBreakerEventMap>;
    adapter: ICircuitBreakerAdapter;
    key: IKey;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    serdeTransformerName: string;
    namespace: INamespace;
};

/**
 * @internal
 */
export type ISerializedCircuitBreaker = {
    version: "1";
    key: string;
};

/**
 * @internal
 */
export class CircuitBreaker implements ICircuitBreaker {
    /**
     * @internal
     */
    static _internal_serialize(
        deserializedValue: CircuitBreaker,
    ): ISerializedCircuitBreaker {
        return {
            version: "1",
            key: deserializedValue._key.get(),
        };
    }

    private readonly _key: IKey;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly slowCallTime: TimeSpan;
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly eventDispatcher: IEventDispatcher<CircuitBreakerEventMap>;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;
    private readonly enableAsyncTracking: boolean;

    constructor(settings: CircuitBreakerSettings) {
        const {
            enableAsyncTracking,
            eventDispatcher,
            key,
            errorPolicy,
            trigger,
            adapter,
            slowCallTime,
            serdeTransformerName,
            namespace,
        } = settings;

        this.enableAsyncTracking = enableAsyncTracking;
        this.eventDispatcher = eventDispatcher;
        this._key = key;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.adapter = adapter;
        this.slowCallTime = slowCallTime;
        this.serdeTransformerName = serdeTransformerName;
        this.namespace = namespace;
    }

    _internal_getNamespace(): INamespace {
        return this.namespace;
    }

    _internal_getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _internal_getAdapter(): ICircuitBreakerAdapter {
        return this.adapter;
    }

    get key(): IKey {
        return this._key;
    }

    getState(): ITask<CircuitBreakerState> {
        return new Task(async () => {
            return this.adapter.getState(this._key.toString());
        });
    }

    private async trackFailure(): Promise<void> {
        if (this.enableAsyncTracking) {
            new Task(async () => {
                await this.adapter.trackFailure(this._key.toString());
            }).detach();
            return;
        }
        await this.adapter.trackFailure(this._key.toString());
    }

    private async trackSuccess(): Promise<void> {
        if (this.enableAsyncTracking) {
            new Task(async () => {
                await this.adapter.trackSuccess(this._key.toString());
            }).detach();
            return;
        }
        await this.adapter.trackSuccess(this._key.toString());
    }

    private async trackErrorWrapper<TValue = void>(
        fn: InvokableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        try {
            return await fn();
        } catch (error: unknown) {
            const isErrorMatching = await callErrorPolicyOnThrow(
                this.errorPolicy,
                error,
            );
            const shouldRecordError =
                this.trigger === CIRCUIT_BREAKER_TRIGGER.BOTH ||
                this.trigger === CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR;

            if (shouldRecordError && isErrorMatching) {
                if (this.enableAsyncTracking) {
                    new Task(async () => {
                        await this.trackFailure();
                    }).detach();
                } else {
                    await this.trackFailure();
                }
                this.eventDispatcher
                    .dispatch(CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE, {
                        circuitBreaker: this,
                        error,
                    })
                    .detach();
            } else if (shouldRecordError) {
                this.eventDispatcher
                    .dispatch(CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE, {
                        circuitBreaker: this,
                        error,
                    })
                    .detach();
            }
            throw error;
        }
    }

    private async trackSlowCallWrapper<TValue = void>(
        fn: InvokableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        const start = performance.now();

        const value = await fn();

        const end = performance.now();

        const executionTime = TimeSpan.fromMilliseconds(end - start);

        const shouldRecordSlowCall =
            this.trigger === CIRCUIT_BREAKER_TRIGGER.BOTH ||
            this.trigger === CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL;
        const isCallSlow = executionTime.gte(this.slowCallTime);

        if (shouldRecordSlowCall && isCallSlow) {
            await this.trackFailure();
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL, {
                    circuitBreaker: this,
                })
                .detach();
        }
        if (shouldRecordSlowCall && !isCallSlow) {
            await this.trackSuccess();
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS, {
                    circuitBreaker: this,
                })
                .detach();
        }
        if (!shouldRecordSlowCall) {
            await this.trackSuccess();
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS, {
                    circuitBreaker: this,
                })
                .detach();
        }

        return value;
    }

    private async guard(): Promise<void> {
        const transition = await this.adapter.updateState(this._key.toString());
        const hasStateChaned = transition.to !== transition.from;
        if (hasStateChaned) {
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED, {
                    circuitBreaker: this,
                    from: transition.from,
                    to: transition.to,
                })
                .detach();
        }

        const isInOpenState = transition.to === CIRCUIT_BREAKER_STATE.OPEN;
        if (isInOpenState) {
            throw OpenCircuitBreakerError.create(this._key);
        }
        const isIsolatedState =
            transition.to === CIRCUIT_BREAKER_EVENTS.ISOLATED;
        if (isIsolatedState) {
            throw IsolatedCircuitBreakerError.create(this._key);
        }
    }

    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue> {
        return new Task(async () => {
            await this.guard();

            return await this.trackErrorWrapper(async () => {
                return await this.trackSlowCallWrapper(async () => {
                    return await resolveAsyncLazyable(asyncFn);
                });
            });
        });
    }

    reset(): ITask<void> {
        return new Task(async () => {
            await this.adapter.reset(this._key.toString());
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.RESETED, {
                    circuitBreaker: this,
                })
                .detach();
        });
    }

    isolate(): ITask<void> {
        return new Task(async () => {
            await this.adapter.isolate(this._key.toString());
            this.eventDispatcher
                .dispatch(CIRCUIT_BREAKER_EVENTS.ISOLATED, {
                    circuitBreaker: this,
                })
                .detach();
        });
    }
}
