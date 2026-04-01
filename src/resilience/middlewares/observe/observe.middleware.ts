/**
 * @module Resilience
 */

import { type AsyncMiddlewareFn, type HookContext } from "@/hooks/_module.js";
import { type ObserveCallbacks } from "@/resilience/middlewares/observe/observe.types.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * The `observe` middleware tracks an async function's state and runs callbacks when it fails with an error or succeeds.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 *
 * @example
 * ```ts
 * import { observe } from "@daiso-tech/core/resilience";
 * import { AsyncHooks } from "@daiso-tech/core/hooks";
 * import { TimeSpan } from "@daiso-tech/core/time-span";
 * import { delay } from "@daiso-tech/core/utilities";
 *
 * await new AsyncHooks(
 *   // Lets pretend this function can throw and takes time to execute.
 *   async (a: number, b: number): Promise<number> => {
 *      const shouldThrow1 = Math.round(Math.random() * 100);
 *      if (shouldThrow1 > 50) {
 *        throw new Error("Unexpected error occured");
 *      }
 *      await delay(TimeSpan.fromMilliseconds(Math.random() * 1000));
 *      const shouldThrow2 = Math.round(Math.random() * 100);
 *      if (shouldThrow2 > 50) {
 *        throw new Error("Unexpected error occured");
 *      }
 *      return a / b;
 *   },
 *   observe({
 *     onStart: (data) => console.log("START:", data),
 *     onSuccess: (data) => console.log("SUCCESS:", data),
 *     onError: (data) => console.error("ERROR:", data),
 *     onFinally: (data) => console.log("FINALLY:", data),
 *   })
 * )
 * .invoke(20, 10);
 * // Will log when the function execution has started and the arguments.
 * // Will log if the function succeded, the arguments and the return value.
 * // Will log if the function errored, arguments and the error.
 * // Will log the execution time and arguments
 * ```
 */
export function observe<
    TParameters extends Array<unknown>,
    TReturn,
    TContext extends HookContext,
>(
    settings: NoInfer<ObserveCallbacks<TParameters, TReturn, TContext>>,
): AsyncMiddlewareFn<TParameters, TReturn, TContext> {
    const {
        onStart = () => {},
        onSuccess = () => {},
        onError = () => {},
        onFinally = () => {},
    } = settings;
    return async (args, next, { context }) => {
        const start = performance.now();
        try {
            callInvokable(onStart, {
                args,
                context,
            });
            const returnValue = await next(...args);

            callInvokable(onSuccess, {
                args,
                context,
                returnValue: returnValue,
            });
            return returnValue;
        } catch (error: unknown) {
            callInvokable(onError, {
                args,
                context,
                error,
            });
            throw error;
        } finally {
            const end = performance.now();
            const time = end - start;
            callInvokable(onFinally, {
                context,
                executionTime: TimeSpan.fromMilliseconds(time),
            });
        }
    };
}
