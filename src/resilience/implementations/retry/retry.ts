/**
 * @module Resilience
 */

import { type BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import { exponentialBackoff } from "@/backoff-policies/implementations/_module.js";
import {
    type IContext,
    type IReadableContext,
} from "@/execution-context/contracts/_module.js";
import {
    type MiddlewareFn,
    type NextFn,
} from "@/middleware/contracts/_module.js";
import { RetryResilienceError } from "@/resilience/implementations/resilience.errors.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type Invokable,
    type ErrorPolicySettings,
    callInvokable,
    callErrorPolicyOnValue,
    delay,
    callErrorPolicyOnThrow,
    UnexpectedError,
    type ErrorPolicy,
    type Option,
    optionSome,
    optionNone,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryAttemptData<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    attempt: number;
    args: TParameters;
    context: IReadableContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnExecutionAttempt<
    TParameters extends Array<unknown> = Array<unknown>,
> = Invokable<[data: OnRetryAttemptData<TParameters>]>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryDelayData<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    error: unknown;
    attempt: number;
    waitTime: TimeSpan;
    args: TParameters;
    context: IReadableContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryDelay<TParameters extends Array<unknown> = Array<unknown>> =
    Invokable<[data: OnRetryDelayData<TParameters>]>;

/**
 * Lifecycle callbacks for the `retry` middleware.
 * Invoked at key points during retry attempts: before execution and before the delay.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type RetryCallbacks<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * Callback {@link Invokable | `Invokable`} that will be called before execution attempt.
     */
    onExecutionAttempt?: OnExecutionAttempt<TParameters>;

    /**
     * Callback {@link Invokable | `Invokable`} that will be called before the retry delay starts.
     */
    onRetryDelay?: OnRetryDelay<TParameters>;
};

/**
 * Configuration for the `retry` resilience middleware.
 * Retries the wrapped function up to a maximum number of attempts.
 * Supports configurable backoff policies and lifecycle callbacks.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type RetrySettings<TParameters extends Array<unknown> = Array<unknown>> =
    RetryCallbacks<TParameters> &
        ErrorPolicySettings & {
            /**
             * You can decide maximal times you can retry.
             * @default 4
             */
            maxAttempts?: number;

            /**
             * @default
             * ```ts
             * import { exponentialBackoff } from "@daiso-tech/core/backoff-policies";
             *
             * exponentialBackoff();
             * ```
             */
            backoffPolicy?: BackoffPolicy;

            /**
             * If true last error will be thrown otherwise an {@link RetryResilienceError | `RetryResilienceError`} will be thrown.
             *
             * @default false
             */
            throwLastError?: boolean;
        };

/**
 * @internal
 */
export type HandleOnExecutionAttemptSettings<
    TParameters extends Array<unknown>,
> = {
    onExecutionAttempt: OnExecutionAttempt<TParameters>;
    attempt: number;
    args: TParameters;
    context: IContext;
};

/**
 * @internal
 */
export function handleOnExecutionAttempt<TParameters extends Array<unknown>>(
    settings: HandleOnExecutionAttemptSettings<TParameters>,
): void {
    const { attempt, args, context, onExecutionAttempt } = settings;
    void (async () => {
        try {
            await callInvokable(onExecutionAttempt, {
                attempt,
                args,
                context,
            });
        } catch (error: unknown) {
            console.error(
                "Error occurred in onExecutionAttempt callback:",
                error,
            );
        }
    })();
}

/**
 * @internal
 */
export type HandleOnRetryDelaySettings<TParameters extends Array<unknown>> = {
    onRetryDelay: OnRetryDelay<TParameters>;
    error: unknown;
    waitTime: ITimeSpan;
    attempt: number;
    args: TParameters;
    context: IContext;
};

/**
 * @internal
 */
export function handleOnRetryDelay<TParameters extends Array<unknown>>(
    settings: HandleOnRetryDelaySettings<TParameters>,
): void {
    const { onRetryDelay, error, waitTime, attempt, args, context } = settings;
    void (async () => {
        try {
            await callInvokable(onRetryDelay, {
                error,
                waitTime: TimeSpan.fromTimeSpan(waitTime),
                attempt,
                args,
                context,
            });
        } catch (error_: unknown) {
            console.error("Error occurred in onRetryDelay callback:", error_);
        }
    })();
}

/**
 * @internal
 */
type HandleWhenReturnSettings<TParameters extends Array<unknown>, TReturn> = {
    onExecutionAttempt: OnExecutionAttempt<TParameters>;
    attempt: number;
    args: TParameters;
    context: IContext;
    next: NextFn<TParameters, TReturn>;
    errorPolicy: ErrorPolicy | undefined;
    maxAttempts: number;
    backoffPolicy: BackoffPolicy;
    onRetryDelay: OnRetryDelay<TParameters>;
};

