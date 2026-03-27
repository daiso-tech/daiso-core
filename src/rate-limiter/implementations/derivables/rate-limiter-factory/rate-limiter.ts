/**
 * @module RateLimiter
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    BlockedRateLimiterError,
    RATE_LIMITER_EVENTS,
    RATE_LIMITER_STATE,
    type IRateLimiter,
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
    type RateLimiterAllowedState,
    type RateLimiterBlockedState,
    type RateLimiterEventMap,
    type RateLimiterState,
} from "@/rate-limiter/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    resolveAsyncLazyable,
    type AsyncLazy,
    type ErrorPolicy,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type RateLimiterSettings = {
    limit: number;
    enableAsyncTracking: boolean;
    eventDispatcher: IEventDispatcher<RateLimiterEventMap>;
    adapter: IRateLimiterAdapter;
    key: IKey;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    namespace: INamespace;
    serdeTransformerName: string;
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
    static _internal_serialize(
        deserializedValue: RateLimiter,
    ): ISerializedRateLimiter {
        return {
            version: "1",
            key: deserializedValue._key.get(),
            limit: deserializedValue._limit,
        };
    }

    private readonly _key: IKey;
    private readonly _limit: number;
    private readonly errorPolicy: ErrorPolicy;
    private readonly onlyError: boolean;
    private readonly adapter: IRateLimiterAdapter;
    private readonly eventDispatcher: IEventDispatcher<RateLimiterEventMap>;
    private readonly enableAsyncTracking: boolean;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;

    constructor(settings: RateLimiterSettings) {
        const {
            limit,
            enableAsyncTracking,
            eventDispatcher,
            key,
            errorPolicy,
            onlyError,
            adapter,
            serdeTransformerName,
            namespace,
        } = settings;

        this.namespace = namespace;
        this.serdeTransformerName = serdeTransformerName;
        this._limit = limit;
        this.enableAsyncTracking = enableAsyncTracking;
        this.eventDispatcher = eventDispatcher;
        this._key = key;
        this.errorPolicy = errorPolicy;
        this.onlyError = onlyError;
        this.adapter = adapter;
    }

    _internal_getNamespace(): INamespace {
        return this.namespace;
    }

    _internal_getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _internal_getAdapter(): IRateLimiterAdapter {
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
                reaminingAttemps: this.limit - state.attempt,
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

    getState(): ITask<RateLimiterState> {
        return new Task<RateLimiterState>(async () => {
            const state = await this.adapter.getState(this._key.toString());

            return this.toRateLimiterState(state);
        });
    }

    get key(): IKey {
        return this._key;
    }

    get limit(): number {
        return this._limit;
    }

    private async trackErrorWrapper<TValue>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        const state = this.toRateLimiterState(
            await this.adapter.getState(this._key.toString()),
        );

        if (state.type === RATE_LIMITER_STATE.BLOCKED) {
            this.eventDispatcher
                .dispatch(RATE_LIMITER_EVENTS.BLOCKED, {
                    rateLimiter: this,
                })
                .detach();

            const { type: _type, ...rest } = state;
            throw BlockedRateLimiterError.create(rest, this._key);
        }

        try {
            this.eventDispatcher
                .dispatch(RATE_LIMITER_EVENTS.ALLOWED, {
                    rateLimiter: this,
                })
                .detach();

            return await resolveAsyncLazyable(asyncFn);
        } catch (error: unknown) {
            const isErrorMatching = await callErrorPolicyOnThrow(
                this.errorPolicy,
                error,
            );

            if (isErrorMatching) {
                this.eventDispatcher
                    .dispatch(RATE_LIMITER_EVENTS.TRACKED_FAILURE, {
                        rateLimiter: this,
                        error,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(RATE_LIMITER_EVENTS.UNTRACKED_FAILURE, {
                        rateLimiter: this,
                        error,
                    })
                    .detach();
            }

            if (isErrorMatching) {
                const task = new Task(async () => {
                    await this.adapter.updateState(
                        this._key.toString(),
                        this.limit,
                    );
                });
                if (this.enableAsyncTracking) {
                    task.detach();
                } else {
                    await task;
                }
            }

            throw error;
        }
    }

    private async trackWrapper<TValue>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        const state = this.toRateLimiterState(
            await this.adapter.updateState(this._key.toString(), this.limit),
        );

        if (state.type === RATE_LIMITER_STATE.BLOCKED) {
            this.eventDispatcher
                .dispatch(RATE_LIMITER_EVENTS.BLOCKED, {
                    rateLimiter: this,
                })
                .detach();

            const { type: _type, ...rest } = state;
            throw BlockedRateLimiterError.create(rest, this._key);
        }

        this.eventDispatcher
            .dispatch(RATE_LIMITER_EVENTS.ALLOWED, {
                rateLimiter: this,
            })
            .detach();

        return await resolveAsyncLazyable(asyncFn);
    }

    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue> {
        return new Task(async () => {
            if (this.onlyError) {
                return await this.trackErrorWrapper(asyncFn);
            }
            return await this.trackWrapper(asyncFn);
        });
    }

    reset(): ITask<void> {
        return new Task(async () => {
            this.eventDispatcher
                .dispatch(RATE_LIMITER_EVENTS.RESETED, {
                    rateLimiter: this,
                })
                .detach();
            await this.adapter.reset(this._key.toString());
        });
    }
}
