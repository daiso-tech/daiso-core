/**
 * @module TransactionContext
 */

/**
 * An active transaction. Provides the transaction-scoped client and the
 * operations used to finalize the transaction.
 *
 * @typeParam TClient - The type of the transaction-scoped client.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransaction<TClient> = {
    /**
     * The transaction-scoped client to use for queries executed within this
     * transaction.
     *
     * This is `null` only when the adapter cannot support real transactions.
     * For example, `NoOpTransactionAdapter` sets this to `null` because it has
     * no transactional behavior.
     */
    readonly client: TClient | null;

    /**
     * Commits the transaction, persisting all changes made through
     * {@link ITransaction.client}.
     *
     * @returns A promise that resolves once the transaction is committed.
     */
    commit(): Promise<void>;

    /**
     * Aborts the transaction, discarding all changes made through
     * {@link ITransaction.client}.
     *
     * @returns A promise that resolves once the transaction is aborted.
     */
    abort(): Promise<void>;
};

/**
 * Manages transactions for an underlying client. Provides access to the base
 * client and starts new transactions.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionAdapter<
    TClient = unknown,
    TTransactionClient = TClient,
> = {
    /**
     * The base client that operates outside of any transaction.
     */
    readonly client: TClient;

    /**
     * Starts a new transaction.
     *
     * @returns A promise that resolves to an {@link ITransaction} for the new transaction.
     */
    start(): Promise<ITransaction<TTransactionClient>>;
};
