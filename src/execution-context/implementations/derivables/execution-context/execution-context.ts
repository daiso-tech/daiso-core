/**
 * @module ExecutionContext
 */

import {
    type ContextToken,
    type DecrementSettings,
    type IContext,
    type ICopyableContext,
    type IExecutionContext,
    type IExecutionContextAdapter,
    type IncrementSettings,
    type PutDecrementSettings,
    type PutIncrementSettings,
} from "@/execution-context/contracts/_module.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import {
    callInvokable,
    type Invokable,
    type InvokableFn,
    type Lazyable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context"`
 *
 * Manages execution context values and provides a way to execute functions within a context.
 *
 * The ExecutionContext class serves as the main entry point for context management.
 * It delegates all operations to an underlying context adapter that handles the actual
 * storage and lifecycle of context values. This allows different adapter implementations
 * (e.g., AsyncLocalStorage for Node.js) to manage context differently.
 *
 * Provides methods to:
 * - Get, set, update, and remove context values using context tokens
 * - Execute functions within a specific context
 * - Bind functions to capture and preserve context across async boundaries
 */
export class ExecutionContext implements IExecutionContext {
    /**
     * Creates a new ExecutionContext instance.
     *
     * @param executionContextStorage - The adapter responsible for storing and managing context values
     */
    constructor(
        private readonly executionContextStorage: IExecutionContextAdapter<ICopyableContext>,
    ) {}

    private get current(): ICopyableContext {
        const context = this.executionContextStorage.get();
        if (context === null) {
            return new NoOpContext();
        }
        return context;
    }

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean {
        return this.current.contains(token, matchValue);
    }

    exists<TValue>(token: ContextToken<TValue>): boolean {
        return this.current.exists(token);
    }

    missing<TValue>(token: ContextToken<TValue>): boolean {
        return this.current.missing(token);
    }

    get<TValue>(token: ContextToken<TValue>): TValue | null {
        return this.current.get(token);
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue {
        return this.current.getOr(token, defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): TValue {
        return this.current.getOrFail(token);
    }

    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        return this.current.add(token, value);
    }

    put<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        return this.current.put(token, value);
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IContext {
        return this.current.putIncrement(token, settings);
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IContext {
        return this.current.putDecrement(token, settings);
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return this.current.putPush(token, ...values);
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IContext {
        return this.current.update(token, value);
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IContext {
        return this.current.updateIncrement(token, settings);
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IContext {
        return this.current.updateDecrement(token, settings);
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return this.current.updatePush(token, ...values);
    }

    remove<TValue>(token: ContextToken<TValue>): IContext {
        return this.current.remove(token);
    }

    when(
        condition: Lazyable<boolean>,
        ...invokables: Array<Invokable<[context: IContext], IContext>>
    ): IContext {
        return this.current.when(condition, ...invokables);
    }

    run<TValue>(invokable: Invokable<[], TValue>): TValue {
        const currentContext = this.executionContextStorage.get();
        const contextToRun =
            currentContext === null
                ? new Context(new Map())
                : currentContext.copy();
        return this.executionContextStorage.run(contextToRun, () => {
            return callInvokable(invokable);
        });
    }

    bind<TArgs extends Array<unknown>, TReturn>(
        fn: Invokable<[...args: TArgs], TReturn>,
    ): InvokableFn<[...args: TArgs], TReturn> {
        // Capture the context at bind time
        const currentContext = this.executionContextStorage.get();
        const capturedContext =
            currentContext === null
                ? new Context(new Map())
                : currentContext.copy();

        return (...args: TArgs): TReturn => {
            return this.executionContextStorage.run(
                capturedContext.copy(),
                () => {
                    return callInvokable(fn, ...args);
                },
            );
        };
    }
}
