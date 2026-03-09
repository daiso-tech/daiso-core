/**
 * @module Resilience
 */

import { type BackoffPolicy } from "@/backoff-policies/_module.js";
import { type HookContext } from "@/hooks/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    type Invokable,
    type ErrorPolicySettings,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryAttemptData<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = {
    attempt: number;
    args: TParameters;
    context: TContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnExecutionAttempt<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = Invokable<[data: OnRetryAttemptData<TParameters, TContext>]>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryDelayData<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = {
    error: unknown;
    attempt: number;
    waitTime: ITimeSpan;
    args: TParameters;
    context: TContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type OnRetryDelay<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = Invokable<[data: OnRetryDelayData<TParameters, TContext>]>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type RetryCallbacks<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = {
    /**
     * Callback {@link Invokable | `Invokable`} that will be called before execution attempt.
     */
    onExecutionAttempt?: OnExecutionAttempt<TParameters, TContext>;

    /**
     * Callback {@link Invokable | `Invokable`} that will be called before the retry delay starts.
     */
    onRetryDelay?: OnRetryDelay<TParameters, TContext>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Middlewares
 */
export type RetrySettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = RetryCallbacks<TParameters, TContext> &
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
