/**
 * @module RateLimiter
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import {
    BACKOFFS,
    type ConstantBackoffSettingsEnum,
} from "@/backoff-policies/_module.js";
import {
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module.js";
import {
    LIMITER_POLICIES,
    type FixedWindowLimiterSettingsEnum,
} from "@/rate-limiter/implementations/policies/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/test-utilities"`
 * @group TestUtilities
 */
export type FixedWindowLimiterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IRateLimiterAdapter>;
};

/**
 * @group TestUtilities
 */
const rateLimiterPolicySettings: Required<FixedWindowLimiterSettingsEnum> = {
    type: LIMITER_POLICIES.FIXED_WINDOW,
    window: TimeSpan.fromMilliseconds(100),
};

/**
 * @group TestUtilities
 */
const backoffPolicySettings: Required<ConstantBackoffSettingsEnum> = {
    type: BACKOFFS.CONSTANT,
    delay: TimeSpan.fromMilliseconds(50),
    jitter: null,
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/test-utilities"`
 * @group TestUtilities
 *
 * @example
 * ```ts
 * import { beforeEach, describe, expect, test } from "vitest";
 * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
 * import { FixedWindowLimiter } from "@daiso-tech/core/rate-limiter/policies";
 * import { fixedWindowLimiterTestSuite } from "@daiso-tech/core/rate-limiter/test-utilities";
 * import { constantBackoff } from "@daiso-tech/core/backoff-policies";
 * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
 *
 * describe("fixed-window-limiter class: DatabaseRateLimiterAdapter", () => {
 *     fixedWindowLimiterTestSuite({
 *         createAdapter: () => {
 *             const adapter = new DatabaseRateLimiterAdapter({
 *                 adapter: new MemoryRateLimiterStorageAdapter(),
 *                 backoffPolicy: constantBackoff(
 *                     fixedWindowLimiterTestSuite.backoffPolicySettings,
 *                 ),
 *                 rateLimiterPolicy: new FixedWindowLimiter(
 *                     fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
 *                 ),
 *             });
 *             return adapter;
 *         },
 *         beforeEach,
 *         describe,
 *         expect,
 *         test,
 *     });
 * });
 * ```
 */
export function fixedWindowLimiterTestSuite(
    settings: FixedWindowLimiterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: IRateLimiterAdapter;
    describe("fixed-window-limiter IRateLimiterAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        const LIMIT = 4;
        async function delay(timeSpan: TimeSpan): Promise<void> {
            await Task.delay(timeSpan);
        }

        describe("method: getState", () => {
            test("Should return null when updateState method have not been called", async () => {
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
            test("Should return AllowedState attempt when 3 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: true,
                    attempt: 3,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return AllowedState attempt when 4 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: true,
                    attempt: 4,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return null when 4 attempts occurs during window time and resetTime is awaited", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state1 = await adapter.updateState(KEY, LIMIT);
                await delay(state1.resetTime.addMilliseconds(10));

                const state2 = await adapter.getState(KEY);
                expect(state2).toBeNull();
            });
            test("Should return BlockedState when 5 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: false,
                    attempt: 1,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState attempt when 6 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: false,
                    attempt: 2,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return null when 6 attempts occurs during window time and resetTime is awaited", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state1 = await adapter.updateState(KEY, LIMIT);
                await delay(state1.resetTime.addMilliseconds(10));

                const state2 = await adapter.getState(KEY);
                expect(state2).toBeNull();
            });
        });
        describe("method: updateState", () => {
            test("Should return AllowedState with incremented attempt when 3 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 3,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return AllowedState with incremented attempt when 4 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 4,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return reseted AllowedState when 4 attempts occurs during window time and resetTime is awaited", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state1 = await adapter.updateState(KEY, LIMIT);
                await delay(state1.resetTime.addMilliseconds(10));

                const state2 = await adapter.updateState(KEY, LIMIT);
                expect(state2).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState when 5 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: false,
                    attempt: 1,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState with incremented attempt when 6 attempts occurs during window time", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: false,
                    attempt: 2,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return reseted AllowedState when 6 attempts occurs during window time and resetTime is awaited", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state1 = await adapter.updateState(KEY, LIMIT);
                await delay(state1.resetTime.addMilliseconds(10));

                const state2 = await adapter.updateState(KEY, LIMIT);
                expect(state2).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(TimeSpan) as TimeSpan,
                } satisfies IRateLimiterAdapterState);
            });
        });
        describe("method: reset", () => {
            test("Should return null when reseted in AllowedState", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await adapter.reset(KEY);
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
            test("Should return null when reseted in BlockedState", async () => {
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await adapter.reset(KEY);
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
        });
    });
}

fixedWindowLimiterTestSuite.rateLimiterPolicySettings =
    rateLimiterPolicySettings;
fixedWindowLimiterTestSuite.backoffPolicySettings = backoffPolicySettings;
