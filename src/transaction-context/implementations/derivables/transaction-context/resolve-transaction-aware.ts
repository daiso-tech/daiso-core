/**
 * @module TransactionContext
 */

import { contextToken } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module.js";
import { isTransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/is-transaction-context.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";

import type {
    ITransactionContext,
    TransactionAware,
} from "@/transaction-context/contracts/_module.js";

/**
 * @internal
 */
export function resolveTransactionAware<TClient, TTransactionClient = TClient>(
    transactionAware: TransactionAware<TClient, TTransactionClient>,
): ITransactionContext<TClient, TTransactionClient> {
    if (isTransactionContext(transactionAware)) {
        return transactionAware;
    }
    return new TransactionContext({
        token: contextToken(""),
        adapter: new NoOpTransactionAdapter(transactionAware),
        executionContext: new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        ),
    });
}
