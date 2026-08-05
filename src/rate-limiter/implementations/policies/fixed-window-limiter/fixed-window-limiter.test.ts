import { describe, expect, test } from "vitest";

import { FixedWindowLimiter } from "@/rate-limiter/implementations/policies/fixed-window-limiter/fixed-window-limiter.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";

import type { FixedWindowLimiterState } from "@/rate-limiter/implementations/policies/fixed-window-limiter/fixed-window-limiter.js";

describe("class: FixedWindowLimiter", () => {
    describe("method: initialMetrics", () => {
        test("Should return state with attempt 0 and lastAttemptAt set to currentDate", () => {
            const limiter = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const currentDate = new Date("2025-12-24");
            const metrics = limiter.initialMetrics(currentDate);

            expect(metrics).toEqual({
                attempt: 0,
                lastAttemptAt: currentDate.getTime(),
            } satisfies FixedWindowLimiterState);
        });
    });
    describe("method: shouldBlock", () => {
        test("Should return false when attempt is less than limit and window time has not exceeded", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new FixedWindowLimiter({
                window,
            });

            const lastAttemptAt = new Date("2025-12-24");
            const limit = 5;
            const currentDate = window.divide(2).toEndDate(lastAttemptAt);
            const result = limiter.shouldBlock(
                {
                    attempt: 3,
                    lastAttemptAt: lastAttemptAt.getTime(),
                },
                limit,
                currentDate,
            );

            expect(result).toBe(false);
        });
        test("Should return false when attempt is equal to limit and window time has exceeded", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new FixedWindowLimiter({
                window,
            });

            const lastAttemptAt = new Date("2025-12-24");
            const limit = 5;
            const currentDate = window.addSeconds(30).toEndDate(lastAttemptAt);
            const result = limiter.shouldBlock(
                {
                    attempt: limit,
                    lastAttemptAt: lastAttemptAt.getTime(),
                },
                limit,
                currentDate,
            );

            expect(result).toBe(false);
        });
        test("Should return true when attempt is greater than to limit and window time has not exceeded", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new FixedWindowLimiter({
                window,
            });

            const lastAttemptAt = new Date("2025-12-24");
            const limit = 5;
            const currentDate = window.divide(2).toEndDate(lastAttemptAt);
            const result = limiter.shouldBlock(
                {
                    attempt: 6,
                    lastAttemptAt: lastAttemptAt.getTime(),
                },
                limit,
                currentDate,
            );

            expect(result).toBe(true);
        });
    });
    describe("method: getExpiration", () => {
        test("Should extract the expiration from the metrics object", () => {
            const window = TimeSpan.fromMinutes(1);
            const limiter = new FixedWindowLimiter({
                window,
            });

            const currentDate = new Date("2025-12-24");
            const metrics: FixedWindowLimiterState = {
                attempt: 4,
                lastAttemptAt: currentDate.getTime(),
            };
            const expiration = limiter.getExpiration(metrics, currentDate);

            expect(expiration).toEqual(window.toEndDate(currentDate));
        });
    });
    describe("method: getAttempts", () => {
        test("Should extract the attempt from the metrics object", () => {
            const limiter = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const currentDate = new Date("2025-12-24");
            const metrics: FixedWindowLimiterState = {
                attempt: 4,
                lastAttemptAt: currentDate.getTime(),
            };
            const attempts = limiter.getAttempts(metrics, currentDate);

            expect(attempts).toBe(4);
        });
    });
    describe("method: updateMetrics", () => {
        test("Should increment attempt field", () => {
            const limiter = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const currentDate = new Date("2025-12-24");
            const metrics: FixedWindowLimiterState = {
                attempt: 2,
                lastAttemptAt: currentDate.getTime(),
            };
            const newMetrics = limiter.updateMetrics(metrics, currentDate);

            expect(newMetrics).toEqual({
                attempt: 3,
                lastAttemptAt: currentDate.getTime(),
            } satisfies FixedWindowLimiterState);
        });
    });
});
