import { describe, expect, test } from "vitest";

import {
    CLOSED_TRANSITIONS,
    CIRCUIT_BREAKER_STATE,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/contracts/_module.js";
import { CountBreaker } from "@/circuit-breaker/implementations/policies/count-breaker/count-breaker.js";

import type { CountBreakerState } from "@/circuit-breaker/implementations/policies/count-breaker/count-breaker.js";

describe("class: CountBreaker", () => {
    describe("method: initialMetrics", () => {
        test(`Should return an object with an empty "samples" array field`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.initialMetrics();

            expect(newMetrics).toEqual({
                samples: [],
            } satisfies CountBreakerState);
        });
    });
    describe("method: whenClosed", () => {
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array field is empty`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 100% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [false, false, false],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 66.66% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [false, false, true],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 33.33% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [true, true, false],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.TO_OPEN when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 100% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [false, false, false, false],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
        });
        test(`Should return CLOSED_TRANSITIONS.TO_OPEN when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 66.66% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [false, false, false, false, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 33.33% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [false, false, true, true, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
        test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 0% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenClosed(
                {
                    samples: [true, true, true, true, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
        });
    });
    describe("method: whenHalfOpen", () => {
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "samples" array field is empty`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 100% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [true, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 33.33% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [true, true, false],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.NONE when "samples" array is less than or equal to "CountBreakerSettings.minimumNumberOfCalls" and 66.66% failures`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [false, false, true],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 0% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [false, false, false, false],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 33.33% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [false, false, false, false, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_CLOSED when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 66.66% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [false, false, true, true, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
        });
        test(`Should return HALF_OPEN_TRANSITIONS.TO_CLOSED when "samples" array is greater than "CountBreakerSettings.minimumNumberOfCalls" and 100% success`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const transition = policy.whenHalfOpened(
                {
                    samples: [true, true, true, true, true, true],
                },
                new Date(),
            );

            expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
        });
    });
    describe("method: trackFailure", () => {
        test(`Should add false to the "samples"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [false],
            } satisfies CountBreakerState);
        });
        test(`Should add false to the "samples" when "samples" is less than "CountBreakerSettings.size"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [true, true, true, true, true],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [true, true, true, true, true, false],
            } satisfies CountBreakerState);
        });
        test(`Should remove first item then add false to the "samples" when "samples" is equal or greater than "CountBreakerSettings.size"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackFailure(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [true, true, true, true, true, true],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [true, true, true, true, true, false],
            } satisfies CountBreakerState);
        });
    });
    describe("method: trackSuccess", () => {
        test(`Should add true to the "samples"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [true],
            } satisfies CountBreakerState);
        });
        test(`Should add true to the "samples" when "samples" is less than "CountBreakerSettings.size"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [false, false, false, false, false],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [false, false, false, false, false, true],
            } satisfies CountBreakerState);
        });
        test(`Should remove first item then add true to the "samples" when "samples" is equal or greater than "CountBreakerSettings.size"`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const newMetrics = policy.trackSuccess(
                {
                    type: CIRCUIT_BREAKER_STATE.CLOSED,
                    metrics: {
                        samples: [false, false, false, false, false, false],
                    },
                },
                {
                    currentDate: new Date(),
                    initialMetrics: policy.initialMetrics(),
                },
            );

            expect(newMetrics).toEqual({
                samples: [false, false, false, false, false, true],
            } satisfies CountBreakerState);
        });
    });
    describe("method: isEqual", () => {
        test(`Should return true when given "samples" fields that are empty`, () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [],
                },
                {
                    samples: [],
                },
            );

            expect(isMatching).toBe(true);
        });
        test("Should return true when success and failure count is the same", () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [true, false, false],
                },
                {
                    samples: [true, false, false],
                },
            );

            expect(isMatching).toBe(true);
        });
        test("Should return true when success and failure count is the same but have different order", () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [true, true, false, false],
                },
                {
                    samples: [true, false, false, true],
                },
            );

            expect(isMatching).toBe(true);
        });
        test("Should return false when only success count is different", () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [true, true, false],
                },
                {
                    samples: [true, true, false, false],
                },
            );

            expect(isMatching).toBe(false);
        });
        test("Should return false when only failure count is different", () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [true, true, false, false],
                },
                {
                    samples: [true, false, false],
                },
            );

            expect(isMatching).toBe(false);
        });
        test("Should return false when both success and failure count is different", () => {
            const policy = new CountBreaker({
                minimumNumberOfCalls: 3,
                size: 6,
                failureThreshold: 0.5,
            });

            const isMatching = policy.isEqual(
                {
                    samples: [true, false, false],
                },
                {
                    samples: [true, true, false],
                },
            );

            expect(isMatching).toBe(false);
        });
    });
});
