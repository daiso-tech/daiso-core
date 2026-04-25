import { describe, expect, test } from "vitest";

import {
    callInvokable,
    getInvokableName,
    isInvokable,
    isInvokableFn,
    isInvokableObject,
    resolveInvokable,
    type IInvokableObject,
    type InvokableFn,
} from "@/utilities/functions/_module.js";

describe("file: invokable.ts", () => {
    describe("function: isInvokableObject", () => {
        test("Should return false when given InvokableFn", () => {
            const invokable: InvokableFn<[], string> = () => "";
            expect(isInvokableObject(invokable)).toBe(false);
        });
        test("Should return true when given IInvokableObject", () => {
            const invokable: IInvokableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvokableObject(invokable)).toBe(true);
        });
        test("Should return false when given not InvokableFn or IInvokableObject", () => {
            expect(isInvokableObject("")).toBe(false);
        });
    });
    describe("function: isInvokableFn", () => {
        test("Should return true when given InvokableFn", () => {
            const invokable: InvokableFn<[], string> = () => "";
            expect(isInvokableFn(invokable)).toBe(true);
        });
        test("Should return false when given IInvokableObject", () => {
            const invokable: IInvokableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvokableFn(invokable)).toBe(false);
        });
        test("Should return false when given not InvokableFn or IInvokableObject", () => {
            expect(isInvokableFn("")).toBe(false);
        });
    });
    describe("function: isInvokable", () => {
        test("Should return true when given InvokableFn", () => {
            const invokable: InvokableFn<[], string> = () => "";
            expect(isInvokable(invokable)).toBe(true);
        });
        test("Should return true when given IInvokableObject", () => {
            const invokable: IInvokableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(isInvokable(invokable)).toBe(true);
        });
        test("Should return false when given not InvokableFn or IInvokableObject", () => {
            expect(isInvokable("")).toBe(false);
        });
    });
    describe("function: resolveInvokable", () => {
        test("Should return InvokableFn when given InvokableFn", () => {
            const invokable: InvokableFn<[], string> = () => "";
            expect(resolveInvokable(invokable)).toBeTypeOf("function");
        });
        test("Should return InvokableFn when given IInvokableObject", () => {
            const invokable: IInvokableObject<[], string> = {
                invoke(): string {
                    return "";
                },
            };
            expect(resolveInvokable(invokable)).toBeTypeOf("function");
        });
    });
    describe("function: callInvokable", () => {
        test("Should resolve function", () => {
            function fn(str: string): string {
                return str + str;
            }
            expect(callInvokable(fn, "ab")).toBe("abab");
        });
        test("Should resolve object literal IInvokableObject", () => {
            const invokable: IInvokableObject<[str: string], string> & {
                STR: string;
            } = {
                invoke(str: string): string {
                    return str + str + this.STR;
                },
                STR: "CONST",
            };
            expect(callInvokable(invokable, "ab")).toBe("ababCONST");
        });
        test("Should resolve class IInvokableObject", () => {
            class Invokable implements IInvokableObject<[str: string], string> {
                invoke(str: string): string {
                    return str + str + this.STR;
                }
                public readonly STR = "CONST";
            }
            const invokable = new Invokable();
            expect(callInvokable(invokable, "ab")).toBe("ababCONST");
        });
    });
    describe("function: getInvokableName", () => {
        test("Should get name of function", () => {
            function fn(str: string): string {
                return str + str;
            }
            expect(getInvokableName(fn)).toBe(fn.name);
        });
        test("Should get name of class", () => {
            class Invokable implements IInvokableObject<[str: string], string> {
                invoke(str: string): string {
                    return str + str + this.STR;
                }
                public readonly STR = "CONST";
            }
            const invokable = new Invokable();
            expect(getInvokableName(invokable)).toBe(Invokable.name);
        });
    });
});
