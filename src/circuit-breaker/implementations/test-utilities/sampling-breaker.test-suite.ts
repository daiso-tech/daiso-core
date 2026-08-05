/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @module CircuitBreaker
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module.js";
import { BREAKER_POLICIES } from "@/circuit-breaker/implementations/policies/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type { ConstantBackoffSettingsEnum } from "@/backoff-policies/implementations/_module.js";
import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module.js";
import type { SamplingBreakerSettingsEnum } from "@/circuit-breaker/implementations/policies/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export type SamplingBreakerTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICircuitBreakerAdapter>;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
};

/**
 * @group TestUtilities
 */
const circuitBreakerPolicySettings: Required<SamplingBreakerSettingsEnum> = {
    type: BREAKER_POLICIES.SAMPLING,
    failureThreshold: 0.2,
    successThreshold: 0.8,
    timeSpan: TimeSpan.fromMinutes(1),
    sampleTimeSpan: TimeSpan.fromSeconds(10),
    minimumRps: 5,
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
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/test-utilities"`
 * @group TestUtilities
 *
 * @example
 * ```ts
 * import { beforeEach, describe, expect, test } from "vitest";
 * import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
 * import { SamplingBreaker } from "eridu-tech/circuit-breaker/policies";
 * import { samplingBreakerTestSuite } from "eridu-tech/circuit-breaker/test-utilities";
 * import { constantBackoff } from "eridu-tech/backoff-policies";
 * import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
 *
 * describe("sampling-breaker class: DatabaseCircuitBreakerAdapter", () => {
 *     samplingBreakerTestSuite({
 *         createAdapter: () => {
 *             const adapter = new DatabaseCircuitBreakerAdapter({
 *                 adapter: new MemoryCircuitBreakerStorageAdapter(),
 *                 backoffPolicy: constantBackoff(
 *                     samplingBreakerTestSuite.backoffPolicySettings,
 *                 ),
 *                 circuitBreakerPolicy: new SamplingBreaker(
 *                     samplingBreakerTestSuite.circuitBreakerPolicySettings,
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
export function samplingBreakerTestSuite(
    settings: SamplingBreakerTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ICircuitBreakerAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("sampling-breaker ICircuitBreakerAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delayWithBuffer(timeSpan: ITimeSpan): Promise<void> {
            await delay(
                TimeSpan.fromTimeSpan(timeSpan).addTimeSpan(delayBuffer),
            );
        }

        describe("method: getState", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / isolate", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / reset", () => {
            test.todo("Write tests!!!");
        });
    });
}

samplingBreakerTestSuite.circuitBreakerPolicySettings =
    circuitBreakerPolicySettings;
samplingBreakerTestSuite.backoffPolicySettings = backoffPolicySettings;
