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
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

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

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
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
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: ICircuitBreakerAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);

    describe("count-breaker ICircuitBreakerAdapter tests:", () => {
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
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED as initial state", async () => {
                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED when in ClosedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.OPEN when in OpenedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.HALF_OPEN when in HalfOpenedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.HALF_OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.ISOLATED when in IsolatedState", async () => {
                await adapter.isolate(context, KEY);

                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test("Should transition ClosedState -> ClosedState when 1 failure has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 5 failures has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure and 5 successes has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 1 failure, 5 successes and 2 failures has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 6 failures", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> OpenedState when 6 failures and wait time is not reached", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime.divide(2));
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState when 6 failures and wait time is reached", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure, 8 successes and 1 failure", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when 2 failures, 7 successes and 1 failure", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when 1 failure, 10 successes and 1 failure", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> OpenedState when 2 failures, 7 successes, 1 failure and wait time is not reached", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime.divide(2));
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState when 2 failures, 7 successes, 1 failure and wait time is reached", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 1 success has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 5 successess has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> HalfOpenedState when 6 failures, wait time is reached, 1 success and 4 failures has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> OpenedState when 6 failures, wait time is reached, 1 failures, 4 successess and 1 failure has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> ClosedState when 6 failures, wait time is reached, 1 failures, 5 successess has occurred", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                const state = await adapter.updateState(context, KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
        });
        describe("method: updateState / trackFailure / isolate", () => {
            test("Should transition to IsolatedState when in ClosedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.isolate(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in OpenedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.isolate(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in HalfOpenState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.isolate(context, KEY);

                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / reset", () => {
            test("Should reset when in ClosedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.reset(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in OpenedState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.reset(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                const state = await adapter.getState(context, KEY);
                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in HalfOpenState", async () => {
                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackSuccess(context, KEY);
                await adapter.updateState(context, KEY);

                await adapter.trackFailure(context, KEY);
                await adapter.updateState(context, KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(context, KEY);

                await adapter.reset(context, KEY);

                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in IsolatedState", async () => {
                await adapter.isolate(context, KEY);

                await adapter.reset(context, KEY);

                const state = await adapter.getState(context, KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
        });
    });
}

countBreakerTestSuite.circuitBreakerPolicySettings =
    circuitBreakerPolicySettings;
countBreakerTestSuite.backoffPolicySettings = backoffPolicySettings;
