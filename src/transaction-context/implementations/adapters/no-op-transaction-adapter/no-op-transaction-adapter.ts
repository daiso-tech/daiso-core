/**
 * @module TransactionContext
 */

import type {
    ITransaction,
    ITransactionAdapter,
} from "@/transaction-context/contracts/transaction-adapter.contract.js";

/**
 * A no-op implementation of {@link ITransactionAdapter} that provides no real
 * transactional behavior. Useful where transactions cannot be supported, such as
 * mocking a transaction context for testing.
 *
 * {@link NoOpTransactionAdapter.start | `start()`} returns a transaction whose `client`
 * is `null` (indicating that transactional behavior is unsupported), and whose `commit()`
 * and `abort()` resolve immediately without performing any work.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * @group Adapters
 */
export class NoOpTransactionAdapter<
    TClient = unknown,
    TTransactionClient = TClient,
> implements ITransactionAdapter<TClient, TTransactionClient> {
    /**
     * Creates a new `NoOpTransactionAdapter`.
     *
     * @param client - The base client that operates outside of any transaction.
     */
    constructor(readonly client: TClient) {}

    /**
     * Starts a no-op transaction.
     *
     * The returned transaction cannot support real transactions, so its `client` is
     * `null`; `commit()` and `abort()` resolve immediately and have no effect.
     *
     * @returns A promise that resolves to a no-op transaction.
     */
    start(): Promise<ITransaction<TTransactionClient>> {
        return Promise.resolve({
            client: null,
            abort: () => Promise.resolve(),
            commit: () => Promise.resolve(),
        });
    }
}
