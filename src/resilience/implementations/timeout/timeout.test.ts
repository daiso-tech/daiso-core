import { beforeEach, describe, expect, test, vi } from "vitest";

import { type Use } from "@/middleware/contracts/_module.js";
import { useFactory } from "@/middleware/implementations/_module.js";
import { TimeoutResilienceError } from "@/resilience/implementations/resilience.errors.js";
import { timeout } from "@/resilience/implementations/timeout/timeout.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/time-span.contract.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/functions/delay.js";

describe("function: timeout", () => {
    let use: Use;

    beforeEach(() => {
        use = useFactory();
    });

    describe("basic timeout behavior", () => {
        test("Should return the result when function completes before timeout", async () => {
            const fn = use(
                (): Promise<string> => Promise.resolve("success"),
                [timeout({ waitTime: TimeSpan.fromMilliseconds(100) })],
            );
            expect(await fn()).toBe("success");
        });

        test("Should throw TimeoutResilienceError when function exceeds wait time", async () => {
            const fn = use(async (): Promise<string> => {
                await delay(TimeSpan.fromMilliseconds(200));
                return "late";
            }, [timeout({ waitTime: TimeSpan.fromMilliseconds(50) })]);
            await expect(fn()).rejects.toThrow(TimeoutResilienceError);
        });

        test("Should include the configured waitTime in TimeoutResilienceError", async () => {
            const waitTime = TimeSpan.fromMilliseconds(50);
            const fn = use(async (): Promise<string> => {
                await delay(TimeSpan.fromMilliseconds(200));
                return "late";
            }, [timeout({ waitTime })]);
            try {
                await fn();
                expect.unreachable();
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(TimeoutResilienceError);
                const timeoutError = error as TimeoutResilienceError;
                expect(timeoutError.waitTime.toMilliseconds()).toBe(
                    waitTime.toMilliseconds(),
                );
            }
        });

        test("Should rethrow non-timeout errors from the function", async () => {
            const originalError = new Error("original failure");
            const fn = use(
                (): Promise<string> => Promise.reject(originalError),
                [timeout({ waitTime: TimeSpan.fromMilliseconds(100) })],
            );
            await expect(fn()).rejects.toBe(originalError);
        });

        test("Should pass arguments through to the original function", async () => {
            const fn = use(
                (a: number, b: number): Promise<number> =>
                    Promise.resolve(a + b),
                [timeout({ waitTime: TimeSpan.fromMilliseconds(100) })],
            );
            expect(await fn(2, 3)).toBe(5);
        });

        test("Should use default waitTime of 2 seconds when not specified", async () => {
            const fn = use(async (): Promise<string> => {
                await delay(TimeSpan.fromSeconds(3));
                return "late";
            }, [timeout()]);
            await expect(fn()).rejects.toThrow(TimeoutResilienceError);
        }, 5000);
    });

    describe("setting: onTimeout callback", () => {
        test("Should call onTimeout when timeout occurs", async () => {
            const onTimeoutFn = vi.fn();
            const fn = use(async (): Promise<string> => {
                await delay(TimeSpan.fromMilliseconds(200));
                return "late";
            }, [
                timeout({
                    waitTime: TimeSpan.fromMilliseconds(50),
                    onTimeout: onTimeoutFn,
                }),
            ]);
            await expect(fn()).rejects.toThrow(TimeoutResilienceError);
            expect(onTimeoutFn).toHaveBeenCalledOnce();
        });

        test("Should not call onTimeout when function succeeds before timeout", async () => {
            const onTimeoutFn = vi.fn();
            const fn = use(
                (): Promise<string> => Promise.resolve("success"),
                [
                    timeout({
                        waitTime: TimeSpan.fromMilliseconds(100),
                        onTimeout: onTimeoutFn,
                    }),
                ],
            );
            await fn();
            expect(onTimeoutFn).not.toHaveBeenCalled();
        });

        test("Should call onTimeout with correct waitTime and args", async () => {
            const onTimeoutFn = vi.fn();
            const fn = use(
                async (_a: number, _b: string): Promise<string> => {
                    await delay(TimeSpan.fromMilliseconds(200));
                    return "late";
                },
                [
                    timeout({
                        waitTime: TimeSpan.fromMilliseconds(50),
                        onTimeout: onTimeoutFn,
                    }),
                ],
            );
            await expect(fn(42, "hello")).rejects.toThrow(
                TimeoutResilienceError,
            );
            expect(onTimeoutFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    args: [42, "hello"],
                    waitTime: expect.objectContaining({
                        [TO_MILLISECONDS]: expect.any(
                            Function,
                        ) as ITimeSpan[typeof TO_MILLISECONDS],
                    }) as ITimeSpan,
                }),
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const callArg = onTimeoutFn.mock.calls[0]?.[0];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            expect(callArg.waitTime.toMilliseconds()).toBe(50);
        });

        test("Should not throw when onTimeout callback throws", async () => {
            const fn = use(async (): Promise<string> => {
                await delay(TimeSpan.fromMilliseconds(200));
                return "late";
            }, [
                timeout({
                    waitTime: TimeSpan.fromMilliseconds(50),
                    onTimeout: () => {
                        throw new Error("callback error");
                    },
                }),
            ]);
            await expect(fn()).rejects.toThrow(TimeoutResilienceError);
        });

        test("Should not call onTimeout when function throws before timeout", async () => {
            const onTimeoutFn = vi.fn();
            const fn = use(
                (): Promise<string> => Promise.reject(new Error("fail")),
                [
                    timeout({
                        waitTime: TimeSpan.fromMilliseconds(100),
                        onTimeout: onTimeoutFn,
                    }),
                ],
            );
            await expect(fn()).rejects.toThrow("fail");
            expect(onTimeoutFn).not.toHaveBeenCalled();
        });
    });
});
