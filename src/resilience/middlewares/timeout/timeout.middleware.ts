/**
 * @module Resilience
 */

import {
    type AsyncMiddlewareFn,
    type HookContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type AsyncHooks,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type AbortSignalBinder,
} from "@/hooks/_module.js";
import { type TimeoutSettings } from "@/resilience/middlewares/timeout/timeout.type.js";
import { TimeoutResilienceError } from "@/resilience/resilience.errors.js";
import { timeoutAndFail } from "@/resilience/utilities/timeout-and-fail/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * The `timeout` middleware automatically cancels functions after a specified time period, throwing an error when aborted.
 *
 * Note when a timeout occurs, the function call continues executing in the background and only the `Promise` will be aborted.
 * To ensure correct abortion behavior, provide an {@link AbortSignalBinder | `AbortSignalBinder`} to {@link AsyncHooks | `AsyncHooks`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 * @throws {TimeoutResilienceError} {@link TimeoutResilienceError}
 *
 * @example
 * ```ts
 * import { timeout } from "@daiso-tech/core/resilience";
 * import { TimeSpan } from "@daiso-tech/core/time-span";
 * import { AsyncHooks } from "@daiso-tech/core/hooks";
 *
 *
 * const data = await new AsyncHooks(
 *   async (url: string, signal?: AbortSignal): Promise<unknown> => {
 *     const response = await fetch(url, { signal });
 *     return await response.json();
 *   },
 *   [timeout({ waitTime: TimeSpan.fromSeconds(2) })],
 *   {
 *     signalBinder: {
 *       getSignal: (args) => args[1],
 *       forwardSignal: (args, signal) => {
 *         args[1] = signal;
 *       }
 *     }
 *   }
 * )
 * .invoke("URL");
 * ```
 */
export function timeout<
    TParameters extends Array<unknown>,
    TReturn,
    TContext extends HookContext,
>(
    settings: NoInfer<TimeoutSettings<TParameters, TContext>> = {},
): AsyncMiddlewareFn<TParameters, TReturn, TContext> {
    const { waitTime = TimeSpan.fromSeconds(2), onTimeout = () => {} } =
        settings;
    return async (args, next, { context, abort, signal }) => {
        try {
            return await timeoutAndFail(
                next(...args),
                waitTime,
                (error: unknown) => {
                    abort(error);
                },
                signal,
            );
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
