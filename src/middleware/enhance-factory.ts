/**
 * @module Middleware
 */

import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/no-op-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { applyMiddlewares } from "@/middleware/helpers.js";
import {
    type Middleware,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type MiddlewareArgs,
} from "@/middleware/types.js";
import { type InvokableFn, type OneOrMore } from "@/utilities/_module.js";

/**
 * Configuration options for creating a middleware application function.
 *
 * Allows customization of the execution context used during middleware execution
 * and the default priority assigned to middlewares without an explicit priority.
 *
 * @example
 * ```ts
 * const customContext = new ExecutionContext(new CustomAdapter());
 * const enhance = enhanceFactory({
 *   executionContext: customContext,
 *   defaultPriority: 100
 * });
 * ```
 *
 * @see {@link useFactory | `useFactory`}
 * @see {@link IExecutionContext | `IExecutionContext`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type EnhanceFactorySettings = {
    /**
     * The execution context in which middleware will be executed.
     *
     * Used to manage state and context across middleware and invokable execution.
     * Middleware can access this context via the `context` property in {@link MiddlewareArgs | `MiddlewareArgs`}.
     *
     * @default
     * ```ts
     * new ExecutionContext(
     *   new NoOpExecutionContextAdapter()
     * )
     * ```
     *
     * @see {@link IExecutionContext | `IExecutionContext`}
     */
    executionContext?: IExecutionContext;

    /**
     * Default priority for middlewares that do not explicitly set a priority.
     *
     * Middlewares are executed in order of priority (lower values first).
     * This setting applies to function-based middlewares or object middlewares
     * that don't specify a priority.
     *
     * @default 0
     */
    defaultPriority?: number;
};

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type InferMethodNames<TInstance> = {
    [TKey in keyof TInstance]: TInstance[TKey] extends InvokableFn<any, any>
        ? TKey
        : never;
}[keyof TInstance];

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type InferParameters<TValue> =
    TValue extends InvokableFn<infer R, any> ? R : never;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type InferReturn<TValue> =
    TValue extends InvokableFn<Array<any>, infer R> ? R : never;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type Enhance = <TInstance, TField extends InferMethodNames<TInstance>>(
    obj: TInstance,
    field: TField,
    middlewares: OneOrMore<
        Middleware<
            InferParameters<TInstance[TField]>,
            InferReturn<TInstance[TField]>
        >
    >,
) => void;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export function enhanceFactory(settings: EnhanceFactorySettings = {}): Enhance {
    const {
        defaultPriority = 0,
        executionContext = new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        ),
    } = settings;

    return <TInstance, TField extends InferMethodNames<TInstance>>(
        obj: TInstance,
        field: TField,
        middlewares: OneOrMore<
            Middleware<
                InferParameters<TInstance[TField]>,
                InferReturn<TInstance[TField]>
            >
        >,
    ): void => {
        const fn = obj[field] as InvokableFn<any, any>;
        if (typeof fn !== "function") {
            throw new TypeError("!!__MESSAGE__!!");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        obj[field] = applyMiddlewares({
            defaultPriority,
            executionContext,
            invokable: fn.bind(obj[field]),
            middlewares,
        }) as any;
    };
}
