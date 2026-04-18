import { beforeEach, describe, expect, test, vi } from "vitest";

import { type IContext } from "@/execution-context/contracts/_module.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { type NextFn } from "@/middleware/_module.js";
import { RetryResilienceError } from "@/resilience/resilience.errors.js";
import { retry } from "@/resilience/retry/retry.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/time-span.contract.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

describe("function: retry", () => {
    let context: IContext;

    beforeEach(() => {
        context = new Context(new Map());
    });

    describe("setting: maxAttempts", () => {
        test("Should throw TypeError when maxAttempts is less than 1", () => {
            expect(() => retry({ maxAttempts: 0 })).toThrow(TypeError);
            expect(() => retry({ maxAttempts: -1 })).toThrow(TypeError);
        });

        test("Should use default maxAttempts of 4", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(nextFn).toHaveBeenCalledTimes(4);
        });

        test("Should retry the specified number of times", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 2,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should succeed on first attempt without retrying", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("success");
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("success");
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should succeed if attempt succeeds before maxAttempts", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail 1"))
                .mockRejectedValueOnce(new Error("fail 2"))
                .mockResolvedValue("success");
            const middleware = retry({
                maxAttempts: 5,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe("success");
            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should retry exactly maxAttempts of 1 (no retries)", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 1,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });
    });

    describe("setting: backoffPolicy", () => {
        test("Should call backoffPolicy with attempt number and error", async () => {
            const error = new Error("fail");
            const backoffPolicy = vi
                .fn()
                .mockReturnValue(TimeSpan.fromMilliseconds(0));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error);
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(backoffPolicy).toHaveBeenCalledTimes(2);
            expect(backoffPolicy).toHaveBeenNthCalledWith(1, 1, error);
            expect(backoffPolicy).toHaveBeenNthCalledWith(2, 2, error);
        });

        test("Should not call backoffPolicy on last attempt", async () => {
            const backoffPolicy = vi
                .fn()
                .mockReturnValue(TimeSpan.fromMilliseconds(0));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 2,
                backoffPolicy,
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(backoffPolicy).toHaveBeenCalledTimes(1);
            expect(backoffPolicy).toHaveBeenCalledWith(1, expect.any(Error));
        });

        test("Should not call backoffPolicy when first attempt succeeds", async () => {
            const backoffPolicy = vi
                .fn()
                .mockReturnValue(TimeSpan.fromMilliseconds(0));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy,
            });

            await middleware({ args: [], next: nextFn, context });

            expect(backoffPolicy).not.toHaveBeenCalled();
        });

        test("Should call backoffPolicy with value as error when errorPolicy treats value as error", async () => {
            const backoffPolicy = vi
                .fn()
                .mockReturnValue(TimeSpan.fromMilliseconds(0));
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValue(true);
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy,
                errorPolicy: { treatFalseAsError: true },
            });

            await middleware({ args: [], next: nextFn, context });

            expect(backoffPolicy).toHaveBeenCalledTimes(1);
            expect(backoffPolicy).toHaveBeenCalledWith(1, false);
        });
    });

    describe("setting: throwLastError", () => {
        test("Should throw RetryResilienceError by default", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 2,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);
        });

        test("Should throw RetryResilienceError when throwLastError is false", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 2,
                throwLastError: false,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);
        });

        test("Should throw the last error when throwLastError is true", async () => {
            const lastError = new Error("last failure");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("first failure"))
                .mockRejectedValue(lastError);
            const middleware = retry({
                maxAttempts: 3,
                throwLastError: true,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(lastError);
        });

        test("Should include all errors in RetryResilienceError", async () => {
            const error1 = new Error("fail 1");
            const error2 = new Error("fail 2");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(error1)
                .mockRejectedValue(error2);
            const middleware = retry({
                maxAttempts: 2,
                throwLastError: false,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            try {
                await middleware({ args: [], next: nextFn, context });
                expect.unreachable();
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(RetryResilienceError);
                const retryError = error as RetryResilienceError;
                expect(retryError.errors).toHaveLength(2);
                expect(retryError.errors[0]).toBe(error1);
                expect(retryError.errors[1]).toBe(error2);
                expect(retryError.maxAttempts).toBe(2);
            }
        });
    });

    describe("setting: errorPolicy", () => {
        test("Should retry all errors by default", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("any error"));
            const middleware = retry({
                maxAttempts: 2,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(RetryResilienceError);

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should only retry errors matching the errorPolicy class", async () => {
            class RetryableError extends Error {}
            class NonRetryableError extends Error {}

            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new RetryableError("retry me"))
                .mockRejectedValue(new NonRetryableError("do not retry"));
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: RetryableError,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: (error: unknown) =>
                    error instanceof Error && error.message === "retryable",
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                errorPolicy: { treatFalseAsError: true },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                errorPolicy: { treatFalseAsError: false },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: [ErrorA, ErrorB],
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow(ErrorC);

            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should support errorPolicy as an invokable object", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("retryable"))
                .mockRejectedValue(new Error("not retryable"));
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: {
                    invoke: (error: unknown) =>
                        error instanceof Error && error.message === "retryable",
                },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow("not retryable");

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should not retry any error when errorPolicy always returns false", async () => {
            const error = new Error("fail");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(error);
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: () => false,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should exhaust all attempts when treatFalseAsError is true and all return false", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(false);
            const middleware = retry({
                maxAttempts: 3,
                errorPolicy: { treatFalseAsError: true },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(nextFn).toHaveBeenCalledTimes(3);
        });

        test("Should not retry false when treatFalseAsError is true and maxAttempts is 1", async () => {
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(false);
            const middleware = retry({
                maxAttempts: 1,
                errorPolicy: { treatFalseAsError: true },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should retry thrown errors but not false values when errorPolicy is a class", async () => {
            class RetryableError extends Error {}

            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue(false);
            const middleware = retry({
                maxAttempts: 3,
                errorPolicy: RetryableError,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            const result = await middleware({
                args: [],
                next: nextFn,
                context,
            });

            expect(result).toBe(false);
            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should rethrow error immediately when treatFalseAsError is combined with thrown errors", async () => {
            const thrownError = new Error("fail");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValueOnce(false)
                .mockRejectedValueOnce(thrownError)
                .mockResolvedValue("ok");
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: { treatFalseAsError: true },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(thrownError);

            expect(nextFn).toHaveBeenCalledTimes(2);
        });

        test("Should pass the actual thrown error to the errorPolicy predicate", async () => {
            const errorPolicy = vi
                .fn()
                .mockReturnValueOnce(true)
                .mockReturnValue(false);
            const error1 = new Error("first");
            const error2 = new Error("second");
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(error1)
                .mockRejectedValue(error2);
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error2);

            expect(errorPolicy).toHaveBeenCalledTimes(2);
            expect(errorPolicy).toHaveBeenNthCalledWith(1, error1);
            expect(errorPolicy).toHaveBeenNthCalledWith(2, error2);
        });
    });

    describe("callback: onExecutionAttempt", () => {
        test("Should be called before each execution attempt", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retry({
                maxAttempts: 3,
                onExecutionAttempt,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await middleware({ args: [], next: nextFn, context });

            expect(onExecutionAttempt).toHaveBeenCalledTimes(2);
        });

        test("Should be called with correct attempt number", async () => {
            const onExecutionAttempt = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 3,
                onExecutionAttempt,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

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
            const middleware = retry<[string, number], string>({
                maxAttempts: 2,
                onExecutionAttempt,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 2,
                onExecutionAttempt,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 2,
                onExecutionAttempt,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
        test("Should be called before each retry delay", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(onRetryDelay).toHaveBeenCalledTimes(2);
        });

        test("Should not be called on the last attempt", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 2,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(onRetryDelay).toHaveBeenCalledTimes(1);
        });

        test("Should not be called when first attempt succeeds", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 4,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 4,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(onRetryDelay).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ attempt: 1 }),
            );
            expect(onRetryDelay).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ attempt: 2 }),
            );
            expect(onRetryDelay).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ attempt: 3 }),
            );
        });

        test("Should be called with correct waitTime from backoffPolicy", async () => {
            const onRetryDelay = vi.fn();
            const nextFn: NextFn<Array<unknown>, Promise<unknown>> = vi
                .fn()
                .mockRejectedValue(new Error("fail"));
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: (attempt: number) =>
                    TimeSpan.fromMilliseconds(attempt * 100),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toThrow();

            expect(onRetryDelay).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    waitTime: expect.objectContaining({
                        [TO_MILLISECONDS]: expect.any(Function) as InvokableFn<
                            [],
                            number
                        >,
                    }) as ITimeSpan,
                }),
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const firstCall = onRetryDelay.mock.calls[0]?.[0];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            expect(firstCall.waitTime.toMilliseconds()).toBe(100);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const secondCall = onRetryDelay.mock.calls[1]?.[0];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            expect(secondCall.waitTime.toMilliseconds()).toBe(200);
        });

        test("Should be called with correct args", async () => {
            const onRetryDelay = vi.fn();
            const args: [string] = ["test-arg"];
            const nextFn: NextFn<[string], Promise<string>> = vi
                .fn()
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValue("ok");
            const middleware = retry<[string], string>({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                onRetryDelay,
                errorPolicy: { treatFalseAsError: true },
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 3,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
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
            const middleware = retry({
                maxAttempts: 5,
                errorPolicy: () => false,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await expect(
                middleware({ args: [], next: nextFn, context }),
            ).rejects.toBe(error);

            expect(nextFn).toHaveBeenCalledTimes(1);
        });

        test("Should pass args through to next function", async () => {
            const nextFn: NextFn<[string, number], Promise<string>> = vi
                .fn()
                .mockResolvedValue("ok");
            const middleware = retry<[string, number], string>({
                maxAttempts: 2,
                backoffPolicy: () => TimeSpan.fromMilliseconds(0),
            });

            await middleware({
                args: ["hello", 123],
                next: nextFn,
                context,
            });

            expect(nextFn).toHaveBeenCalledTimes(1);
        });
    });
});
