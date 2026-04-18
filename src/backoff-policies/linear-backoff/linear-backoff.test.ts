import { describe, expect, test } from "vitest";

import {
    linearBackoff,
    resolveLinearBackoffSettings,
} from "@/backoff-policies/linear-backoff/linear-backoff.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

describe("function: resolveLinearBackoffSettings", () => {
    test("Should use default values when no settings are provided", () => {
        const resolved = resolveLinearBackoffSettings({});

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(60_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(500);
        expect(resolved.jitter).toBe(0.5);
    });

    test("Should use provided values", () => {
        const resolved = resolveLinearBackoffSettings({
            maxDelay: TimeSpan.fromSeconds(30),
            minDelay: TimeSpan.fromMilliseconds(100),
            jitter: 0.2,
        });

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(30_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(100);
        expect(resolved.jitter).toBe(0.2);
    });

    test("Should allow null jitter", () => {
        const resolved = resolveLinearBackoffSettings({
            jitter: null,
        });

        expect(resolved.jitter).toBeNull();
    });

    test("Should throw TypeError when minDelay is zero", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(0),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is negative", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(-100),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is NaN", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when maxDelay is NaN", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when maxDelay is less than minDelay", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(100),
                minDelay: TimeSpan.fromMilliseconds(200),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when jitter is negative", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                jitter: -0.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is greater than 1", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                jitter: 1.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is NaN", () => {
        expect(() =>
            resolveLinearBackoffSettings({
                jitter: NaN,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });
});

describe("function: linearBackoff", () => {
    test("Should grow linearly with each attempt", () => {
        const backoff = linearBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            jitter: null,
        });

        // 500 * 1 = 500
        expect(callInvokable(backoff, 1, undefined)[TO_MILLISECONDS]()).toBe(
            500,
        );
        // 500 * 2 = 1000
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            1000,
        );
        // 500 * 3 = 1500
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            1500,
        );
    });

    test("Should cap at maxDelay", () => {
        const backoff = linearBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromMilliseconds(1200),
            jitter: null,
        });

        // 500 * 3 = 1500, capped at 1200
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            1200,
        );
    });

    test("Should apply jitter to the delay", () => {
        const backoff = linearBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            jitter: 0.5,
            _mathRandom: () => 0.5,
        });

        // attempt=2: 500 * 2 = 1000, jitter: (1 - 0.5 * 0.5) * 1000 = 750
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            750,
        );
    });
});
