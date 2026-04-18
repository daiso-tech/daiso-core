/**
 * @module ExecutionContext
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { type IExecutionContextAdapter } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/als-execution-context-adapter"`
 *
 * Execution context adapter using Node.js AsyncLocalStorage.
 *
 * This adapter implements context storage using Node.js's AsyncLocalStorage API,
 * which provides automatic context propagation across async boundaries.
 * It ensures context values are maintained correctly through promises, callbacks,
 * and other asynchronous operations.
 *
 * Recommended for Node.js environments where async context isolation is needed.
 */
export class AlsExecutionContextAdapter<TValue>
    implements IExecutionContextAdapter<TValue>
{
    private readonly als = new AsyncLocalStorage<TValue>();

    get(): TValue | null {
        return this.als.getStore() ?? null;
    }

    run<TReturn>(context: TValue, fn: InvokableFn<[], TReturn>): TReturn {
        return this.als.run(context, fn);
    }
}
