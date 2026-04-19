import { describe, expect, test } from "vitest";

import {
    polynomialBackoff,
    resolvePolynomialBackoffSettings,
} from "@/backoff-policies/polynomial-backoff/polynomial-backoff.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

describe("function: resolvePolynomialBackoffSettings", () => {
    test("Should use default values when no settings are provided", () => {
        const resolved = resolvePolynomialBackoffSettings({});

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(60_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(500);
        expect(resolved.degree).toBe(2);
        expect(resolved.jitter).toBe(0.5);
    });

    test("Should use provided values", () => {
        const resolved = resolvePolynomialBackoffSettings({
            maxDelay: TimeSpan.fromSeconds(30),
            minDelay: TimeSpan.fromMilliseconds(100),
            degree: 3,
            jitter: 0.2,
        });

        expect(resolved.maxDelay[TO_MILLISECONDS]()).toBe(30_000);
        expect(resolved.minDelay[TO_MILLISECONDS]()).toBe(100);
        expect(resolved.degree).toBe(3);
        expect(resolved.jitter).toBe(0.2);
    });

    test("Should allow null jitter", () => {
        const resolved = resolvePolynomialBackoffSettings({
            jitter: null,
        });

        expect(resolved.jitter).toBeNull();
    });

    test("Should throw TypeError when minDelay is zero", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(0),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is negative", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(-100),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when minDelay is NaN", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                minDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'minDelay' must be positive");
    });

    test("Should throw TypeError when maxDelay is NaN", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(NaN),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when maxDelay is less than minDelay", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                maxDelay: TimeSpan.fromMilliseconds(100),
                minDelay: TimeSpan.fromMilliseconds(200),
            }),
        ).toThrow("'maxDelay' must be greater than or equal to 'minDelay'");
    });

    test("Should throw TypeError when degree is zero", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                degree: 0,
            }),
        ).toThrow("'degree' must be positive");
    });

    test("Should throw TypeError when degree is negative", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                degree: -1,
            }),
        ).toThrow("'degree' must be positive");
    });

    test("Should throw TypeError when degree is NaN", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                degree: NaN,
            }),
        ).toThrow("'degree' must be positive");
    });

    test("Should throw TypeError when jitter is negative", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                jitter: -0.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is greater than 1", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                jitter: 1.1,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });

    test("Should throw TypeError when jitter is NaN", () => {
        expect(() =>
            resolvePolynomialBackoffSettings({
                jitter: NaN,
            }),
        ).toThrow("'jitter' must be between 0 and 1 or null");
    });
});

describe("function: polynomialBackoff", () => {
    test("Should grow polynomially with each attempt", () => {
        const backoff = polynomialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            degree: 2,
            jitter: null,
        });

        // 500 * 1^2 = 500
        expect(callInvokable(backoff, 1, undefined)[TO_MILLISECONDS]()).toBe(
            500,
        );
        // 500 * 2^2 = 2000
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            2000,
        );
        // 500 * 3^2 = 4500
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            4500,
        );
    });

    test("Should cap at maxDelay", () => {
        const backoff = polynomialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromMilliseconds(3000),
            degree: 2,
            jitter: null,
        });

        // 500 * 3^2 = 4500, capped at 3000
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            3000,
        );
    });

    test("Should use custom degree", () => {
        const backoff = polynomialBackoff({
            minDelay: TimeSpan.fromMilliseconds(100),
            maxDelay: TimeSpan.fromSeconds(60),
            degree: 3,
            jitter: null,
        });

        // 100 * 2^3 = 800
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            800,
        );
        // 100 * 3^3 = 2700
        expect(callInvokable(backoff, 3, undefined)[TO_MILLISECONDS]()).toBe(
            2700,
        );
    });

    test("Should apply jitter to the delay", () => {
        const backoff = polynomialBackoff({
            minDelay: TimeSpan.fromMilliseconds(500),
            maxDelay: TimeSpan.fromSeconds(60),
            degree: 2,
            jitter: 0.5,
            _mathRandom: () => 0.5,
        });

        // attempt=2: 500 * 2^2 = 2000, jitter: (1 - 0.5 * 0.5) * 2000 = 1500
        expect(callInvokable(backoff, 2, undefined)[TO_MILLISECONDS]()).toBe(
            1500,
        );
    });
});
