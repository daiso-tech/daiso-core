/**
 * @module TransactionContext
 */

import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type {
    ITransactionContext,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module.js";

/**
 * Creates a middleware factory that runs the wrapped function inside a transaction.
 *
 * The default propagation is `TRANSACTION_PROPAGATION.REQUIRED`: the wrapped function
 * joins an existing transaction when one is active and starts a new one otherwise.
 *
 * The returned middleware delegates to `transactionContext.run()` with the requested
 * {@link TransactionPropagation | propagation}, so `next` executes within a transaction
 * scope — joining, starting, or forbidding one depending on the propagation mode.
 *
 * @param transactionContext - The transaction context whose `run()` method executes the
 * wrapped function.
 * @returns A middleware that runs `next` inside a transaction, using the propagation
 * `TRANSACTION_PROPAGATION.REQUIRED` by default.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export function withTransactionFactory(
    transactionContext: Pick<ITransactionContext, "run">,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        propagation: TransactionPropagation = TRANSACTION_PROPAGATION.REQUIRED,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return ({ next }) => {
            return transactionContext.run(propagation, next);
        };
    };
}
