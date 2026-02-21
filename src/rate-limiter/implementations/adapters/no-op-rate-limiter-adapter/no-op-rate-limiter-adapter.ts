/**
 * @module RateLimiter
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IRateLimiterProvider,
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";

/**
 * This `NoOpRateLimiterAdapter` will do nothing and is used for easily mocking {@link IRateLimiterProvider | `IRateLimiterProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/no-op-rate-limiter-adapter"`
 * @group Adapters
 */
export class NoOpRateLimiterAdapter implements IRateLimiterAdapter {
    getState(_key: string): Promise<IRateLimiterAdapterState> {
        return Promise.resolve({
            success: true,
            attempt: 1,
            resetTime: TimeSpan.fromMilliseconds(1),
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
            resetTime: TimeSpan.fromMilliseconds(1),
        });
    }

    reset(_key: string): Promise<void> {
        return Promise.resolve();
    }
}
