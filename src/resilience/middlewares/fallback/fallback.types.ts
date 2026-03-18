/**
 * @module Resilience
 */

import { type HookContext } from "@/hooks/_module.js";
import {
    type Invokable,
    type AsyncLazyable,
    type ErrorPolicySettings,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnFallbackData<
    TParameters extends Array<unknown> = Array<unknown>,
    TFallbackValue = unknown,
    TContext extends HookContext = HookContext,
> = {
    error: unknown;
    fallbackValue: TFallbackValue;
    args: TParameters;
    context: TContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnFallback<
    TParameters extends Array<unknown> = Array<unknown>,
    TFallbackValue = unknown,
    TContext extends HookContext = HookContext,
> = Invokable<[data: OnFallbackData<TParameters, TFallbackValue, TContext>]>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type FallbackCallbacks<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = {
    /**
     * Callback {@link Invokable | `Invokable`} that will be called before fallback value is returned.
     */
    onFallback?: OnFallback<TParameters, TReturn, TContext>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type FallbackSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = FallbackCallbacks<TParameters, TReturn, TContext> &
    ErrorPolicySettings & {
        fallbackValue: AsyncLazyable<TReturn>;
    };
