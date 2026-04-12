/**
 * @module Resilience
 */

import {
    exponentialBackoff,
    type BackoffPolicy,
} from "@/backoff-policies/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/_module.js";
import { RetryResilienceError } from "@/resilience/resilience.errors.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type Invokable,
    type ErrorPolicySettings,
    type Option,
    optionNone,
    callInvokable,
    optionSome,
    callErrorPolicyOnValue,
    delay,
    callErrorPolicyOnThrow,
    OPTION,
    UnexpectedError,
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
             * exponentialBackof();
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
 * IMPORT_PATH: `@daiso-tech/core/resilience`
 * @group Middlewares
 * @throws {RetryResilienceError} {@link RetryResilienceError}
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
        let result: Option<TReturn> = optionNone();
        const allErrors: Array<unknown> = [];
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                void (async () => {
                    try {
                        await callInvokable(onExecutionAttempt, {
                            attempt,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.log(
                            "Error occured in onExecutionAttempt callback:",
                            error,
                        );
                    }
                })();
                const value = await next();

                if (!callErrorPolicyOnValue(errorPolicy, value)) {
                    result = optionSome(value);
                    return value;
                }
                // Handle retrying if an false is returned

                // Only sleep if there will actually be a next attempt
                if (attempt < maxAttempts) {
                    const waitTime = callInvokable(
                        backoffPolicy,
                        attempt,
                        value,
                    );
                    void (async () => {
                        try {
                            await callInvokable(onRetryDelay, {
                                error: value,
                                waitTime: TimeSpan.fromTimeSpan(waitTime),
                                attempt,
                                args,
                                context,
                            });
                        } catch (error: unknown) {
                            console.log(
                                "Error occured in onRetryDelay callback:",
                                error,
                            );
                        }
                    })();
                    await delay(waitTime);
                }

                // Handle retrying if an error is thrown
            } catch (error: unknown) {
                if (await callErrorPolicyOnThrow<any>(errorPolicy, error)) {
                    allErrors.push(error);
                } else {
                    throw error;
                }

                // Only sleep if there will actually be a next attempt
                if (attempt < maxAttempts) {
                    const waitTime = callInvokable(
                        backoffPolicy,
                        attempt,
                        error,
                    );

                    void (async () => {
                        try {
                            await callInvokable(onRetryDelay, {
                                error: error,
                                waitTime: TimeSpan.fromTimeSpan(waitTime),
                                attempt,
                                args,
                                context,
                            });
                        } catch (error: unknown) {
                            console.log(
                                "Error occured in onRetryDelay callback:",
                                error,
                            );
                        }
                    })();
                    await delay(waitTime);
                }
            }
        }

        if (allErrors.length !== 0 && !throwLastError) {
            throw RetryResilienceError.create(allErrors, maxAttempts);
        }
        if (allErrors.length !== 0 && throwLastError) {
            throw allErrors.at(-1);
        }
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        throw new UnexpectedError(
            "retry middleware reached an unreachble state, this is a bug please file issue on github.",
        );
    };
}
