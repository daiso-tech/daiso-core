/**
 * @module Hooks
 */

import { type HookContext } from "@/hooks/types.js";
import {
    callInvokable,
    getInvokableName,
    resolveAsyncLazyable,
    resolveInvokable,
    resolveOneOrMore,
    type AsyncLazyable,
    type IInvokableObject,
    type Invokable,
    type InvokableFn,
    type OneOrMore,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type GetSignal<TParameters extends Array<unknown> = Array<unknown>> =
    Invokable<[arguments_: TParameters], AbortSignal | undefined>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type ForwardSignal<TParameters> = Invokable<
    [arguments_: TParameters, signal: AbortSignal],
    void
>;

/**
 * With {@link AbortSignalBinder | `AbortSignalBinder`}, you can bind an {@link AbortSignal | `AbortSignal`} to the middleware, enabling two-way abortion control.
 * This means the middleware can abort the function, or the function can abort the middleware if the input function supports an {@link AbortSignal | `AbortSignal`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 *
 * @example
 * ```ts
 * import { AsyncHooks } from "@daiso-tech/core/hooks";
 *
 * const abortController = new AbortController();
 *
 * // You can abort the function based on by your on criteria
 * abortController.abort("Aborted") // Remove this code if you want the function to aborted after 2 seconds by the middleware.
 *
 * const data = await new AsyncHooks(async (url: string, signal?: AbortSignal): Promise<unknown> => {
 *   const response = await fetch(url, { signal });
 *   return await response.json();
 * }, [
 *   (args, next, { abort, signal }) => {
 *     // We abort the function when it execdes 2 seconds.
 *     const id = setTimeout(() => abort("Timed out"), 2000);
 *     // We remove the timeout if function is aborted before it execdes 2 seconds.
 *     signal.addEventListener("abort", () => clearTimeout(id), { once: true });
 *     return next(...args);
 *   }
 * ], {
 *   signalBinder: {
 *     getSignal: (args) => args[1],
 *     forwardSignal: (args, signal) => {
 *       args[1] = signal;
 *     }
 *   }
 * })
 * .invoke("url", abortController.signal);
 *
 * console.log("DATA:", data)
 * ```
 */
export type AbortSignalBinder<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    getSignal: GetSignal<TParameters>;
    forwardSignal: ForwardSignal<TParameters>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type AsyncNextFunc<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvokableFn<TParameters, PromiseLike<TReturn>>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type AsyncContext<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = {
    name: string;
    signalBinder: AbortSignalBinder<TParameters>;
    context: TContext;
    abort: (error: unknown) => void;
    signal: AbortSignal;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type AsyncMiddlewareFn<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = InvokableFn<
    [
        arguments_: TParameters,
        next: AsyncNextFunc<TParameters, TReturn>,
        settings: AsyncContext<TParameters, TContext>,
    ],
    Promisable<TReturn>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type IAsyncMiddlewareObject<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> = IInvokableObject<
    [
        arguments_: TParameters,
        next: AsyncNextFunc<TParameters, TReturn>,
        settings: AsyncContext<TParameters, TContext>,
    ],
    Promisable<TReturn>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type AsyncMiddleware<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> =
    | IAsyncMiddlewareObject<TParameters, TReturn, TContext>
    | AsyncMiddlewareFn<TParameters, TReturn, TContext>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export type AsyncHooksSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TContext extends HookContext = HookContext,
> = {
    /**
     * The name of the function which can be used for logging inside the middleware.
     * By default, it takes the function or method name. If an anonymous function is provided, the name defaults to "func".
     */
    name?: string;

    /**
     * If the input function accepts an {@link AbortSignal | `AbortSignal`}, you can bind it to the middleware by providing an {@link AbortSignalBinder | `AbortSignalBinder`}.
     * This enables two-way abortion control: you can either abort the function from within the middleware, or abort the middleware from the function itself.
     */
    signalBinder?: AbortSignalBinder<TParameters>;

    /**
     * You can provide addtional context that can be used in the middleware.
     */
    context?: TContext;
};

/**
 * The `AsyncHooks` class provides a convenient way to change and inspect arguments and return value of both async and sync functions.
 * For example `AsyncHooks` class can be used to log function arguments and return values. Note this class will always return promise and is immutable.
 *
 * Middlewares apply left to right: each wraps the next, with the leftmost being the outermost layer and the rightmost wrapping the original function.
 *
 * IMPORT_PATH: `"@daiso-tech/core/hooks"`
 */
export class AsyncHooks<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    TContext extends HookContext = HookContext,
> implements IInvokableObject<TParameters, Promise<TReturn>>
{
    private static defaultAbortSignalBinder<
        TParameters extends Array<unknown>,
    >(): AbortSignalBinder<TParameters> {
        return {
            forwardSignal: (args) => args,
            getSignal: () => new AbortController().signal,
        };
    }

    private static resolveSignalBinder<TParameters extends Array<unknown>>(
        signalBinder: AbortSignalBinder<TParameters>,
        args: TParameters,
    ) {
        const outerSignal =
            callInvokable(signalBinder.getSignal, args) ??
            new AbortController().signal;
        const abortController = new AbortController();
        const abort = (reason: unknown): void => {
            abortController.abort(reason);
        };
        const mergedSignal = AbortSignal.any([
            outerSignal,
            abortController.signal,
        ]);
        callInvokable(signalBinder.forwardSignal, args, mergedSignal);
        return {
            abort,
            changedArgs: args,
            signal: mergedSignal,
        };
    }

    private static init<
        TParameters extends Array<unknown>,
        TReturn,
        TContext extends HookContext,
    >(
        invokable: Invokable<TParameters, Promisable<TReturn>>,
        middlewares: OneOrMore<AsyncMiddleware<TParameters, TReturn, TContext>>,
        {
            name = getInvokableName(invokable),
            signalBinder = AsyncHooks.defaultAbortSignalBinder(),
            context = {} as TContext,
        }: AsyncHooksSettings<TParameters, TContext>,
    ): InvokableFn<TParameters, Promisable<TReturn>> {
        let func = resolveInvokable(invokable);
        for (const hook of resolveOneOrMore(middlewares)
            .map(resolveInvokable)
            .reverse()) {
            const prevFunc = func;
            const next = async (...arguments_: TParameters) =>
                await prevFunc(...arguments_);
            func = async (...arguments_: TParameters) => {
                const resolvedSignalBinder = AsyncHooks.resolveSignalBinder(
                    signalBinder,
                    arguments_,
                );
                return await hook(resolvedSignalBinder.changedArgs, next, {
                    name,
                    signalBinder,
                    abort: (error: unknown) => {
                        resolvedSignalBinder.abort(error);
                    },
                    signal: resolvedSignalBinder.signal,
                    context,
                });
            };
        }
        return func;
    }

    private readonly func: InvokableFn<TParameters, Promisable<TReturn>>;

    /**
     * @example
     * ```ts
     * import { AsyncHooks, type AsyncMiddlewareFn } from "@daiso-tech/core/hooks";
     *
     * function log<TParameters extends unknown[], TReturn>(): AsyncMiddlewareFn<TParameters, TReturn> {
     *   return async (args, next, { name: funcName }) => {
     *     console.log("FUNCTION_NAME:", funcName);
     *     console.log("ARGUMENTS:", args);
     *     const value = await next(...args);
     *     console.log("RETURN:", value);
     *     return value;
     *   }
     * }
     *
     * function time<TParameters extends unknown[], TReturn>(): AsyncMiddlewareFn<TParameters, TReturn> {
     *   return async (args, next) => {
     *     const start = performance.now();
     *     const value = await next(...args);
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
     * const enhancedAdd = new AsyncHooks(add, [
     *   log(),
     *   time()
     * ], {
     *   // You can provide addtional data to be used the middleware.
     *   context: {},
     * });
     *
     * // Will log the function name, arguments and return value.
     * // Will also log the execution time.
     * const result = await enhancedAdd.invoke(1, 2);
     *
     * // Will be 3.
     * console.log(result);
     * ```
     */
    constructor(
        private readonly invokable: Invokable<TParameters, Promisable<TReturn>>,
        private readonly middlewares: NoInfer<
            OneOrMore<AsyncMiddleware<TParameters, TReturn, TContext>>
        >,
        private readonly settings: AsyncHooksSettings<
            TParameters,
            TContext
        > = {},
    ) {
        this.func = AsyncHooks.init(invokable, middlewares, this.settings);
    }

    /**
     * The `pipe` method returns a new `AsyncHooks` instance with the additional `middlewares` applied.
     */
    pipe(
        middlewares: OneOrMore<AsyncMiddleware<TParameters, TReturn, TContext>>,
    ): AsyncHooks<TParameters, TReturn, TContext> {
        return new AsyncHooks(
            this.invokable,
            [
                ...resolveOneOrMore(this.middlewares),
                ...resolveOneOrMore(middlewares),
            ],
            this.settings,
        );
    }

    /**
     * The `pipeWhen` method conditionally applies additional `middlewares`, returning a new `AsyncHooks` instance only if the specified condition is met.
     */
    pipeWhen(
        condition: AsyncLazyable<boolean>,
        middlewares: OneOrMore<AsyncMiddleware<TParameters, TReturn, TContext>>,
    ): AsyncHooks<TParameters, TReturn, TContext> {
        return this.pipe(async (args, next) => {
            if (await resolveAsyncLazyable(condition)) {
                return await new AsyncHooks<TParameters, TReturn, TContext>(
                    next,
                    resolveOneOrMore(middlewares),
                ).invoke(...args);
            }
            return await next(...args);
        });
    }

    /**
     * The `toFunc` will return the function with all middlewares applied.
     */
    toFunc(): InvokableFn<TParameters, PromiseLike<TReturn>> {
        return (...args) => this.invoke(...args);
    }

    /**
     * The `invoke` method executes the constructor's input function, applying all middlewares.
     */
    async invoke(...arguments_: TParameters): Promise<TReturn> {
        return await this.func(...arguments_);
    }
}
