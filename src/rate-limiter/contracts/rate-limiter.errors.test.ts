import { describe, expect, test } from "vitest";

import {
    BlockedRateLimiterError,
    isRateLimiterError,
} from "@/rate-limiter/contracts/rate-limiter.errors.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("file: rate-limiter.errors.ts", () => {
    describe("function: isRateLimiterError", () => {
        test("Should return true when given BlockedRateLimiterError instance", () => {
            const error = BlockedRateLimiterError.create(
                {
                    limit: 5,
                    totalAttempts: 7,
                    exceedAttempts: 2,
                    retryAfter: TimeSpan.fromSeconds(1),
                },
                "a",
            );
            expect(isRateLimiterError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isRateLimiterError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isRateLimiterError("")).toBe(false);
            expect(isRateLimiterError(null)).toBe(false);
        });
    });
});
