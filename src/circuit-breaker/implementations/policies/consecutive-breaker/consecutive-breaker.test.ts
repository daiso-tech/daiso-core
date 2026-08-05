import { describe, expect, test } from "vitest";

import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/contracts/circuit-breaker-policy.contract.js";
import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/policies/consecutive-breaker/consecutive-breaker.js";

import type { ConsecutiveBreakerState } from "@/circuit-breaker/implementations/policies/consecutive-breaker/consecutive-breaker.js";

describe("class: ConsecutiveBreaker", () => {
    describe("method: initialMetrics", () => {
        test(`Should return an object with "failureCount" and "successCount" set to 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.initialMetrics();

            expect(newMetrics).toEqual({
                failureCount: 0,
                successCount: 0,
            } satisfies ConsecutiveBreakerState);
        });
    });
    describe("method: whenClosed", () => {
        test(`Should return CLOSED_TRANSITIONS.NONE when "failureCount" equals to 0 and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenClosed(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "failureCount" less than failureThreshold and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenClosed(
                {
                    failureCount: 3,
                    successCount: 0,
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.TO_OPEN when "failureCount" equals to failureThreshold and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenClosed(
                {
                    failureCount: 4,
                    successCount: 0,
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
        });
    });
    describe("method: whenHalfOpen", () => {
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "successCount" equals to 0 and "failureCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenHalfOpened(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "successCount" less than successThreshold and "failureCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenHalfOpened(
                {
                    failureCount: 0,
                    successCount: 3,
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "successCount" equals to successThreshold and "failureCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenHalfOpened(
                {
                    failureCount: 0,
                    successCount: 4,
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when "failureCount" greater than 0 and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenHalfOpened(
                {
                    failureCount: 1,
                    successCount: 0,
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when "failureCount" greater than 0 and "successCount" equals to 3`, () => {
            const policy = new ConsecutiveBreaker({
                failureThreshold: 4,
            });

            const transition = policy.whenHalfOpened(
                {
                    failureCount: 1,
                    successCount: 3,
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
        });
    });
    describe("method: trackFailure", () => {
        test(`Should increment "failureCount" when in closed state and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        failureCount: 0,
                        successCount: 0,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                failureCount: 1,
                successCount: 0,
            } satisfies ConsecutiveBreakerState);
        });
        test(`Should increment "failureCount" when in half open state and "successCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    metrics: {
                        failureCount: 0,
                        successCount: 0,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                failureCount: 1,
                successCount: 0,
            } satisfies ConsecutiveBreakerState);
        });
        test(`Should increment "failureCount" and keep "successCount" when in half open state and "successCount" is 1`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    metrics: {
                        failureCount: 0,
                        successCount: 1,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                failureCount: 1,
                successCount: 1,
            } satisfies ConsecutiveBreakerState);
        });
    });
    describe("method: trackSuccess", () => {
        test(`Should return initial state when in closed state and "failureCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newState = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        successCount: 0,
                        failureCount: 0,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newState).toEqual(policy.initialMetrics());
        });
        test(`Should return initial state when in closed state and "failureCount" is greater than 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        successCount: 0,
                        failureCount: 1,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual(policy.initialMetrics());
        });
        test(`Should increment "successCount" when in half open state and "failureCount" equals to 0`, () => {
            const policy = new ConsecutiveBreaker();

            const newMetrics = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    metrics: {
                        failureCount: 0,
                        successCount: 1,
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                failureCount: 0,
                successCount: 2,
            } satisfies ConsecutiveBreakerState);
        });
    });
    describe("method: isEqual", () => {
        test(`Should return false when given different "failureCount"`, () => {
            const policy = new ConsecutiveBreaker();

            const hasChanged = policy.isEqual(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                {
                    failureCount: 2,
                    successCount: 0,
                },
            );

            expect(hasChanged).toBe(false);
        });
        test(`Should return false when given different "successCount"`, () => {
            const policy = new ConsecutiveBreaker();

            const hasChanged = policy.isEqual(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                {
                    failureCount: 0,
                    successCount: 2,
                },
            );

            expect(hasChanged).toBe(false);
        });
        test(`Should return false when given different "failureCount" and "successCount"`, () => {
            const policy = new ConsecutiveBreaker();

            const hasChanged = policy.isEqual(
                {
                    failureCount: 1,
                    successCount: 3,
                },
                {
                    failureCount: 2,
                    successCount: 4,
                },
            );

            expect(hasChanged).toBe(false);
        });
        test(`Should return true when given same "successCount" and "failureCount"`, () => {
            const policy = new ConsecutiveBreaker();

            const hasChanged = policy.isEqual(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                {
                    failureCount: 0,
                    successCount: 0,
                },
            );

            expect(hasChanged).toBe(true);
        });
        test(`Should return true when given same "successCount" and "failureCount" but with different key order`, () => {
            const policy = new ConsecutiveBreaker();

            const hasChanged = policy.isEqual(
                {
                    failureCount: 0,
                    successCount: 0,
                },
                {
                    successCount: 0,
                    failureCount: 0,
                },
            );

            expect(hasChanged).toBe(true);
        });
    });
});
