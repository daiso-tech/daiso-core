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
    type CountBreakerSettingsEnum,
} from "@/circuit-breaker/implementations/policies/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export type CountBreakerTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICircuitBreakerAdapter>;

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
const circuitBreakerPolicySettings: Required<CountBreakerSettingsEnum> = {
    type: BREAKER_POLICIES.COUNT,
    failureThreshold: 0.2,
    successThreshold: 0.8,
    size: 10,
    minimumNumberOfCalls: 5,
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
 * import { CountBreaker } from "@daiso-tech/core/circuit-breaker/policies";
 * import { countBreakerTestSuite } from "@daiso-tech/core/circuit-breaker/test-utilities";
 * import { constantBackoff } from "@daiso-tech/core/backoff-policies";
 * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
 *
 * describe("count-breaker class: DatabaseCircuitBreakerAdapter", () => {
 *     countBreakerTestSuite({
 *         createAdapter: () => {
 *             const adapter = new DatabaseCircuitBreakerAdapter({
 *                 adapter: new MemoryCircuitBreakerStorageAdapter(),
 *                 backoffPolicy: constantBackoff(
 *                     countBreakerTestSuite.backoffPolicySettings,
 *                 ),
 *                 circuitBreakerPolicy: new CountBreaker(
 *                     countBreakerTestSuite.circuitBreakerPolicySettings,
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
export function countBreakerTestSuite(
    settings: CountBreakerTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ICircuitBreakerAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("count-breaker ICircuitBreakerAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delay(timeSpan: ITimeSpan): Promise<void> {
            await Task.delay(
                TimeSpan.fromTimeSpan(timeSpan).addTimeSpan(delayBuffer),
            );
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

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.OPEN when in OpenedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.HALF_OPEN when in HalfOpenedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 5 failures has occured", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure and 5 successes has occured", async () => {
                await adapter.trackFailure(KEY);
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
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 1 failure, 5 successes and 2 failures has occured", async () => {
                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 6 failures", async () => {
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

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> OpenedState when 6 failures and wait time is not reached", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.divide(2));
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState when 6 failures and wait time is reached", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure, 8 successes and 1 failure", async () => {
                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 2 failures, 7 successes and 1 failure", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure, 10 successes and 1 failure", async () => {
                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> OpenedState when 2 failures, 7 successes, 1 failure and wait time is not reached", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.divide(2));
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState when 2 failures, 7 successes, 1 failure and wait time is reached", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 1 success has occurred", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 5 successess has occurred", async () => {
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
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 1 success and 4 failures has occurred", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> OpenedState when 6 failures, wait time is reached, 1 failures, 4 successess and 1 failure has occurred", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> ClosedState when 6 failures, wait time is reached, 1 failures, 5 successess has occurred", async () => {
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

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await delay(waitTime.addMilliseconds(25));
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
        });
        describe("method: updateState / trackFailure / isolate", () => {
            test("Should transition to IsolatedState when in ClosedState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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

                await adapter.trackSuccess(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.reset(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in HalfOpenState", async () => {
                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                await adapter.trackFailure(KEY);
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
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
                await adapter.updateState(KEY);

                await adapter.trackSuccess(KEY);
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
    });
}

countBreakerTestSuite.circuitBreakerPolicySettings =
    circuitBreakerPolicySettings;
countBreakerTestSuite.backoffPolicySettings = backoffPolicySettings;
