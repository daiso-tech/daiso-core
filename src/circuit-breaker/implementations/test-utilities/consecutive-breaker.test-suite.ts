/**
 * @module CircuitBreaker
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
    CIRCUIT_BREAKER_STATE,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import {
    BREAKER_POLICIES,
    type ConsecutiveBreakerSettingsEnum,
} from "@/circuit-breaker/implementations/policies/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export type ConsecutiveBreakerTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICircuitBreakerAdapter>;
};

/**
 * @group TestUtilities
 */
const circuitBreakerPolicySettings: Required<ConsecutiveBreakerSettingsEnum> = {
    type: BREAKER_POLICIES.CONSECUTIVE,
    failureThreshold: 5,
    successThreshold: 5,
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
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/test-utilities"`
 * @group TestUtilities
 *
 * @example
 * ```ts
 * import { beforeEach, describe, expect, test } from "vitest";
 * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
 * import { ConsecutiveBreaker } from "@daiso-tech/core/circuit-breaker/policies";
 * import { consecutiveBreakerTestSuite } from "@daiso-tech/core/circuit-breaker/test-utilities";
 * import { constantBackoff } from "@daiso-tech/core/backoff-policies";
 * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
 *
 * describe("consecutive-breaker class: DatabaseCircuitBreakerAdapter", () => {
 *     consecutiveBreakerTestSuite({
 *         createAdapter: () => {
 *             const adapter = new DatabaseCircuitBreakerAdapter({
 *                 adapter: new MemoryCircuitBreakerStorageAdapter(),
 *                 backoffPolicy: constantBackoff(
 *                     consecutiveBreakerTestSuite.backoffPolicySettings,
 *                 ),
 *                 circuitBreakerPolicy: new ConsecutiveBreaker(
 *                     consecutiveBreakerTestSuite.circuitBreakerPolicySettings,
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
export function consecutiveBreakerTestSuite(
    settings: ConsecutiveBreakerTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: ICircuitBreakerAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("consecutive-breaker ICircuitBreakerAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delay(timeSpan: TimeSpan): Promise<void> {
            await Task.delay(timeSpan);
        }

        describe("method: getState", () => {
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED as initial state", async () => {
                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED when in ClosedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.OPEN when in OpenedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.HALF_OPEN when in HalfOpenState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.HALF_OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.ISOLATED when in IsolatedState", async () => {
                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test("Should transition ClosedState -> ClosedState when 1 failure has occured", async () => {
                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 4 consecutive failures has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState when 5 consecutive failures has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 4 consecutive failures, 1 success and 1 failure has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> OpenState when 5 consecutive failures has occured and wait time is not reached", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.divide(2));
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState when 5 consecutive failures has occured and wait time is reached", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState -> HalfOpenState when 5 consecutive failures, wait time is reached and 1 consecutive successes has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState -> HalfOpenState when 5 consecutive failures, wait time is reached and 4 consecutive successes has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState -> ClosedState when 5 consecutive failures, wait time is reached and 5 consecutive successes has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState -> OpenState when 5 consecutive failures, wait time is reached and 1 failure has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenState -> HalfOpenState -> OpenState when 5 consecutive failures, wait time is reached, 4 consecutive successes and 1 failure has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const transition = await adapter.updateState(KEY);

                expect(transition).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
        });
        describe("method: updateState / trackFailure / isolate / getState", () => {
            test("Should transition to IsolatedState when in ClosedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in OpenedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in HalfOpenState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / reset", () => {
            test("Should reset when in ClosedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.reset(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in OpenedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.reset(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in HalfOpenState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.reset(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in IsolatedState", async () => {
                await adapter.isolate(KEY);

                await adapter.reset(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
        });

        test.skip("TEST", async () => {
            await adapter.trackFailure(KEY);
            await adapter.updateState(KEY);
        });
    });
}

consecutiveBreakerTestSuite.circuitBreakerPolicySettings =
    circuitBreakerPolicySettings;
consecutiveBreakerTestSuite.backoffPolicySettings = backoffPolicySettings;
