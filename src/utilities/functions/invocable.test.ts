import { describe, expect, test } from "vitest";

import {
    callInvocable,
    getInvocableName,
    isInvocable,
    isInvocableFn,
    isInvocableObject,
    resolveInvocable,
} from "@/utilities/functions/_module.js";

import type {
    IInvocableObject,
    InvocableFn,
} from "@/utilities/functions/_module.js";

describe("file: invocable.ts", () => {
    describe("function: isInvocableObject", () => {
        test("Should return false when given InvocableFn", () => {
            const invocable: InvocableFn<[], string> = () => "";
            expect(isInvocableObject(invocable)).toBe(false);
        });
        test("Should return true when given IInvocableObject", () => {
            const invocable: IInvocableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvocableObject(invocable)).toBe(true);
        });
        test("Should return false when given not InvocableFn or IInvocableObject", () => {
            expect(isInvocableObject("")).toBe(false);
        });
    });
    describe("function: isInvocableFn", () => {
        test("Should return true when given InvocableFn", () => {
            const invocable: InvocableFn<[], string> = () => "";
            expect(isInvocableFn(invocable)).toBe(true);
        });
        test("Should return false when given IInvocableObject", () => {
            const invocable: IInvocableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvocableFn(invocable)).toBe(false);
        });
        test("Should return false when given not InvocableFn or IInvocableObject", () => {
            expect(isInvocableFn("")).toBe(false);
        });
    });
    describe("function: isInvocable", () => {
        test("Should return true when given InvocableFn", () => {
            const invocable: InvocableFn<[], string> = () => "";
            expect(isInvocable(invocable)).toBe(true);
        });
        test("Should return true when given IInvocableObject", () => {
            const invocable: IInvocableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvocable(invocable)).toBe(true);
        });
        test("Should return false when given not InvocableFn or IInvocableObject", () => {
            expect(isInvocable("")).toBe(false);
        });
    });
    describe("function: resolveInvocable", () => {
        test("Should return InvocableFn when given InvocableFn", () => {
            const invocable: InvocableFn<[], string> = () => "";
            expect(resolveInvocable(invocable)).toBeTypeOf("function");
        });
        test("Should return InvocableFn when given IInvocableObject", () => {
            const invocable: IInvocableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(resolveInvocable(invocable)).toBeTypeOf("function");
        });
    });
    describe("function: callInvocable", () => {
        test("Should resolve function", () => {
            function fn(str: string): string {
                return str + str;
            }
            expect(callInvocable(fn, "ab")).toBe("abab");
        });
        test("Should resolve object literal IInvocableObject", () => {
            const invocable: IInvocableObject<[str: string], string> & {
                STR: string;
            } = {
                invoke(str: string): string {
                    return str + str + this.STR;
                },
                STR: "CONST",
            };
            expect(callInvocable(invocable, "ab")).toBe("ababCONST");
        });
        test("Should resolve class IInvocableObject", () => {
            class Invocable implements IInvocableObject<[str: string], string> {
                invoke(str: string): string {
                    return str + str + this.STR;
                }
                public readonly STR = "CONST";
            }
            const invocable = new Invocable();
            expect(callInvocable(invocable, "ab")).toBe("ababCONST");
        });
    });
    describe("function: getInvocableName", () => {
        test("Should get name of function", () => {
            function fn(str: string): string {
                return str + str;
            }
            expect(getInvocableName(fn)).toBe(fn.name);
        });
        test("Should get name of class", () => {
            class Invocable implements IInvocableObject<[str: string], string> {
                invoke(str: string): string {
                    return str + str + this.STR;
                }
                public readonly STR = "CONST";
            }
            const invocable = new Invocable();
            expect(getInvocableName(invocable)).toBe(Invocable.name);
        });
    });
});
