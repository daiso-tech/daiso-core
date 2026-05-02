/**
 * @module Resilience
 */

import { type IContext } from "@/execution-context/contracts/execution-context.contract.js";
import {
    type MiddlewareFn,
    type NextFn,
} from "@/middleware/contracts/_module.js";
import { RetryIntervalResilienceError } from "@/resilience/implementations/resilience.errors.js";
import {
    handleOnExecutionAttempt,
    handleOnRetryDelay,
    type OnExecutionAttempt,
    type OnRetryDelay,
    type RetryCallbacks,
} from "@/resilience/implementations/retry/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callErrorPolicyOnThrow,
    callErrorPolicyOnValue,
    delay,
    UnexpectedError,
    type ErrorPolicy,
    type ErrorPolicySettings,
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
 * @internal
 */
type HandleWhenReturnSettings<TParameters extends Array<unknown>, TReturn> = {
    onExecutionAttempt: OnExecutionAttempt<TParameters>;
    attempt: number;
    args: TParameters;
    context: IContext;
    next: NextFn<TParameters, TReturn>;
    errorPolicy: ErrorPolicy | undefined;
    intervalAsTimeSpan: TimeSpan;
    endDate: Date;
    onRetryDelay: OnRetryDelay<TParameters>;
};

/**
 * @internal
 */
async function handleWhenReturn<TParameters extends Array<unknown>, TReturn>(
    settings: HandleWhenReturnSettings<TParameters, Promise<TReturn>>,
): Promise<
    | {
          type: "break";
      }
    | {
          type: "return";
          value: TReturn;
      }
    | {
          type: "end";
      }
> {
    const {
        onExecutionAttempt,
        attempt,
        args,
        context,
        next,
        errorPolicy,
        intervalAsTimeSpan,
        endDate,
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
        return {
            type: "return",
            value,
        };
    }
    // Handle retrying if an false is returned

    handleOnRetryDelay({
        onRetryDelay,
        error: value,
        waitTime: intervalAsTimeSpan,
        attempt,
        args,
        context,
    });

    const remainingAfterValue = endDate.getTime() - Date.now();
    if (remainingAfterValue <= 0) {
        return {
            type: "break",
        };
    }
    await delay(intervalAsTimeSpan);
    return {
        type: "end",
    };
}

/**
 * @internal
 */
type HandleWhenThrowSettings<TParameters extends Array<unknown>> = {
    allErrors: Array<unknown>;
    error: unknown;
    errorPolicy: ErrorPolicy | undefined;
    onRetryDelay: OnRetryDelay<TParameters>;
    intervalAsTimeSpan: TimeSpan;
    attempt: number;
    args: TParameters;
    context: IContext;
    endDate: Date;
};

/**
 * @internal
 */
async function handleWhenThrow<TParameters extends Array<unknown>>(
    settings: HandleWhenThrowSettings<TParameters>,
): Promise<boolean> {
    const {
        allErrors,
        error,
        errorPolicy,
        onRetryDelay,
        intervalAsTimeSpan,
        attempt,
        args,
        context,
        endDate,
    } = settings;

    if (await callErrorPolicyOnThrow<any>(errorPolicy, error)) {
        allErrors.push(error);
    } else {
        throw error;
    }

    handleOnRetryDelay({
        onRetryDelay,
        error,
        waitTime: intervalAsTimeSpan,
        attempt,
        args,
        context,
    });

    const remainingAfterValue = endDate.getTime() - Date.now();
    if (remainingAfterValue <= 0) {
        return true;
    }
    await delay(intervalAsTimeSpan);
    return false;
}

/**
 * @internal
 */
type ThrowErrorsSettings = {
    allErrors: Array<unknown>;
    throwLastError: boolean;
    attempt: number;
    timeAsTimeSpan: TimeSpan;
    intervalAsTimeSpan: TimeSpan;
};

/**
 * @internal
 */
function throwErrors(settings: ThrowErrorsSettings): never {
    const {
        allErrors,
        throwLastError,
        attempt,
        timeAsTimeSpan,
        intervalAsTimeSpan,
    } = settings;
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
    throw new UnexpectedError(
        "retryInterval middleware reached an unreachble state, this is a bug please file issue on github.",
    );
}

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
        const allErrors: Array<unknown> = [];
        let attempt = 1;
        while (endDate.getTime() > new Date().getTime()) {
            try {
                const result = await handleWhenReturn({
                    onExecutionAttempt,
                    attempt,
                    args,
                    context,
                    next,
                    errorPolicy,
                    intervalAsTimeSpan,
                    endDate,
                    onRetryDelay,
                });
                if (result.type === "return") {
                    return result.value;
                }
                if (result.type === "break") {
                    break;
                }
            } catch (error: unknown) {
                if (
                    await handleWhenThrow({
                        allErrors,
                        error,
                        errorPolicy,
                        onRetryDelay,
                        intervalAsTimeSpan,
                        attempt,
                        args,
                        context,
                        endDate,
                    })
                ) {
                    break;
                }
            } finally {
                attempt++;
            }
        }

        throwErrors({
            allErrors,
            throwLastError,
            attempt,
            timeAsTimeSpan,
            intervalAsTimeSpan,
        });
    };
}
