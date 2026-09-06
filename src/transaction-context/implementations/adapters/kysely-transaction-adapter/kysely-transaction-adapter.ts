/**
 * @module TransactionContext
 */

import type {
    AccessMode,
    ControlledTransaction,
    IsolationLevel,
    Kysely,
} from "kysely";

import type {
    ITransaction,
    ITransactionAdapter,
} from "@/transaction-context/contracts/_module.js";

/**
 * A Kysely-backed {@link ITransaction} that wraps a Kysely `ControlledTransaction`.
 *
 * @internal
 */
export class Transaction implements ITransaction<Kysely<any>> {
    /**
     * Creates a new `Transaction`.
     *
     * @param client - The underlying Kysely controlled transaction.
     */
    constructor(readonly client: ControlledTransaction<any>) {}

    /**
     * Commits the underlying Kysely transaction.
     *
     * @returns A promise that resolves once the transaction is committed.
     */
    commit(): Promise<void> {
        return this.client.commit().execute();
    }

    /**
     * Aborts the underlying Kysely transaction by rolling it back.
     *
     * @returns A promise that resolves once the transaction is rolled back.
     */
    abort(): Promise<void> {
        return this.client.rollback().execute();
    }
}

/**
 * Configuration for `KyselyTransactionAdapter`.
 *
 * @group Adapters
 */
export type KyselyTransactionAdapterSettings = {
    /**
     * The base Kysely database used to start transactions.
     */
    database: Kysely<any>;

    /**
     * The access mode applied to each new transaction.
     *
     * @default "read write"
     */
    accessMode?: AccessMode;

    /**
     * The isolation level applied to each new transaction.
     *
     * @default "serializable"
     */
    isolationLevel?: IsolationLevel;
};

/**
 * A Kysely-backed {@link ITransactionAdapter} that creates transactions from a
 * base `Kysely` client using a configured access mode and isolation level.
 *
 * The base `Kysely` client is exposed for use outside of any transaction.
 *
 * @group Adapters
 */
export class KyselyTransactionAdapter implements ITransactionAdapter<
    Kysely<any>
> {
    /**
     * The base Kysely client that operates outside of any transaction.
     */
    readonly client: Kysely<any>;
    private readonly accessMode: AccessMode;
    private readonly isolationLevel: IsolationLevel;

    /**
     * Creates a new `KyselyTransactionAdapter`.
     *
     * @param settings - The settings used to configure the adapter.
     */
    constructor(settings: KyselyTransactionAdapterSettings) {
        const {
            database,
            accessMode = "read write",
            isolationLevel = "serializable",
        } = settings;
        this.client = database;
        this.accessMode = accessMode;
        this.isolationLevel = isolationLevel;
    }

    /**
     * Starts a new Kysely transaction with the configured access mode and
     * isolation level.
     *
     * @returns A promise that resolves to the new Kysely transaction.
     */
    async start(): Promise<ITransaction<Kysely<any>>> {
        return new Transaction(
            await this.client
                .startTransaction()
                .setAccessMode(this.accessMode)
                .setIsolationLevel(this.isolationLevel)
                .execute(),
        );
    }
}
