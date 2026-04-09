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
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
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
    waitTime: ITimeSpan;
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
 * @throws {RetryResilienceError} {@link RetryResilienceError}
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
        };

export function retry<TParameters extends Array<unknown>, TReturn>(
    settings: NoInfer<RetrySettings<TParameters>> = {},
): MiddlewareFn<TParameters, Promise<TReturn>> {
    const {
        maxAttempts = 4,
        backoffPolicy = exponentialBackoff(),
        errorPolicy,
        onRetryDelay = () => {},
        onExecutionAttempt = () => {},
    } = settings;
    return async ({ args, next, context }) => {
        let result: Option<TReturn> = optionNone();
        const allErrors: Array<unknown> = [];
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                callInvokable(onExecutionAttempt, { attempt, args, context });
                const value = await next();

                // Handle retrying if an Result type is returned
                result = optionSome(value);
                if (!callErrorPolicyOnValue(errorPolicy, value)) {
                    return value;
                }

                const waitTime = callInvokable(backoffPolicy, attempt, value);

                callInvokable(onRetryDelay, {
                    error: value,
                    waitTime,
                    attempt,
                    args,
                    context,
                });
                await delay(waitTime);

                // Handle retrying if an error is thrown
            } catch (error: unknown) {
                if (await callErrorPolicyOnThrow<any>(errorPolicy, error)) {
                    allErrors.push(error);
                } else {
                    throw error;
                }

                const waitTime = callInvokable(backoffPolicy, attempt, error);

                callInvokable(onRetryDelay, {
                    error: error,
                    waitTime,
                    attempt,
                    args,
                    context,
                });
                await delay(waitTime);
            }
        }

        if (allErrors.length !== 0) {
            throw new RetryResilienceError(allErrors, "!!__MESSAGE__!!");
        }
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        throw new UnexpectedError("!!__MESSAGE__!!");
    };
}
