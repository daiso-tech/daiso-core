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
} from "@/circuit-breaker/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    callInvokable,
    resolveAsyncLazyable,
    type AsyncLazy,
    type ErrorPolicy,
    type InvokableFn,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type CircuitBreakerSettings = {
    enableAsyncTracking: boolean;
    adapter: ICircuitBreakerAdapter;
    key: string;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    serdeTransformerName: string;
    waitUntil: WaitUntil;
    context: IReadableContext;
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
    static _serialize(
        deserializedValue: CircuitBreaker,
    ): ISerializedCircuitBreaker {
        return {
            version: "1",
            key: deserializedValue._key,
        };
    }

    private readonly waitUntil: WaitUntil;
    private readonly _key: string;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly slowCallTime: TimeSpan;
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;
    private readonly context: IReadableContext;

    constructor(settings: CircuitBreakerSettings) {
        const {
            enableAsyncTracking,
            key,
            errorPolicy,
            trigger,
            adapter,
            slowCallTime,
            serdeTransformerName,
            waitUntil,
            context,
        } = settings;

        this.context = context;
        this.waitUntil = waitUntil;
        this.enableAsyncTracking = enableAsyncTracking;
        this._key = key;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.adapter = adapter;
        this.slowCallTime = slowCallTime;
        this.serdeTransformerName = serdeTransformerName;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): ICircuitBreakerAdapter {
        return this.adapter;
    }

    get key(): string {
        return this._key;
    }

    async getState(): Promise<CircuitBreakerState> {
        return this.adapter.getState(this.context, this._key.toString());
    }

    private async trackFailure(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvokable(
                this.waitUntil,
                this.adapter.trackFailure(this.context, this._key.toString()),
            );
            return;
        }
        await this.adapter.trackFailure(this.context, this._key.toString());
    }

    private async trackSuccess(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvokable(
                this.waitUntil,
                this.adapter.trackSuccess(this.context, this._key.toString()),
            );
            return;
        }
        await this.adapter.trackSuccess(this.context, this._key.toString());
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
        }
        if (shouldRecordSlowCall && !isCallSlow) {
            await this.trackSuccess();
        }
        if (!shouldRecordSlowCall) {
            await this.trackSuccess();
        }

        return value;
    }

    private async guard(): Promise<void> {
        const transition = await this.adapter.updateState(
            this.context,
            this._key.toString(),
        );

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
        await this.adapter.reset(this.context, this._key.toString());
    }

    async isolate(): Promise<void> {
        await this.adapter.isolate(this.context, this._key.toString());
    }
}
