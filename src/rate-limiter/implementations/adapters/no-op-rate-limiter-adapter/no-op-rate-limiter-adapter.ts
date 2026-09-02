/**
 * @module RateLimiter
 */

import { TimeSpan } from "@/time-span/implementations/time-span.js";

import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IRateLimiterFactory,
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module.js";

/**
 * The `NoOpRateLimiterAdapter` will do nothing and is used for easily mocking {@link IRateLimiterFactory | `IRateLimiterFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/no-op-rate-limiter-adapter"`
 * @group Adapters
 */
export class NoOpRateLimiterAdapter implements IRateLimiterAdapter {
    getState(_key: string): Promise<IRateLimiterAdapterState> {
        return Promise.resolve({
            success: true,
            attempt: 1,
            resetTime: TimeSpan.fromMilliseconds(1).toStartDate(),
        });
    }

    updateState(
        _key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        return Promise.resolve({
            success: true,
            attempt: 1,
            limit,
            resetTime: TimeSpan.fromMilliseconds(1).toStartDate(),
        });
    }

    reset(_key: string): Promise<void> {
        return Promise.resolve();
    }
}
