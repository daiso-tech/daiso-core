import { describe, expect, test } from "vitest";

import {
    FailedRefreshSemaphoreError,
    FailedReleaseSemaphoreError,
    isSemaphoreError,
    LimitReachedSemaphoreError,
} from "@/semaphore/contracts/semaphore.errors.js";

describe("file: semaphore.errors.ts", () => {
    describe("function: isSemaphoreError", () => {
        test("Should return true when given LimitReachedSemaphoreError instance", () => {
            const error = LimitReachedSemaphoreError.create("a");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedRefreshSemaphoreError instance", () => {
            const error = FailedRefreshSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedReleaseSemaphoreError instance", () => {
            const error = FailedReleaseSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isSemaphoreError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isSemaphoreError("")).toBe(false);
            expect(isSemaphoreError(null)).toBe(false);
        });
    });
});
