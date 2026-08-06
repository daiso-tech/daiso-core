import { describe, expect, test } from "vitest";

import {
    isAsyncLazy,
    isLazy,
    resolveAsyncLazyable,
    resolveLazyable,
} from "@/utilities/functions/lazy.js";

import type {
    IInvocableObject,
    InvocableFn,
} from "@/utilities/functions/_module.js";
import type { Promisable } from "@/utilities/types/_module.js";

describe("file: lazy.ts", () => {
    describe("function: isLazy", () => {
        test("Should return true when given a InvocableFn", () => {
            const invocable: InvocableFn<[], string> = () => "";
            expect(isLazy(invocable)).toBe(true);
        });
        test("Should return true when given a IInvocableObject", () => {
            const invocableObject: IInvocableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isLazy(invocableObject)).toBe(true);
        });
        test("Should return false when given not IInvocableObject and InvocableFn", () => {
            expect(isLazy("")).toBe(false);
        });
    });
    describe("function: isAsyncLazy", () => {
        test("Should return true when given a InvocableFn", () => {
            const invocable: InvocableFn<[], Promisable<string>> = () => "";
            expect(isAsyncLazy(invocable)).toBe(true);
        });
        test("Should return true when given a IInvocableObject", () => {
            const invocableObject: IInvocableObject<[], Promisable<string>> = {
                invoke(): Promisable<string> {
                    return "";
                },
            };
            expect(isAsyncLazy(invocableObject)).toBe(true);
        });
        test("Should return false when given not IInvocableObject and InvocableFn", () => {
            expect(isAsyncLazy("")).toBe(false);
        });
    });
    describe("function: resolveLazyable", () => {
        test("Should return value when given IInvocableObject", () => {
            const str = "TEXT";
            const factory: IInvocableObject<[], string> = {
                invoke(): string {
                    return str;
                },
            };
            expect(resolveLazyable(factory)).toBe(str);
        });
        test("Should return value when given InvocableFn", () => {
            const str = "TEXT";
            const factory: InvocableFn<[], string> = function (): string {
                return str;
            };
            expect(resolveLazyable(factory)).toBe(str);
        });
        test("Should return value when given not IInvocableObject or InvocableFn", () => {
            const str = "TEXT";
            expect(resolveLazyable(str)).toBe(str);
        });
    });
    describe("function: resolveAsyncLazyable", () => {
        test("Should return value when given IInvocableObject", async () => {
            const str = "TEXT";
            const factory: IInvocableObject<[], Promisable<string>> = {
                invoke(): Promisable<string> {
                    return str;
                },
            };
            expect(await resolveAsyncLazyable(factory)).toBe(str);
        });
        test("Should return value when given InvocableFn", async () => {
            const str = "TEXT";
            const factory: InvocableFn<
                [],
                Promisable<string>
            > = function (): string {
                return str;
            };
            expect(await resolveAsyncLazyable(factory)).toBe(str);
        });
        test("Should return value when given not IInvocableObject or InvocableFn", async () => {
            const str = "TEXT";
            expect(await resolveAsyncLazyable(str)).toBe(str);
        });
    });
});
