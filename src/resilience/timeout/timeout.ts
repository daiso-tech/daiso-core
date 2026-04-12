/**
 * @module Resilience
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/_module.js";
import { TimeoutResilienceError } from "@/resilience/resilience.errors.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnTimeoutData<TParameters extends Array<unknown> = Array<unknown>> =
    {
        waitTime: TimeSpan;
        args: TParameters;
        context: IReadableContext;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnTimeout<TParameters extends Array<unknown> = Array<unknown>> =
    Invokable<[data: OnTimeoutData<TParameters>]>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type TimeoutCallbacks<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * Callback {@link Invokable | `Invokable`} that will be called before the timeout occurs.
     */
    onTimeout?: OnTimeout<TParameters>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type TimeoutSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = TimeoutCallbacks<TParameters> & {
    /**
     * The maximum time to wait before automatically aborting the executing function.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(2)
     * ```
     */
    waitTime?: ITimeSpan;
};

/**
 * The `timeout` middleware automatically cancels functions after a specified time period, throwing an error when aborted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 * @throws {TimeoutResilienceError} {@link TimeoutResilienceError}
 */
export function timeout<TParameters extends Array<unknown>, TReturn>(
    settings: NoInfer<TimeoutSettings<TParameters>> = {},
): MiddlewareFn<TParameters, Promise<TReturn>> {
    const { waitTime = TimeSpan.fromSeconds(2), onTimeout = () => {} } =
        settings;
    return async ({ args, next, context }) => {
        const timeoutError = TimeoutResilienceError.create(
            TimeSpan.fromTimeSpan(waitTime),
        );
        try {
            let timeoutId = null as ReturnType<typeof setTimeout> | null;
            try {
                const promise = new Promise<never>((_resolve, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(timeoutError);
                    }, waitTime[TO_MILLISECONDS]());
                });
                return await Promise.race([next(), promise]);
            } finally {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
            }
        } catch (error: unknown) {
            if (
                error instanceof TimeoutResilienceError &&
                error === timeoutError
            ) {
                try {
                    await callInvokable(onTimeout, {
                        args,
                        context,
                        waitTime: TimeSpan.fromTimeSpan(waitTime),
                    });
                } catch {
                    /* EMPTY */
                }
            }
            throw error;
        }
    };
}
