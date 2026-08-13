/**
 * @module RateLimiter
 */

import {
    BlockedRateLimiterError,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module.js";
import {
    callErrorPolicyOnThrow,
    callInvocable,
    resolveAsyncLazyable,
} from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    IRateLimiter,
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterAllowedState,
    RateLimiterBlockedState,
    RateLimiterState,
} from "@/rate-limiter/contracts/_module.js";
import type { AsyncLazy, ErrorPolicy, WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export type RateLimiterSettings = {
    limit: number;
    enableAsyncTracking: boolean;
    adapter: IRateLimiterAdapter;
    key: string;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    serdeTransformerName: string;
    waitUntil: WaitUntil;
    context: IReadableContext;
};

/**
 * @internal
 */
export type ISerializedRateLimiter = {
    version: "1";
    key: string;
    limit: number;
};

/**
 * @internal
 */
export class RateLimiter implements IRateLimiter {
    /**
     * @internal
     */
    static internalSerialize(
        deserializedValue: RateLimiter,
    ): ISerializedRateLimiter {
        return {
            version: "1",
            key: deserializedValue.internalKey,
            limit: deserializedValue._limit,
        };
    }

    private readonly waitUntil: WaitUntil;
    private readonly internalKey: string;
    private readonly _limit: number;
    private readonly errorPolicy: ErrorPolicy;
    private readonly onlyError: boolean;
    private readonly adapter: IRateLimiterAdapter;
    private readonly enableAsyncTracking: boolean;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: RateLimiterSettings) {
        const {
            limit,
            enableAsyncTracking,
            key,
            errorPolicy,
            onlyError,
            adapter,
            serdeTransformerName,
            waitUntil,
            context,
        } = settings;

        this.context = context;
        this.waitUntil = waitUntil;
        this.serdeTransformerName = serdeTransformerName;
        this._limit = limit;
        this.enableAsyncTracking = enableAsyncTracking;
        this.internalKey = key;
        this.errorPolicy = errorPolicy;
        this.onlyError = onlyError;
        this.adapter = adapter;
    }

    internalGetSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    internalGetAdapter(): IRateLimiterAdapter {
        return this.adapter;
    }

    private toRateLimiterState(
        state: IRateLimiterAdapterState | null,
    ): RateLimiterState {
        if (state === null) {
            return {
                type: RATE_LIMITER_STATE.EXPIRED,
            };
        }
        if (state.success) {
            return {
                type: RATE_LIMITER_STATE.ALLOWED,
                usedAttempts: state.attempt,
                remainingAttempts: this.limit - state.attempt,
                limit: this.limit,
                resetAfter: state.resetTime,
            } satisfies RateLimiterAllowedState;
        }

        return {
            type: RATE_LIMITER_STATE.BLOCKED,
            limit: this.limit,
            totalAttempts: state.attempt,
            exceedAttempts: state.attempt - this.limit,
            retryAfter: state.resetTime,
        } satisfies RateLimiterBlockedState;
    }

    async getState(): Promise<RateLimiterState> {
        const state = await this.adapter.getState(
            this.internalKey,
            this.context,
        );

        return this.toRateLimiterState(state);
    }

    get key(): string {
        return this.internalKey;
    }

    get limit(): number {
        return this._limit;
    }

    private async trackErrorWrapper<TValue>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        const state = this.toRateLimiterState(
            await this.adapter.getState(this.internalKey, this.context),
        );

        if (state.type === RATE_LIMITER_STATE.BLOCKED) {
            const { type: _type, ...rest } = state;
            throw BlockedRateLimiterError.create(rest, this.internalKey);
        }

        try {
            return await resolveAsyncLazyable(asyncFn);
        } catch (error: unknown) {
            const isErrorMatching = await callErrorPolicyOnThrow(
                this.errorPolicy,
                error,
            );

            if (isErrorMatching) {
                const fn = async () => {
                    await this.adapter.updateState(
                        this.internalKey,
                        this.limit,
                        this.context,
                    );
                };
                if (this.enableAsyncTracking) {
                    callInvocable(this.waitUntil, fn());
                } else {
                    await fn();
                }
            }

            throw error;
        }
    }

    private async trackWrapper<TValue>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        const state = this.toRateLimiterState(
            await this.adapter.updateState(
                this.internalKey,
                this.limit,
                this.context,
            ),
        );

        if (state.type === RATE_LIMITER_STATE.BLOCKED) {
            const { type: _type, ...rest } = state;
            throw BlockedRateLimiterError.create(rest, this.internalKey);
        }

        return await resolveAsyncLazyable(asyncFn);
    }

    async runOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        if (this.onlyError) {
            return await this.trackErrorWrapper(asyncFn);
        }
        return await this.trackWrapper(asyncFn);
    }

    async reset(): Promise<void> {
        await this.adapter.reset(this.internalKey, this.context);
    }
}
