/**
 * @module ExecutionContext
 */

import { type IExecutionContextAdapter } from "@/execution-context/contracts/_module.js";
import { callInvokable, type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/no-op-execution-context-adapter"`
 *
 * No-operation execution context adapter.
 *
 * This adapter implements IExecutionContextAdapter but provides no actual context storage.
 * It always returns null for get() and simply executes functions without maintaining any context.
 * Useful for scenarios where context management is not needed or for testing purposes.
 *
 * Use this adapter when you want to disable context functionality or in environments
 * where context propagation is not necessary.
 */
export class NoOpExecutionContextAdapter<TValue>
    implements IExecutionContextAdapter<TValue>
{
    get(): TValue | null {
        return null;
    }

    run<TReturn>(_context: TValue, fn: InvokableFn<[], TReturn>): TReturn {
        return callInvokable(fn);
    }
}
