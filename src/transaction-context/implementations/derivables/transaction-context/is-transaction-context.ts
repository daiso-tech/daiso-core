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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const transactionAware_ = transactionAware as any;
    return (
        typeof transactionAware_ === "object" &&
        transactionAware_ !== null &&
        "client" in transactionAware_ &&
        "isInTransaction" in transactionAware_ &&
        "transaction" in transactionAware_ &&
        "current" in transactionAware_ &&
        "getTransactionOrFail" in transactionAware_ &&
        "run" in transactionAware_
    );
}
