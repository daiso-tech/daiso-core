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
import {
    LIMITER_POLICIES,
    type SlidingWindowLimiterSettings,
    type SlidingWindowLimiterSettingsEnum,
} from "@/rate-limiter/implementations/policies/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay as delay_, type Promisable } from "@/utilities/_module.js";

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

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
};

/**
 * @group TestUtilities
 */
const rateLimiterPolicySettings: Required<SlidingWindowLimiterSettingsEnum> = {
    type: LIMITER_POLICIES.SLIDING_WINDOW,
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
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: IRateLimiterAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("sliding-window-limiter IRateLimiterAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delay(timeSpan: TimeSpan): Promise<void> {
            await delay_(
                TimeSpan.fromTimeSpan(timeSpan).addTimeSpan(delayBuffer),
            );
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
