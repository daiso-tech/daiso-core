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
import {
    callInvokable,
    type Invokable,
    type InvokableFn,
} from "@/utilities/_module.js";

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
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(2)
     * ```
     */
    waitTime?: ITimeSpan;
};

/**
 * The `timeout` middleware automatically cancels functions after a specified time period, throwing an error when aborted.
 *
 * Note when a timeout occurs, the function call continues executing in the background and only the `Promise` will be aborted.
 * To ensure correct abortion behavior, provide an {@link AbortSignalBinder | `AbortSignalBinder`} to {@link AsyncHooks | `AsyncHooks`}.
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
        try {
            const signal = AbortSignal.timeout(waitTime[TO_MILLISECONDS]());
            let listener: InvokableFn<[], void> | null = null;
            try {
                const promise = new Promise<never>((_resolve, reject) => {
                    listener = () => {
                        reject(
                            new TimeoutResilienceError(
                                "!!_MESSAGE__!!",
                                signal.reason,
                            ),
                        );
                    };
                    signal.addEventListener("abort", listener, {
                        once: true,
                    });
                });
                return await Promise.race([next(), promise]);
            } catch (error: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (listener !== null) {
                    signal.removeEventListener("abort", listener);
                }
                throw error;
            }
        } catch (error: unknown) {
            if (error instanceof TimeoutResilienceError) {
                callInvokable(onTimeout, {
                    args,
                    context,
                    waitTime: TimeSpan.fromTimeSpan(waitTime),
                });
            }
            throw error;
        }
    };
}
