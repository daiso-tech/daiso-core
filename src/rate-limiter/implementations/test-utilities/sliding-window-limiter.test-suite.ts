/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { type IRateLimiterAdapter } from "@/rate-limiter/contracts/_module.js";
import { type SlidingWindowLimiterSettings } from "@/rate-limiter/implementations/policies/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/test-utilities"`
 * @group TestUtilities
 */
export type SlidingWindowLimiterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IRateLimiterAdapter>;
};

/**
 * @group TestUtilities
 */
const rateLimiterPolicySettings: Required<SlidingWindowLimiterSettings> = {
    margin: TimeSpan.fromMilliseconds(25),
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
 * import { SlidingWindowLimiter } from "@daiso-tech/core/rate-limiter/policies";
 * import { slidingWindowLimiterTestSuite } from "@daiso-tech/core/rate-limiter/test-utilities";
 * import { constantBackoff } from "@daiso-tech/core/backoff-policies";
 * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
 *
 * describe("sliding-window-limiter class: DatabaseRateLimiterAdapter", () => {
 *     slidingWindowLimiterTestSuite({
 *         createAdapter: () => {
 *             const adapter = new DatabaseRateLimiterAdapter({
 *                 adapter: new MemoryRateLimiterStorageAdapter(),
 *                 backoffPolicy: constantBackoff(
 *                     slidingWindowLimiterTestSuite.backoffPolicySettings,
 *                 ),
 *                 rateLimiterPolicy: new SlidingWindowLimiter(
 *                     slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
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
export function slidingWindowLimiterTestSuite(
    settings: SlidingWindowLimiterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: IRateLimiterAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("sliding-window-limiter IRateLimiterAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delay(timeSpan: TimeSpan): Promise<void> {
            await Task.delay(timeSpan);
        }

        describe("method: getState", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / isolate / getState", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / reset", () => {
            test.todo("Write tests!!!");
        });
    });
}

slidingWindowLimiterTestSuite.rateLimiterPolicySettings =
    rateLimiterPolicySettings;
slidingWindowLimiterTestSuite.backoffPolicySettings = backoffPolicySettings;
