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
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    callInvokable,
    resolveAsyncLazyable,
    type AsyncLazy,
    type ErrorPolicy,
    type Invokable,
    type InvokableFn,
    type WaitUntil,
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
    waitUntil: WaitUntil;
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

    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;
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
            waitUntil,
        } = settings;

        this.waitUntil = waitUntil;
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

    async getState(): Promise<CircuitBreakerState> {
        return this.adapter.getState(this._key.toString());
    }

    private async trackFailure(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvokable(
                this.waitUntil,
                this.adapter.trackFailure(this._key.toString()),
            );
            return;
        }
        await this.adapter.trackFailure(this._key.toString());
    }

    private async trackSuccess(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvokable(
                this.waitUntil,
                this.adapter.trackSuccess(this._key.toString()),
            );
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
                    callInvokable(this.waitUntil, this.trackFailure());
                } else {
                    await this.trackFailure();
                }
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        {
                            circuitBreaker: this,
                            error,
                        },
                    ),
                );
            } else if (shouldRecordError) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        {
                            circuitBreaker: this,
                            error,
                        },
                    ),
                );
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
            callInvokable(
                this.waitUntil,
                this.eventDispatcher.dispatch(
                    CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                    {
                        circuitBreaker: this,
                    },
                ),
            );
        }
        if (shouldRecordSlowCall && !isCallSlow) {
            await this.trackSuccess();
            callInvokable(
                this.waitUntil,
                this.eventDispatcher.dispatch(
                    CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                    {
                        circuitBreaker: this,
                    },
                ),
            );
        }
        if (!shouldRecordSlowCall) {
            await this.trackSuccess();
            callInvokable(
                this.waitUntil,
                this.eventDispatcher.dispatch(
                    CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                    {
                        circuitBreaker: this,
                    },
                ),
            );
        }

        return value;
    }

    private async guard(): Promise<void> {
        const transition = await this.adapter.updateState(this._key.toString());
        const hasStateChaned = transition.to !== transition.from;
        if (hasStateChaned) {
            callInvokable(
                this.waitUntil,
                this.eventDispatcher.dispatch(
                    CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED,
                    {
                        circuitBreaker: this,
                        from: transition.from,
                        to: transition.to,
                    },
                ),
            );
        }

        const isInOpenState = transition.to === CIRCUIT_BREAKER_STATE.OPEN;
        if (isInOpenState) {
            throw OpenCircuitBreakerError.create(this._key);
        }
        const isIsolatedState =
            transition.to === CIRCUIT_BREAKER_STATE.ISOLATED;
        if (isIsolatedState) {
            throw IsolatedCircuitBreakerError.create(this._key);
        }
    }

    async runOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.guard();

        return await this.trackErrorWrapper(async () => {
            return await this.trackSlowCallWrapper(async () => {
                return await resolveAsyncLazyable(asyncFn);
            });
        });
    }

    async reset(): Promise<void> {
        await this.adapter.reset(this._key.toString());
        callInvokable(
            this.waitUntil,
            this.eventDispatcher.dispatch(CIRCUIT_BREAKER_EVENTS.RESETED, {
                circuitBreaker: this,
            }),
        );
    }

    async isolate(): Promise<void> {
        await this.adapter.isolate(this._key.toString());
        callInvokable(
            this.waitUntil,
            this.eventDispatcher.dispatch(CIRCUIT_BREAKER_EVENTS.ISOLATED, {
                circuitBreaker: this,
            }),
        );
    }
}
