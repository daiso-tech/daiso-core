/**
 * @module Resilience
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/types.js";
import {
    type Invokable,
    type AsyncLazyable,
    type ErrorPolicySettings,
    callErrorPolicyOnValue,
    resolveAsyncLazyable,
    callInvokable,
    callErrorPolicyOnThrow,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnFallbackData<
    TParameters extends Array<unknown> = Array<unknown>,
    TFallbackValue = unknown,
> = {
    error: unknown;
    fallbackValue: TFallbackValue;
    args: TParameters;
    context: IReadableContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnFallback<
    TParameters extends Array<unknown> = Array<unknown>,
    TFallbackValue = unknown,
> = Invokable<[data: OnFallbackData<TParameters, TFallbackValue>]>;

/**
 * Lifecycle callbacks for the `fallback` middleware.
 * Called when the fallback value is about to be returned instead of the original result.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type FallbackCallbacks<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     * Callback {@link Invokable | `Invokable`} that will be called before fallback value is returned.
     */
    onFallback?: OnFallback<TParameters, TReturn>;
};

/**
 * Configuration for the `fallback` resilience middleware.
 * Returns a default value when the wrapped function throws or returns a value matching the error policy.
 * Supports error-policy filtering to only catch specific errors.
 *
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type FallbackSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = FallbackCallbacks<TParameters, TReturn> &
    ErrorPolicySettings & {
        fallbackValue: AsyncLazyable<TReturn>;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export function fallback<TParameters extends Array<unknown>, TReturn>(
    settings: NoInfer<FallbackSettings<TParameters, TReturn>>,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    const { fallbackValue, errorPolicy, onFallback = () => {} } = settings;
    return async ({ args, next, context }) => {
        try {
            const value = await next();

            if (!callErrorPolicyOnValue(errorPolicy, value)) {
                return value;
            }

            const resolvedFallbackValue =
                await resolveAsyncLazyable(fallbackValue);
            try {
                void (async () => {
                    try {
                        await callInvokable(onFallback, {
                            error: value,
                            fallbackValue: resolvedFallbackValue,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.error(
                            "Error occured in onFallback callback:",
                            error,
                        );
                    }
                })();
            } catch {
                /* EMPTY */
            }
            return resolvedFallbackValue;

            // Handle fallback value if an error is thrown
        } catch (error: unknown) {
            if (!(await callErrorPolicyOnThrow<any>(errorPolicy, error))) {
                throw error;
            }
            const resolvedFallbackValue =
                await resolveAsyncLazyable(fallbackValue);
            try {
                void (async () => {
                    try {
                        await callInvokable(onFallback, {
                            error,
                            fallbackValue: resolvedFallbackValue as TReturn,
                            args,
                            context,
                        });
                    } catch (error: unknown) {
                        console.error(
                            "Error occured in onFallback callback:",
                            error,
                        );
                    }
                })();
            } catch {
                /* EMPTY */
            }
            return resolvedFallbackValue as TReturn;
        }
    };
}
