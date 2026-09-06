/**
 * @module TransactionContext
 */

import { TO_MILLISECONDS } from "@/time-span/contracts/time-span.contract.js";

import type {
    ClientSession,
    ClientSessionOptions,
    Db,
    EndSessionOptions,
    MongoClient,
    TransactionOptions,
} from "mongodb";

import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type {
    ITransaction,
    ITransactionAdapter,
} from "@/transaction-context/contracts/transaction-adapter.contract.js";

/**
 * Configuration for `MongodbTransactionAdapter`.
 *
 * @group Adapters
 */
export type MongodbTransactionAdapterSettings = {
    /**
     * The MongoDB client used to start sessions and transactions.
     */
    client: MongoClient;

    /**
     * The database that is exposed as the base (non-transactional) client.
     */
    database: Db;

    /**
     * The timeout applied when committing a transaction.
     */
    commitTimeout?: ITimeSpan;

    /**
     * The timeout applied when aborting a transaction.
     */
    abortTimeout?: ITimeSpan;

    /**
     * The options passed to `startTransaction` for each new transaction.
     */
    startTransactionSettings?: TransactionOptions;

    /**
     * The options passed to `endSession` after a transaction is committed or aborted.
     */
    endSessionSettings?: EndSessionOptions;

    /**
     * The options passed to `startSession` when creating a new session.
     */
    startSessionSettings?: ClientSessionOptions;
};

/**
 * A MongoDB-backed {@link ITransaction} that wraps a `ClientSession`.
 *
 * Commits or aborts the session's transaction and always ends the session afterwards.
 *
 * @internal
 */
export class MongodbTransaction implements ITransaction<ClientSession> {
    /**
     * Creates a new `MongodbTransaction`.
     *
     * @param client - The MongoDB session that owns the transaction.
     * @param mongodbSettings - The settings used to commit or abort the transaction.
     */
    constructor(
        readonly client: ClientSession,
        private readonly mongodbSettings: Omit<
            MongodbTransactionAdapterSettings,
            "client" | "database"
        >,
    ) {}

    /**
     * Commits the session's transaction and ends the session.
     *
     * @returns A promise that resolves once the transaction is committed and the session ended.
     */
    async commit(): Promise<void> {
        try {
            await this.client.commitTransaction({
                timeoutMS:
                    this.mongodbSettings.commitTimeout?.[TO_MILLISECONDS](),
            });
        } finally {
            await this.client.endSession(
                this.mongodbSettings.endSessionSettings,
            );
        }
    }

    /**
     * Aborts the session's transaction and ends the session.
     *
     * @returns A promise that resolves once the transaction is aborted and the session ended.
     */
    async abort(): Promise<void> {
        try {
            await this.client.abortTransaction({
                timeoutMS:
                    this.mongodbSettings.abortTimeout?.[TO_MILLISECONDS](),
            });
        } finally {
            await this.client.endSession(
                this.mongodbSettings.endSessionSettings,
            );
        }
    }
}

/**
 * A MongoDB-backed {@link ITransactionAdapter} that creates transactions from
 * sessions started on the configured `MongoClient`.
 *
 * The configured `Db` instance is exposed as the base client used outside of any
 * transaction.
 *
 * @group Adapters
 */
export class MongodbTransactionAdapter implements ITransactionAdapter<
    Db,
    ClientSession
> {
    private readonly rawClient: MongoClient;
    private readonly database: Db;
    private readonly mongodbSettings: Omit<
        MongodbTransactionAdapterSettings,
        "client" | "database"
    >;

    /**
     * Creates a new `MongodbTransactionAdapter`.
     *
     * @param settings - The settings used to configure the adapter.
     */
    constructor(settings: MongodbTransactionAdapterSettings) {
        const { client, database, ...mongodbSettings } = settings;
        this.rawClient = client;
        this.database = database;

        this.mongodbSettings = mongodbSettings;
    }

    /**
     * The base database that operates outside of any transaction.
     */
    get client(): Db {
        return this.database;
    }

    /**
     * Starts a new transaction on a fresh MongoDB session.
     *
     * @returns A promise that resolves to the new MongoDB transaction.
     */
    start(): Promise<ITransaction<ClientSession>> {
        const session = this.rawClient.startSession(
            this.mongodbSettings.startSessionSettings,
        );
        session.startTransaction(this.mongodbSettings.startTransactionSettings);
        return Promise.resolve(
            new MongodbTransaction(session, this.mongodbSettings),
        );
    }
}
