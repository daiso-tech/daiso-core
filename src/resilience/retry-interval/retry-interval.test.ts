import { beforeEach, describe, expect, test, vi } from "vitest";

import { type IContext } from "@/execution-context/contracts/_module.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { type NextFn } from "@/middleware/_module.js";
import { RetryIntervalResilienceError } from "@/resilience/resilience.errors.js";
import { retryInterval } from "@/resilience/retry-interval/retry-interval.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: retryInterval", () => {
    let context: IContext;

    beforeEach(() => {
        context = new Context(new Map());
    });

    describe("setting: time and interval", () => {
        test("Should retry within the time window until success", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockResolvedValue("success");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("success");
            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should throw RetryIntervalResilienceError when time expires", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(20),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryIntervalResilienceError);
        });

        test("Should include time and interval in RetryIntervalResilienceError", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const time = TimeSpan.fromMilliseconds(50);
            const interval = TimeSpan.fromMilliseconds(20);
            const middleware = retryInterval({ time, interval });

            try {
                await middleware({ args: [], next: nextFn, context });
                expect.unreachable();
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(RetryIntervalResilienceError);
                const retryError = error as RetryIntervalResilienceError;
                expect(retryError.time.toMilliseconds()).toBe(
                    time.toMilliseconds(),
                );
                expect(retryError.interval.toMilliseconds()).toBe(
                    interval.toMilliseconds(),
                );
            }
        });

        test("Should succeed on first attempt without waiting", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("ok");
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should wait the interval duration between retries", async () => {
            const startTime = Date.now();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(50),
            });

            await middleware({ args: [], next: nextFn, context });

            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeGreaterThanOrEqual(40);
        });

        test("Should include errors and attempts in RetryIntervalResilienceError", async () => {
            const error1 = new Error("fail 1");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error1);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(15),
            });

            try {
                await middleware({ args: [], next: nextFn, context });
                expect.unreachable();
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(RetryIntervalResilienceError);
                const retryError = error as RetryIntervalResilienceError;
                expect(retryError.errors.length).toBeGreaterThanOrEqual(1);
                expect(retryError.attempts).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe("setting: throwLastError", () => {
        test("Should throw RetryIntervalResilienceError by default", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(15),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryIntervalResilienceError);
        });

        test("Should throw RetryIntervalResilienceError when throwLastError is false", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(15),
                throwLastError: false,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryIntervalResilienceError);
        });

        test("Should throw the last error when throwLastError is true", async () => {
            const lastError = new Error("last failure");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("first failure"))
                .mockRejectedValue(lastError);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(15),
                throwLastError: true,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(lastError);
        });

        test("Should include all collected errors in RetryIntervalResilienceError", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(60),
                interval: TimeSpan.fromMilliseconds(15),
                throwLastError: false,
            });

            try {
                await middleware({ args: [], next: nextFn, context });
                expect.unreachable();
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(RetryIntervalResilienceError);
                const retryError = error as RetryIntervalResilienceError;
                expect(retryError.errors.length).toBeGreaterThanOrEqual(1);
                for (const err of retryError.errors) {
                    expect(err).toBeInstanceOf(Error);
                }
            }
        });
    });

    describe("setting: errorPolicy", () => {
        test("Should retry all errors by default", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("any error"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(15),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryIntervalResilienceError);

            expect(vi.mocked(nextFn).mock.calls.length).toBeGreaterThanOrEqual(
                2,
            );
        });

        test("Should only retry errors matching the errorPolicy class", async () => {
            class RetryableError extends Error {}
            class NonRetryableError extends Error {}

            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new RetryableError("retry me"))
                .mockRejectedValue(new NonRetryableError("do not retry"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: RetryableError,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(NonRetryableError);

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should support errorPolicy as a predicate function", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("retryable"))
                .mockRejectedValue(new Error("not retryable"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: (error: unknown) =>
                    error instanceof Error && error.message === "retryable",
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow("not retryable");

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should support errorPolicy with treatFalseAsError", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValue(true);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(true);
            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should not retry false values when treatFalseAsError is false", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(false);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: false },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(false);
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should support errorPolicy with multiple classes", async () => {
            class ErrorA extends Error {}
            class ErrorB extends Error {}
            class ErrorC extends Error {}

            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new ErrorA("a"))
                .mockRejectedValueOnce(new ErrorB("b"))
                .mockRejectedValue(new ErrorC("c"));
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: [ErrorA, ErrorB],
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(ErrorC);

            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should retry false return values until true when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(false)
                .mockResolvedValue(true);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(true);
            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should not retry truthy return values when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("truthy");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("truthy");
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should not retry thrown errors when treatFalseAsError is true", async () => {
            const error = new Error("thrown");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should not retry thrown errors when treatFalseAsError is false", async () => {
            const error = new Error("thrown");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: false },
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should timeout with RetryIntervalResilienceError when false is always returned and treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(false);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(50),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(vi.mocked(nextFn).mock.calls.length).toBeGreaterThanOrEqual(
                2,
            );
        });

        test("Should not treat non-boolean falsy values as errors when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(0);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(0);
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should not treat null as error when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(null);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(null);
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should not treat undefined as error when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(undefined);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(undefined);
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should not treat empty string as error when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("");
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should retry false then succeed with non-boolean value when treatFalseAsError is true", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValue("success");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: { treatFalseAsError: true },
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("success");
            expect(nextFn).toHaveBeenCalledTimes(2);
        });
    });

    describe("callback: onExecutionAttempt", () => {
        test("Should be called before each execution attempt", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenCalledTimes(2);
        });

        test("Should be called with correct attempt numbers", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenCalledTimes(3);
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ attempt: 1 }),
            );
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ attempt: 2 }),
            );
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ attempt: 3 }),
            );
        });

        test("Should be called with correct args", async () => {
            const onExecutionAttempt = vi.fn();
            const args: [string, number] = ["hello", 42];
            const nextFn: NextFn<[string, number], Promise<string>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retryInterval<[string, number], string>({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            await middleware({ args, next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenCalledWith(
                expect.objectContaining({ args: ["hello", 42] }),
            );
        });

        test("Should be called with context", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenCalledWith(
                expect.objectContaining({ context }),
            );
        });

        test("Should not prevent execution when callback throws", async () => {
            const onExecutionAttempt = vi
                .fn()
                .mockRejectedValue(new Error("callback error"));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("ok");
            expect(nextFn).toHaveBeenCalledTimes(1);
        });
    });

    describe("callback: onRetryDelay", () => {
        test("Should be called before each retry delay on thrown errors", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).toHaveBeenCalledTimes(2);
        });

        test("Should not be called when first attempt succeeds", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).not.toHaveBeenCalled();
        });

        test("Should be called with correct error", async () => {
            const onRetryDelay = vi.fn();
            const error1 = new Error("fail 1");
            const error2 = new Error("fail 2");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(error1)
                .mockRejectedValueOnce(error2)
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ error: error1 }),
            );
            expect(onRetryDelay).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ error: error2 }),
            );
        });

        test("Should be called with correct attempt number", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ attempt: 1 }),
            );
            expect(onRetryDelay).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ attempt: 2 }),
            );
        });

        test("Should be called with waitTime equal to interval", async () => {
            const onRetryDelay = vi.fn();
            const interval = TimeSpan.fromMilliseconds(10);
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval,
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const callData = onRetryDelay.mock.calls[0]?.[0];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            expect(callData.waitTime.toMilliseconds()).toBe(
                interval.toMilliseconds(),
            );
        });

        test("Should be called with correct args", async () => {
            const onRetryDelay = vi.fn();
            const args: [string] = ["test-arg"];
            const nextFn: NextFn<[string], Promise<string>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval<[string], string>({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args, next: nextFn, context });

            expect(onRetryDelay).toHaveBeenCalledWith(
                expect.objectContaining({ args: ["test-arg"] }),
            );
        });

        test("Should be called with context", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).toHaveBeenCalledWith(
                expect.objectContaining({ context }),
            );
        });

        test("Should not prevent retry when callback throws", async () => {
            const onRetryDelay = vi
                .fn()
                .mockRejectedValue(new Error("callback error"));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("ok");
        });

        test("Should be called with value as error when errorPolicy uses treatFalseAsError", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValue(true);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onRetryDelay,
                errorPolicy: { treatFalseAsError: true },
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onRetryDelay).toHaveBeenCalledWith(
                expect.objectContaining({ error: false }),
            );
        });
    });

    describe("general behavior", () => {
        test("Should return value from successful attempt", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(42);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(42);
        });

        test("Should return value from a later successful attempt", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("recovered");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("recovered");
        });

        test("Should rethrow non-retryable errors immediately", async () => {
            class NonRetryable extends Error {}
            const error = new NonRetryable("stop");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error);
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                errorPolicy: () => false,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should increment attempt counter across retries", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockRejectedValueOnce(new Error("fail 3"))
                .mockResolvedValue("ok");
            const middleware = retryInterval({
                time: TimeSpan.fromMilliseconds(500),
                interval: TimeSpan.fromMilliseconds(10),
                onExecutionAttempt,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ attempt: 1 }),
            );
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ attempt: 2 }),
            );
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ attempt: 3 }),
            );
            expect(onExecutionAttempt).toHaveBeenNthCalledWith(
                4,
                expect.objectContaining({ attempt: 4 }),
            );
        });
    });
});