/**
 * @internal
 */
async function handleWhenReturn<TParameters extends Array<unknown>, TReturn>(
    settings: HandleWhenReturnSettings<TParameters, Promise<TReturn>>,
): Promise<Option<TReturn>> {
    const {
        onExecutionAttempt,
        attempt,
        args,
        context,
        next,
        errorPolicy,
        maxAttempts,
        backoffPolicy,
        onRetryDelay,
    } = settings;

    handleOnExecutionAttempt({
        onExecutionAttempt,
        attempt,
        args,
        context,
    });
    const value = await next();

    if (!callErrorPolicyOnValue(errorPolicy, value)) {
        return optionSome(value);
    }
    // Handle retrying if an false is returned

    // Only sleep if there will actually be a next attempt
    if (attempt < maxAttempts) {
        const waitTime = callInvokable(backoffPolicy, attempt, value);
        handleOnRetryDelay({
            onRetryDelay,
            error: value,
            waitTime,
            attempt,
            args,
            context,
        });
        await delay(waitTime);
    }
    return optionNone();
}

/**
 * @internal
 */
type HandleWhenThrowSettings<TParameters extends Array<unknown>> = {
    errorPolicy: ErrorPolicy | undefined;
    error: unknown;
    allErrors: Array<unknown>;
    attempt: number;
    maxAttempts: number;
    backoffPolicy: BackoffPolicy;
    onRetryDelay: OnRetryDelay<TParameters>;
    args: TParameters;
    context: IContext;
};

/**
 * @internal
 */
async function handleWhenThrow<TParameters extends Array<unknown>>(
    settings: HandleWhenThrowSettings<TParameters>,
): Promise<void> {
    const {
        error,
        allErrors,
        attempt,
        maxAttempts,
        backoffPolicy,
        onRetryDelay,
        errorPolicy,
        args,
        context,
    } = settings;
    if (await callErrorPolicyOnThrow<any>(errorPolicy, error)) {
        allErrors.push(error);
    } else {
        throw error;
    }

    // Only sleep if there will actually be a next attempt
    if (attempt < maxAttempts) {
        const waitTime = callInvokable(backoffPolicy, attempt, error);

        handleOnRetryDelay({
            onRetryDelay,
            error,
            waitTime,
            attempt,
            args,
            context,
        });
        await delay(waitTime);
    }
}

/**
 * @internal
 */
type ThrowErrorsSettings = {
    allErrors: Array<unknown>;
    throwLastError: boolean;
    maxAttempts: number;
};

/**
 * @internal
 */
function throwErrors(settings: ThrowErrorsSettings): never {
    const { allErrors, throwLastError, maxAttempts } = settings;
    if (allErrors.length !== 0 && !throwLastError) {
        throw RetryResilienceError.create(allErrors, maxAttempts);
    }
    if (allErrors.length !== 0 && throwLastError) {
        throw allErrors.at(-1);
    }
    throw new UnexpectedError(
        "retry middleware reached an unreachble state, this is a bug please file issue on github.",
    );
}

/**
 * IMPORT_PATH: `@daiso-tech/core/resilience`
 * @group Middlewares
 * @throws {RetryResilienceError}
 */
export function retry<TParameters extends Array<unknown>, TReturn>(
    settings: NoInfer<RetrySettings<TParameters>> = {},
): MiddlewareFn<TParameters, Promise<TReturn>> {
    const {
        maxAttempts = 4,
        backoffPolicy = exponentialBackoff(),
        errorPolicy,
        onRetryDelay = () => {},
        onExecutionAttempt = () => {},
        throwLastError = false,
    } = settings;
    if (maxAttempts < 1) {
        throw new TypeError(
            "RetrySettings.maxAttempts cannot be smaller than 1",
        );
    }

    return async ({ args, next, context }) => {
        const allErrors: Array<unknown> = [];
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await handleWhenReturn({
                    onExecutionAttempt,
                    attempt,
                    args,
                    context,
                    next,
                    errorPolicy,
                    maxAttempts,
                    backoffPolicy,
                    onRetryDelay,
                });
                if (result.type === "some") {
                    return result.value;
                }
            } catch (error: unknown) {
                await handleWhenThrow({
                    error,
                    allErrors,
                    attempt,
                    maxAttempts,
                    backoffPolicy,
                    onRetryDelay,
                    errorPolicy,
                    args,
                    context,
                });
            }
        }

        return throwErrors({
            allErrors,
            throwLastError,
            maxAttempts,
        });
    };
}
