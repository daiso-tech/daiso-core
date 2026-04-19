import { beforeEach, describe, expect, test, vi } from "vitest";

import { useFactory, type Use } from "@/middleware/use-factory.js";
import { fallback } from "@/resilience/fallback/fallback.js";

describe("function: fallback", () => {
    let use: Use;
    beforeEach(() => {
        use = useFactory();
    });

    describe("basic fallback behavior", () => {
        test("Should return original value when function succeeds", async () => {
            const fn = use(
                (): Promise<string> => Promise.resolve("success"),
                [fallback({ fallbackValue: "fallback" })],
            );
            expect(await fn()).toBe("success");
        });

        test("Should return fallback value when function throws", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [fallback({ fallbackValue: "fallback" })]);
            expect(await fn()).toBe("fallback");
        });

        test("Should return lazy fallback value when function throws", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [fallback({ fallbackValue: () => "lazy-fallback" })]);
            expect(await fn()).toBe("lazy-fallback");
        });

        test("Should return async lazy fallback value when function throws", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [
                fallback({
                    fallbackValue: () => Promise.resolve("async-lazy-fallback"),
                }),
            ]);
            expect(await fn()).toBe("async-lazy-fallback");
        });

        test("Should pass arguments through to the original function", async () => {
            const fn = use(
                (a: number, b: number): Promise<number> =>
                    Promise.resolve(a + b),
                [fallback({ fallbackValue: 0 })],
            );
            expect(await fn(2, 3)).toBe(5);
        });
    });

    describe("onFallback callback", () => {
        test("Should call onFallback when fallback is triggered by thrown error", async () => {
            const onFallbackFn = vi.fn();
            const error = new Error("fail");
            const fn = use((): Promise<string> => {
                throw error;
            }, [
                fallback({
                    fallbackValue: "fallback",
                    onFallback: onFallbackFn,
                }),
            ]);
            await fn();
            // Allow the fire-and-forget async callback to complete
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(onFallbackFn).toHaveBeenCalledOnce();
            expect(onFallbackFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    error,
                    fallbackValue: "fallback",
                }),
            );
        });

        test("Should call onFallback when fallback is triggered by return value error policy", async () => {
            const onFallbackFn = vi.fn();
            const fn = use(
                (): Promise<boolean> => Promise.resolve(false),
                [
                    fallback({
                        fallbackValue: true,
                        errorPolicy: { treatFalseAsError: true },
                        onFallback: onFallbackFn,
                    }),
                ],
            );
            await fn();
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(onFallbackFn).toHaveBeenCalledOnce();
            expect(onFallbackFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: false,
                    fallbackValue: true,
                }),
            );
        });

        test("Should not call onFallback when function succeeds", async () => {
            const onFallbackFn = vi.fn();
            const fn = use(
                (): Promise<string> => Promise.resolve("success"),
                [
                    fallback({
                        fallbackValue: "fallback",
                        onFallback: onFallbackFn,
                    }),
                ],
            );
            await fn();
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(onFallbackFn).not.toHaveBeenCalled();
        });

        test("Should not throw when onFallback callback throws", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [
                fallback({
                    fallbackValue: "fallback",
                    onFallback: () => {
                        return Promise.reject(new Error("callback error"));
                    },
                }),
            ]);
            expect(await fn()).toBe("fallback");
        });

        test("Should include args in onFallback data", async () => {
            const onFallbackFn = vi.fn();
            const fn = use(
                async (_a: number, _b: string): Promise<string> => {
                    return Promise.reject(new Error("fail"));
                },
                [
                    fallback({
                        fallbackValue: "fallback",
                        onFallback: onFallbackFn,
                    }),
                ],
            );
            await fn(42, "hello");
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(onFallbackFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    args: [42, "hello"],
                }),
            );
        });
    });

    describe("ErrorPolicyBoolSetting (return value error policy)", () => {
        test("Should return fallback value when treatFalseAsError is true and function returns false", async () => {
            const fn = use(
                (): Promise<boolean> => Promise.resolve(false),
                [
                    fallback({
                        fallbackValue: true,
                        errorPolicy: { treatFalseAsError: true },
                    }),
                ],
            );
            expect(await fn()).toBe(true);
        });

        test("Should return original value when treatFalseAsError is true and function returns true", async () => {
            const fn = use(
                (): Promise<boolean> => Promise.resolve(true),
                [
                    fallback({
                        fallbackValue: false,
                        errorPolicy: { treatFalseAsError: true },
                    }),
                ],
            );
            expect(await fn()).toBe(true);
        });

        test("Should return original value when treatFalseAsError is false and function returns false", async () => {
            const fn = use(
                (): Promise<boolean> => Promise.resolve(false),
                [
                    fallback({
                        fallbackValue: true,
                        errorPolicy: { treatFalseAsError: false },
                    }),
                ],
            );
            expect(await fn()).toBe(false);
        });

        test("Should not use fallback for thrown errors when errorPolicy is ErrorPolicyBoolSetting", async () => {
            const fn = use((): Promise<boolean> => {
                return Promise.reject(new Error("fail"));
            }, [
                fallback({
                    fallbackValue: true,
                    errorPolicy: { treatFalseAsError: true },
                }),
            ]);
            await expect(fn()).rejects.toThrow("fail");
        });
    });

    describe("thrown error policies", () => {
        test("Should return fallback when errorPolicy is not set and function throws", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [fallback({ fallbackValue: "fallback" })]);
            expect(await fn()).toBe("fallback");
        });

        test("Should return fallback when errorPolicy is a class and thrown error matches", async () => {
            class CustomError extends Error {}
            const fn = use((): Promise<string> => {
                throw new CustomError("fail");
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: CustomError,
                }),
            ]);
            expect(await fn()).toBe("fallback");
        });

        test("Should rethrow when errorPolicy is a class and thrown error does not match", async () => {
            class CustomErrorA extends Error {}
            class CustomErrorB extends Error {}
            const fn = use((): Promise<string> => {
                throw new CustomErrorB("fail");
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: CustomErrorA,
                }),
            ]);
            await expect(fn()).rejects.toThrow(CustomErrorB);
        });

        test("Should return fallback when errorPolicy is an array of classes and thrown error matches one", async () => {
            class CustomErrorA extends Error {}
            class CustomErrorB extends Error {}
            const fn = use((): Promise<string> => {
                throw new CustomErrorB("fail");
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: [CustomErrorA, CustomErrorB],
                }),
            ]);
            expect(await fn()).toBe("fallback");
        });

        test("Should rethrow when errorPolicy is an array of classes and thrown error matches none", async () => {
            class CustomErrorA extends Error {}
            class CustomErrorB extends Error {}
            class CustomErrorC extends Error {}
            const fn = use((): Promise<string> => {
                throw new CustomErrorC("fail");
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: [CustomErrorA, CustomErrorB],
                }),
            ]);
            await expect(fn()).rejects.toThrow(CustomErrorC);
        });

        test("Should return fallback when errorPolicy is a predicate function that returns true", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("specific-error"));
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: (error: unknown) =>
                        error instanceof Error &&
                        error.message === "specific-error",
                }),
            ]);
            expect(await fn()).toBe("fallback");
        });

        test("Should rethrow when errorPolicy is a predicate function that returns false", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("other-error"));
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: (error: unknown) =>
                        error instanceof Error &&
                        error.message === "specific-error",
                }),
            ]);
            await expect(fn()).rejects.toThrow("other-error");
        });

        test("Should return fallback when errorPolicy is an IInvokableObject that returns true", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: {
                        invoke: () => true,
                    },
                }),
            ]);
            expect(await fn()).toBe("fallback");
        });

        test("Should rethrow when errorPolicy is an IInvokableObject that returns false", async () => {
            const fn = use((): Promise<string> => {
                return Promise.reject(new Error("fail"));
            }, [
                fallback({
                    fallbackValue: "fallback",
                    errorPolicy: {
                        invoke: () => false,
                    },
                }),
            ]);
            await expect(fn()).rejects.toThrow("fail");
        });
    });
});
