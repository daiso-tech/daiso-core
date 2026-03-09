/**
 * @module RateLimiter
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type RateLimiterState } from "@/rate-limiter/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BlockedRateLimiterError } from "@/rate-limiter/contracts/rate-limiter.errors.js";
import { type ITask } from "@/task/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterStateMethods = {
    getState(): ITask<RateLimiterState>;

    /**
     * The `key` of the `IRateLimiter` instance.
     */
    readonly key: IKey;

    /**
     * The `limit` of the `IRateLimiter` instance.
     */
    readonly limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterRunBlockingSettings = {
    time?: ITimeSpan;
    interval?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiter = IRateLimiterStateMethods & {
    /**
     * @throws {BlockedRateLimiterError} {@link BlockedRateLimiterError}
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue>;

    /**
     * The `reset` method resets rate limiter to its initial state regardless of the current state.
     */
    reset(): ITask<void>;
};
