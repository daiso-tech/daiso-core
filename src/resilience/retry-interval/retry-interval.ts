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
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 * @throws {RetryIntervalResilienceError} {@link RetryIntervalResilienceError}
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
                        console.log(":", error);
                    }
                })();
                const value = await next();

                result = optionSome(value);
                if (!callErrorPolicyOnValue(errorPolicy, value)) {
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
                        console.log(":", error);
                    }
                })();
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
                            error: error,
                            waitTime: TimeSpan.fromTimeSpan(intervalAsTimeSpan),
                            attempt,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.log(":", error);
                    }
                })();
                await delay(intervalAsTimeSpan);
            } finally {
                attempt++;
            }
        }

        if (allErrors.length !== 0) {
            throw new RetryIntervalResilienceError(
                allErrors,
                attempt,
                timeAsTimeSpan,
                intervalAsTimeSpan,
                `Retry limit reached: Failed after ${String(timeAsTimeSpan.toMilliseconds())}ms (Interval: ${String(intervalAsTimeSpan.toMilliseconds())}ms)`,
            );
        }
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        throw new UnexpectedError(
            "retryInterval middleware reached an unreachble state, this is a bug please file issue on github.",
        );
    };
}
