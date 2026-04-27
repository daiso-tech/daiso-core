import { describe, expect, test } from "vitest";

import {
    constantBackoff,
    resolveConstantBackoffSettings,
} from "@/backoff-policies/implementations/constant-backoff/constant-backoff.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

describe("function: resolveConstantBackoffSettings", () => {
    test("Should use default values when no settings are provided", () => {
        const resolved = resolveConstantBackoffSettings({});

        expect(resolved.delay[TO_MILLISECONDS]()).toBe(1000);
        expect(resolved.jitter).toBe(0.5);
    });

    test("Should use provided delay", () => {
        const resolved = resolveConstantBackoffSettings({
            delay: TimeSpan.fromMilliseconds(200),
        });

        expect(resolved.delay[TO_MILLISECONDS]()).toBe(200);
    });

    test("Should use provided jitter", () => {
        const resolved = resolveConstantBackoffSettings({
            jitter: 0.3,
        });

        expect(resolved.jitter).toBe(0.3);
    });

    test("Should allow null jitter", () => {
        const resolved = resolveConstantBackoffSettings({
            jitter: null,
        });

        expect(resolved.jitter).toBeNull();
    });

    test("Should throw TypeError when delay is zero", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                delay: TimeSpan.fromMilliseconds(0),
            }),
        ).toThrow("'delay' must be positive");
    });

    test("Should throw TypeError when delay is negative", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                delay: TimeSpan.fromMilliseconds(-100),
            }),
        ).toThrow("'delay' must be positive");
    });

    test("Should throw TypeError when delay is NaN", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                delay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'delay' must be positive");
    });

    test("Should throw TypeError when jitter is negative", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                jitter: -0.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is greater than 1", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                jitter: 1.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is NaN", () => {
        expect(() =>
            resolveConstantBackoffSettings({
                jitter: NaN,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });
});

describe("function: constantBackoff", () => {
    test("Should return the fixed delay when jitter is null", () => {
        const backoff = constantBackoff({
            delay: TimeSpan.fromMilliseconds(500),
            jitter: null,
        });

        const result = callInvokable(backoff, 1, undefined);

        expect(result[TO_MILLISECONDS]()).toBe(500);
    });

    test("Should return the same delay regardless of attempt number", () => {
        const backoff = constantBackoff({
            delay: TimeSpan.fromMilliseconds(500),
            jitter: null,
        });

        const result1 = callInvokable(backoff, 1, undefined);
        const result2 = callInvokable(backoff, 5, undefined);
        const result3 = callInvokable(backoff, 10, undefined);

        expect(result1[TO_MILLISECONDS]()).toBe(500);
        expect(result2[TO_MILLISECONDS]()).toBe(500);
        expect(result3[TO_MILLISECONDS]()).toBe(500);
    });

    test("Should apply jitter to the delay", () => {
        const backoff = constantBackoff({
            delay: TimeSpan.fromMilliseconds(1000),
            jitter: 0.5,
            _mathRandom: () => 0.5,
        });

        const result = callInvokable(backoff, 1, undefined);

        // (1 - 0.5 * 0.5) * 1000 = 750
        expect(result[TO_MILLISECONDS]()).toBe(750);
    });
});
