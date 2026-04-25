/**
 * @module Resilience
 */

import { type MiddlewareFn } from "@/middleware/types.js";
import { RetryIntervalResilienceError } from "@/resilience/resilience.errors.js";
import { type RetryCallbacks } from "@/resilience/retry/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    callErrorPolicyOnValue,
    callInvokable,
    delay,
    OPTION,
    optionNone,
    optionSome,
    UnexpectedError,
    type ErrorPolicySettings,
    type Option,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type RetryIntervalSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = RetryCallbacks<TParameters> &
    ErrorPolicySettings & {
        time: ITimeSpan;
        interval: ITimeSpan;

        /**
         * If true last error will be thrown otherwise an {@link RetryIntervalResilienceError | `RetryIntervalResilienceError`} will be thrown.
         *
         * @default false
         */
        throwLastError?: boolean;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 * @throws {RetryIntervalResilienceError}
 */
export function retryInterval<TParameters extends Array<unknown>, TReturn>(
    settings: RetryIntervalSettings<TParameters>,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    const {
        time,
        interval,
        errorPolicy,
        onRetryDelay = () => {},
        onExecutionAttempt = () => {},
        throwLastError = false,
    } = settings;

    const timeAsTimeSpan = TimeSpan.fromTimeSpan(time);
    const intervalAsTimeSpan = TimeSpan.fromTimeSpan(interval);

    return async ({ args, context, next }) => {
        const endDate = timeAsTimeSpan.toEndDate();
        let result: Option<TReturn> = optionNone();
        const allErrors: Array<unknown> = [];
        let attempt = 1;
        while (endDate.getTime() > new Date().getTime()) {
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
                            "Error occurred in onExecutionAttempt callback:",
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

                void (async () => {
                    try {
                        await callInvokable(onRetryDelay, {
                            error: value,
                            waitTime: intervalAsTimeSpan,
                            attempt,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.log(
                            "Error occurred in onRetryDelay callback:",
                            error,
                        );
                    }
                })();

                const remainingAfterValue = endDate.getTime() - Date.now();
                if (remainingAfterValue <= 0) {
                    break;
                }
                await delay(interval);
            } catch (error: unknown) {
                if (await callErrorPolicyOnThrow<any>(errorPolicy, error)) {
                    allErrors.push(error);
                } else {
                    throw error;
                }

                void (async () => {
                    try {
                        await callInvokable(onRetryDelay, {
                            error,
                            waitTime: intervalAsTimeSpan,
                            attempt,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.log(
                            "Error occurred in onRetryDelay callback:",
                            error,
                        );
                    }
                })();

                const remainingAfterValue = endDate.getTime() - Date.now();
                if (remainingAfterValue <= 0) {
                    break;
                }
                await delay(intervalAsTimeSpan);
            } finally {
                attempt++;
            }
        }

        if (allErrors.length !== 0 && !throwLastError) {
            throw RetryIntervalResilienceError.create(
                allErrors,
                attempt - 1,
                timeAsTimeSpan,
                intervalAsTimeSpan,
            );
        }
        if (allErrors.length !== 0 && throwLastError) {
            throw allErrors.at(-1);
        }
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        throw new UnexpectedError(
            "retryInterval middleware reached an unreachble state, this is a bug please file issue on github.",
        );
    };
}
