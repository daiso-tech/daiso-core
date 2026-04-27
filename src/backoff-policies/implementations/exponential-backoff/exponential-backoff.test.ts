import { describe, expect, test } from "vitest";

import {
    exponentialBackoff,
    resolveExponentialBackoffSettings,
} from "@/backoff-policies/implementations/exponential-backoff/exponential-backoff.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

describe("function: resolveExponentialBackoffSettings", () => {
    test("Should use default values when no settings are provided", () => {
        const resolved = resolveExponentialBackoffSettings({});

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(60_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(500);
        expect(resolved.multiplier).toBe(2);
        expect(resolved.jitter).toBe(0.5);
    });

    test("Should use provided values", () => {
        const resolved = resolveExponentialBackoffSettings({
            maxDelay: TimeSpan.fromSeconds(30),
            minDelay: TimeSpan.fromMilliseconds(100),
            multiplier: 3,
            jitter: 0.2,
        });

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(30_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(100);
        expect(resolved.multiplier).toBe(3);
        expect(resolved.jitter).toBe(0.2);
    });

    test("Should allow null jitter", () => {
        const resolved = resolveExponentialBackoffSettings({
            jitter: null,
        });

        expect(resolved.jitter).toBeNull();
    });

    test("Should throw TypeError when minDelay is zero", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(0),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is negative", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(-100),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is NaN", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when maxDelay is NaN", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when maxDelay is less than minDelay", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(100),
                minDelay: TimeSpan.fromMilliseconds(200),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when multiplier is zero", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                multiplier: 0,
            }),
        ).toThrow("'multiplier' must be positive");
    });

    test("Should throw TypeError when multiplier is negative", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                multiplier: -1,
            }),
        ).toThrow("'multiplier' must be positive");
    });

    test("Should throw TypeError when multiplier is NaN", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                multiplier: NaN,
            }),
        ).toThrow("'multiplier' must be positive");
    });

    test("Should throw TypeError when jitter is negative", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                jitter: -0.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is greater than 1", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                jitter: 1.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is NaN", () => {
        expect(() =>
            resolveExponentialBackoffSettings({
                jitter: NaN,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });
});

describe("function: exponentialBackoff", () => {
    test("Should return minDelay on attempt 0 when jitter is null", () => {
        const backoff = exponentialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            multiplier: 2,
            jitter: null,
        });

        const result = callInvokable(backoff, 0, undefined);

        // 500 * 2^0 = 500
        expect(result[TO_MILLISECONDS]()).toBe(500);
    });

    test("Should grow exponentially with each attempt", () => {
        const backoff = exponentialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            multiplier: 2,
            jitter: null,
        });

        // 500 * 2^1 = 1000
        expect(callInvokable(backoff, 1, undefined)[TO_MILLISECONDS]()).toBe(
            1000,
        );
        // 500 * 2^2 = 2000
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            2000,
        );
        // 500 * 2^3 = 4000
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            4000,
        );
    });

    test("Should cap at maxDelay", () => {
        const backoff = exponentialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromMilliseconds(3000),
            multiplier: 2,
            jitter: null,
        });

        // 500 * 2^3 = 4000, capped at 3000
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            3000,
        );
    });

    test("Should apply jitter to the delay", () => {
        const backoff = exponentialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            multiplier: 2,
            jitter: 0.5,
            _mathRandom: () => 0.5,
        });

        // attempt=1: 500 * 2^1 = 1000, jitter: (1 - 0.5 * 0.5) * 1000 = 750
        expect(callInvokable(backoff, 1, undefined)[TO_MILLISECONDS]()).toBe(
            750,
        );
    });
});
