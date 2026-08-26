import { describe, expect, test } from "vitest";

import {
    isCircuitBreakerError,
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
} from "@/circuit-breaker/contracts/circuit-breaker.errors.js";

describe("file: circuit-breaker.errors.ts", () => {
    describe("function: isCircuitBreakerError", () => {
        test("Should return true when given OpenCircuitBreakerError instance", () => {
            const error = OpenCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given IsolatedCircuitBreakerError instance", () => {
            const error = IsolatedCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCircuitBreakerError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCircuitBreakerError("")).toBe(false);
            expect(isCircuitBreakerError(null)).toBe(false);
        });
    });
});
