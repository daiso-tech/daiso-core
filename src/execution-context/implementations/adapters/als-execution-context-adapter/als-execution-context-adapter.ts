/**
 * @module ExecutionContext
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { type IExecutionContextAdapter } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/als-execution-context-adapter"`
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
