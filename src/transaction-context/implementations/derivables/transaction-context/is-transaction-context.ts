/**
 * @module TransactionContext
 */

import type {
    ITransactionContext,
    TransactionAware,
} from "@/transaction-context/contracts/_module.js";

/**
 * @internal
 */
export function isTransactionContext<TClient, TTransactionClient = TClient>(
    transactionAware: TransactionAware<TClient, TTransactionClient>,
): transactionAware is ITransactionContext<TClient, TTransactionClient> {
    throw new Error("Method not implemented.");
}
