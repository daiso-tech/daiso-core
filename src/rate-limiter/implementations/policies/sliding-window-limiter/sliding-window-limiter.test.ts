import { describe, expect, test } from "vitest";

import {
    SlidingWindowLimiter,
    type SlidingWindowLimiterState,
} from "@/rate-limiter/implementations/policies/sliding-window-limiter/sliding-window-limiter.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";

describe("class: SlidingWindowLimiter", () => {
    describe("constructor", () => {
        test("Should use default 1-second window when no settings provided", () => {
            const limiter = new SlidingWindowLimiter();

            const currentDate = new Date("2025-12-24T00:00:00.000Z");
            const defaultWindowMs = 1_000;
            const expectedKey =
                Math.floor(currentDate.getTime() / defaultWindowMs) *
                defaultWindowMs;
            const metrics = limiter.initialMetrics(currentDate);

            expect(metrics).toEqual({
                [expectedKey]: 0,
            } satisfies SlidingWindowLimiterState);
        });
    });

    describe("method: initialMetrics", () => {
        test("Should return state with attempt 0 at the current window key", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const currentDate = new Date("2025-12-24T00:00:00.000Z");
            const windowMs = window.toMilliseconds();
            const expectedKey =
                Math.floor(currentDate.getTime() / windowMs) * windowMs;
            const metrics = limiter.initialMetrics(currentDate);

            expect(metrics).toEqual({
                [expectedKey]: 0,
            } satisfies SlidingWindowLimiterState);
        });

        test("Should return state with key aligned to window boundary when date is mid-window", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseDate = new Date("2025-12-24T00:00:00.000Z");
            const currentDate = new Date(baseDate.getTime() + 30_000);
            const expectedKey =
                Math.floor(currentDate.getTime() / windowMs) * windowMs;
            const metrics = limiter.initialMetrics(currentDate);

            expect(metrics).toEqual({
                [expectedKey]: 0,
            } satisfies SlidingWindowLimiterState);
        });
    });

    describe("method: shouldBlock", () => {
        test("Should return false when total weighted attempts are less than limit", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 30s into current window (50%)
            const currentDate = new Date(baseTime + 30_000);
            const limit = 10;
            // Current window: 3 attempts, Previous window: 4 attempts
            // Weighted previous = Math.floor((1 - 0.5) * 4) = 2
            // Total = 3 + 2 = 5 < 10
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
                [currentWindowKey - windowMs]: 4,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(false);
        });

        test("Should return true when total weighted attempts are equal to limit", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 30s into current window (50%)
            const currentDate = new Date(baseTime + 30_000);
            const limit = 5;
            // Current window: 3, Previous window: 4
            // Weighted previous = Math.floor(0.5 * 4) = 2
            // Total = 3 + 2 = 5 >= 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
                [currentWindowKey - windowMs]: 4,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(true);
        });

        test("Should return true when total weighted attempts exceed limit", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 30s into current window (50%)
            const currentDate = new Date(baseTime + 30_000);
            const limit = 5;
            // Current window: 5, Previous window: 4
            // Weighted previous = Math.floor(0.5 * 4) = 2
            // Total = 5 + 2 = 7 >= 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 5,
                [currentWindowKey - windowMs]: 4,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(true);
        });

        test("Should return false when no previous window attempts exist and current is under limit", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const currentDate = new Date(baseTime + 30_000);
            const limit = 5;
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(false);
        });

        test("Should weight previous window attempts higher when early in current window", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 15s into current window (25%)
            const currentDate = new Date(baseTime + 15_000);
            const limit = 5;
            // Current window: 1, Previous window: 6
            // Weighted previous = Math.floor((1 - 0.25) * 6) = Math.floor(4.5) = 4
            // Total = 1 + 4 = 5 >= 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 1,
                [currentWindowKey - windowMs]: 6,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(true);
        });

        test("Should return false when metrics are empty and limit is greater than 0", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentDate = new Date(baseTime + 30_000);
            const result = limiter.shouldBlock({}, 5, currentDate);

            expect(result).toBe(false);
        });

        test("Should give previous window full weight at exact window start", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // Exactly at window start (0% in)
            const currentDate = new Date(baseTime);
            const limit = 5;
            // Current window: 0, Previous window: 5
            // Weighted previous = Math.floor((1 - 0) * 5) = 5
            // Total = 0 + 5 = 5 >= 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 0,
                [currentWindowKey - windowMs]: 5,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(true);
        });

        test("Should give previous window near-zero weight late in current window", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 57s into current window (95%)
            const currentDate = new Date(baseTime + 57_000);
            const limit = 5;
            // Current window: 1, Previous window: 10
            // Weighted previous = Math.floor((1 - 0.95) * 10) = Math.floor(0.5) = 0
            // Total = 1 + 0 = 1 < 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 1,
                [currentWindowKey - windowMs]: 10,
            };
            const result = limiter.shouldBlock(metrics, limit, currentDate);

            expect(result).toBe(false);
        });
    });

    describe("method: getExpiration", () => {
        test("Should return expiration as window * 2 + margin from current window start", () => {
            const window = TimeSpan.fromMinutes(1);
            const margin = TimeSpan.fromSeconds(15);
            const limiter = new SlidingWindowLimiter({ window, margin });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentDate = new Date(baseTime + 30_000);
            const currentWindowStart =
                Math.floor(currentDate.getTime() / windowMs) * windowMs;
            const expiration = limiter.getExpiration({}, currentDate);

            const expectedExpiration = new Date(
                currentWindowStart + windowMs * 2 + margin.toMilliseconds(),
            );
            expect(expiration).toEqual(expectedExpiration);
        });

        test("Should use default margin of window / 4 when not specified", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const defaultMarginMs = windowMs / 4;
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentDate = new Date(baseTime);
            const currentWindowStart =
                Math.floor(currentDate.getTime() / windowMs) * windowMs;
            const expiration = limiter.getExpiration({}, currentDate);

            const expectedExpiration = new Date(
                currentWindowStart + windowMs * 2 + defaultMarginMs,
            );
            expect(expiration).toEqual(expectedExpiration);
        });
    });

    describe("method: getAttempts", () => {
        test("Should return sum of current and weighted previous window attempts", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            // 30s into window (50%)
            const currentDate = new Date(baseTime + 30_000);
            // Current: 3, Previous: 4
            // Weighted previous = Math.floor(0.5 * 4) = 2
            // Total = 3 + 2 = 5
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
                [currentWindowKey - windowMs]: 4,
            };
            const attempts = limiter.getAttempts(metrics, currentDate);

            expect(attempts).toBe(5);
        });

        test("Should return only current window attempts when no previous window exists", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const currentDate = new Date(baseTime + 30_000);
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 7,
            };
            const attempts = limiter.getAttempts(metrics, currentDate);

            expect(attempts).toBe(7);
        });

        test("Should return 0 when metrics have no attempts", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentDate = new Date(baseTime + 30_000);
            const attempts = limiter.getAttempts({}, currentDate);

            expect(attempts).toBe(0);
        });

        test("Should decrease previous window weight as time progresses in current window", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 2,
                [currentWindowKey - windowMs]: 10,
            };

            // Early in window (25%): weighted previous = Math.floor(0.75 * 10) = 7, total = 9
            const earlyAttempts = limiter.getAttempts(
                metrics,
                new Date(baseTime + 15_000),
            );
            // Late in window (75%): weighted previous = Math.floor(0.25 * 10) = 2, total = 4
            const lateAttempts = limiter.getAttempts(
                metrics,
                new Date(baseTime + 45_000),
            );

            expect(earlyAttempts).toBe(9);
            expect(lateAttempts).toBe(4);
            expect(earlyAttempts).toBeGreaterThan(lateAttempts);
        });
    });

    describe("method: updateMetrics", () => {
        test("Should increment the current window attempt count", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const currentDate = new Date(baseTime + 30_000);
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
                [currentWindowKey - windowMs]: 4,
            };
            const newMetrics = limiter.updateMetrics(metrics, currentDate);

            expect(newMetrics[currentWindowKey]).toBe(4);
        });

        test("Should preserve previous window data", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const previousWindowKey = currentWindowKey - windowMs;
            const currentDate = new Date(baseTime + 30_000);
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 2,
                [previousWindowKey]: 5,
            };
            const newMetrics = limiter.updateMetrics(metrics, currentDate);

            expect(newMetrics[previousWindowKey]).toBe(5);
        });

        test("Should cleanup windows older than previous window", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const windowMs = window.toMilliseconds();
            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const oldWindowKey = currentWindowKey - windowMs * 3;
            const currentDate = new Date(baseTime + 30_000);
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 2,
                [oldWindowKey]: 10,
            };
            const newMetrics = limiter.updateMetrics(metrics, currentDate);

            expect(newMetrics[oldWindowKey]).toBeUndefined();
            expect(newMetrics[currentWindowKey]).toBe(3);
        });

        test("Should create current window entry if it does not exist", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const currentDate = new Date(baseTime + 30_000);
            const newMetrics = limiter.updateMetrics({}, currentDate);

            expect(newMetrics[currentWindowKey]).toBe(1);
        });

        test("Should not mutate the input metrics object", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new SlidingWindowLimiter({ window });

            const baseTime = new Date("2025-12-24T00:00:00.000Z").getTime();
            const currentWindowKey = baseTime;
            const currentDate = new Date(baseTime + 30_000);
            const metrics: SlidingWindowLimiterState = {
                [currentWindowKey]: 3,
            };
            const newMetrics = limiter.updateMetrics(metrics, currentDate);

            expect(metrics[currentWindowKey]).toBe(3);
            expect(newMetrics[currentWindowKey]).toBe(4);
            expect(newMetrics).not.toBe(metrics);
        });
    });

    describe("method: isEqual", () => {
        test.todo("Write tests!!!");
    });
});
