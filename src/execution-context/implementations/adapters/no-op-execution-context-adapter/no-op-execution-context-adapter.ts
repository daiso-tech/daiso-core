/**
 * @module ExecutionContext
 */

import { type IExecutionContextAdapter } from "@/execution-context/contracts/_module.js";
import { callInvokable, type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/no-op-execution-context-adapter"`
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
