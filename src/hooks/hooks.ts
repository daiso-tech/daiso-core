/**
 * @module Hooks
 */

import { type HookContext } from "@/hooks/types.js";
import {
    getInvokableName,
    resolveInvokable,
    resolveOneOrMore,
    type IInvokableObject,
    type Invokable,
    type InvokableFn,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type NextFunc<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvokableFn<TParameters, TReturn>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type Context<TContext extends HookContext = HookContext> = {
    name: string;
    context: TContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type MiddlewareFn<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = InvokableFn<
    [
        arguments_: TParameters,
        next: NextFunc<TParameters, TReturn>,
        settings: Context<TContext>,
    ],
    TReturn
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type IMiddlewareObject<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = IInvokableObject<
    [
        arguments_: TParameters,
        next: NextFunc<TParameters, TReturn>,
        settings: Context<TContext>,
    ],
    TReturn
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type Middleware<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> =
    | IMiddlewareObject<TParameters, TReturn, TContext>
    | MiddlewareFn<TParameters, TReturn, TContext>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type HooksSettings<TContext extends HookContext = HookContext> = {
    /**
     * The name of the function which can be used for logging inside the middleware.
     * By default, it takes the function or method name. If an anonymous function is provided, the name defaults to "func".
     */
    name?: string;

    /**
     * You can provide addtional context that can be used in the middleware.
     */
    context?: TContext;
};

/**
 * The `Hooks` class provides a convenient way to change and inspect arguments and return value of only sync functions.
 * For example `Hooks` class can be used to log function arguments and return values. Note this class is immutable.
 *
 * Middlewares apply left to right: each wraps the next, with the leftmost being the outermost layer and the rightmost wrapping the original function.
 *
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export class Hooks<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> implements IInvokableObject<TParameters, TReturn>
{
    private static init<
        TParameters extends Array<unknown>,
        TReturn,
        TContext extends HookContext,
    >(
        invokable: Invokable<TParameters, TReturn>,
        middlewares: OneOrMore<Middleware<TParameters, TReturn, TContext>>,
        {
            name = getInvokableName(invokable),
            context = {} as TContext,
        }: HooksSettings<TContext>,
    ): InvokableFn<TParameters, TReturn> {
        let func = resolveInvokable(invokable);
        for (const hook of resolveOneOrMore(middlewares)
            .map(resolveInvokable)
            .reverse()) {
            const prevFunc = func;
            const next = (...arguments_: TParameters) =>
                prevFunc(...arguments_);
            func = (...arguments_: TParameters) => {
                return hook(arguments_, next, {
                    name,
                    context,
                });
            };
        }
        return func;
    }

    private readonly func: InvokableFn<TParameters, TReturn>;

    /**
     * @example
     * ```ts
     * import { Hooks, type MiddlewareFn } from "@daiso-tech/core/hooks";
     *
     * function log<TParameters extends unknown[], TReturn>(): MiddlewareFn<TParameters, TReturn, { funcName: string; }> {
     *   return (args, next, { name: funcName }) => {
     *     console.log("FUNCTION_NAME:", funcName);
     *     console.log("ARGUMENTS:", args);
     *     const value = next(...args);
     *     console.log("RETURN:", value);
     *     return value;
     *   }
     * }
     *
     * function time<TParameters extends unknown[], TReturn>(): MiddlewareFn<TParameters, TReturn> {
     *   return (args, next) => {
     *     const start = performance.now();
     *     const value = next(...args);
     *     const end = performance.now();
     *     const time = end - start;
     *     console.log("TIME:", `${String(time)}ms`);
     *     return value;
     *   }
     * }
     *
     * function add(a: number, b: number): number {
     *   return a + b;
     * }
     *
     * const enhancedAdd = new Hooks(add, [
     *   log(),
     *   time()
     * ], {
     *   // You can provide addtional data to be used the middleware.
     *   context: {},
     * });
     *
     * // Will log the function name, arguments and return value.
     * // Will also log the execution time.
     * const result = enhancedAdd.invoke(1, 2);
     *
     * // Will be 3.
     * console.log(result);
     * ```
     */
    constructor(
        private readonly invokable: Invokable<TParameters, TReturn>,
        private readonly middlewares: NoInfer<
            OneOrMore<Middleware<TParameters, TReturn, TContext>>
        >,
        private readonly settings: HooksSettings<TContext> = {},
    ) {
        this.func = Hooks.init(invokable, middlewares, this.settings);
    }

    /**
     * The `pipe` method returns a new `Hooks` instance with the additional `middlewares` applied.
     */
    pipe(
        middlewares: OneOrMore<Middleware<TParameters, TReturn, TContext>>,
    ): Hooks<TParameters, TReturn, TContext> {
        return new Hooks(
            this.invokable,
            [
                ...resolveOneOrMore(this.middlewares),
                ...resolveOneOrMore(middlewares),
            ],
            this.settings,
        );
    }

    /**
     * The `pipeWhen` method conditionally applies additional `middlewares`, returning a new `Hooks` instance only if the specified condition is met.
     */
    pipeWhen(
        condition: boolean,
        middlewares: OneOrMore<Middleware<TParameters, TReturn, TContext>>,
    ): Hooks<TParameters, TReturn, TContext> {
        if (condition) {
            return this.pipe(middlewares);
        }
        return this;
    }

    /**
     * The `toFunc` will return the function with all middlewares applied.
     */
    toFunc(): InvokableFn<TParameters, TReturn> {
        return (...args) => this.invoke(...args);
    }

    /**
     * The `invoke` method executes the constructor's input function, applying all middlewares.
     */
    invoke(...arguments_: TParameters): TReturn {
        return this.func(...arguments_);
    }
}
