import { describe, expect, test } from "vitest";

import {
    type IInvokableObject,
    type InvokableFn,
} from "@/utilities/functions/_module.js";
import {
    isAsyncLazy,
    isLazy,
    resolveAsyncLazyable,
    resolveLazyable,
} from "@/utilities/functions/lazy.js";
import { type Promisable } from "@/utilities/types/_module.js";

describe("file: lazy.ts", () => {
    describe("function: isLazy", () => {
        test("Should return true when given a InvokableFn", () => {
            const invokable: InvokableFn<[], string> = () => "";
            expect(isLazy(invokable)).toBe(true);
        });
        test("Should return true when given a IInvokableObject", () => {
            const invokableObject: IInvokableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isLazy(invokableObject)).toBe(true);
        });
        test("Should return false when given not IInvokableObject and InvokableFn", () => {
            expect(isLazy("")).toBe(false);
        });
    });
    describe("function: isAsyncLazy", () => {
        test("Should return true when given a InvokableFn", () => {
            const invokable: InvokableFn<[], Promisable<string>> = () => "";
            expect(isAsyncLazy(invokable)).toBe(true);
        });
        test("Should return true when given a IInvokableObject", () => {
            const invokableObject: IInvokableObject<[], Promisable<string>> = {
                invoke(): Promisable<string> {
                    return "";
                },
            };
            expect(isAsyncLazy(invokableObject)).toBe(true);
        });
        test("Should return false when given not IInvokableObject and InvokableFn", () => {
            expect(isAsyncLazy("")).toBe(false);
        });
    });
    describe("function: resolveLazyable", () => {
        test("Should return value when given IInvokableObject", () => {
            const str = "TEXT";
            const factory: IInvokableObject<[], string> = {
                invoke(): string {
                    return str;
                },
            };
            expect(resolveLazyable(factory)).toBe(str);
        });
        test("Should return value when given InvokableFn", () => {
            const str = "TEXT";
            const factory: InvokableFn<[], string> = function (): string {
                return str;
            };
            expect(resolveLazyable(factory)).toBe(str);
        });
        test("Should return value when given not IInvokableObject or InvokableFn", () => {
            const str = "TEXT";
            expect(resolveLazyable(str)).toBe(str);
        });
    });
    describe("function: resolveAsyncLazyable", () => {
        test("Should return value when given IInvokableObject", async () => {
            const str = "TEXT";
            const factory: IInvokableObject<[], Promisable<string>> = {
                invoke(): Promisable<string> {
                    return str;
                },
            };
            expect(await resolveAsyncLazyable(factory)).toBe(str);
        });
        test("Should return value when given InvokableFn", async () => {
            const str = "TEXT";
            const factory: InvokableFn<
                [],
                Promisable<string>
            > = function (): string {
                return str;
            };
            expect(await resolveAsyncLazyable(factory)).toBe(str);
        });
        test("Should return value when given not IInvokableObject or InvokableFn", async () => {
            const str = "TEXT";
            expect(await resolveAsyncLazyable(str)).toBe(str);
        });
    });
});
