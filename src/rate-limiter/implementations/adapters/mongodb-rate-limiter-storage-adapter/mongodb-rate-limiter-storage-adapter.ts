/**
 * @module RateLimiter
 */

import {
    type Collection,
    type CollectionOptions,
    type Db,
    type MongoClient,
    type ObjectId,
} from "mongodb";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type IRateLimiterData,
    type IRateLimiterStorageAdapter,
    type IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import {
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
} from "@/utilities/_module.js";

/**
 * Configuration for `MongodbRateLimiterStorageAdapter`.
 * Requires a MongoDB `Db` instance.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterStorageAdapterSettings = {
    /**
     * The MongoDB `MongoClient` instance, required for transaction support.
     */
    client: MongoClient;
    /**
     * The MongoDB `Db` instance to store rate-limiter state in.
     */
    database: Db;
    /**
     * Name of the MongoDB collection used to store rate-limiter state records.
     * @default "rateLimiter"
     */
    collectionName?: string;
    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;
    /**
     * Serde instance for serializing and deserializing rate-limiter state to and from strings.
     */
    serde: ISerde<string>;

    /**
     * When `true`, operations are wrapped in MongoDB transactions for atomicity.
     * Requires a Replica Set or sharded cluster that supports transactions.
     * @default true
     */
    enableTransactions?: boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterDocument = {
    _id: ObjectId;
    key: string;
    state: string;
    expiration: Date;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class MongodbRateLimiterStorageAdapter<TType>
    implements IRateLimiterStorageAdapter<TType>, IInitizable, IDeinitizable
{
    private readonly client: MongoClient;
    private readonly collection: Collection<MongodbRateLimiterDocument>;
    private readonly serde: ISerde<string>;
    private readonly enableTransactions: boolean;

    /**
     * @example
     * ```ts
     * import { MongodbRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/mongodb-rate-limiter-storage-adapter";
     * import { MongoClient } from "mongodb";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterStorageAdapter = new MongodbRateLimiterStorageAdapter({
     *   client,
     *   database,
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await rateLimiterStorageAdapter.init()
     * ```
     */
    constructor(settings: MongodbRateLimiterStorageAdapterSettings) {
        const {
            client,
            collectionName = "rateLimiter",
            collectionSettings,
            database,
            serde,
            enableTransactions = true,
        } = settings;
        this.client = client;
        this.collection = database.collection(
            collectionName,
            collectionSettings,
        );
        this.serde = serde;
        this.enableTransactions = enableTransactions;
    }

    /**
     * Removes the collection where the rate limiter keys are stored and all it's related indexes.
     * Note all rate limiter data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the collection already does not exists thats why the try catch is used.
        try {
            await this.collection.dropIndexes();
        } catch {
            /* EMPTY */
        }

        // Should throw if the collection already does not exists thats why the try catch is used.
        try {
            await this.collection.drop();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Creates all related indexes.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.collection.createIndex(
                {
                    key: 1,
                },
                {
                    unique: true,
                },
            );
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.collection.createIndex("expiration", {
                expireAfterSeconds: 0,
            });
        } catch {
            /* EMPTY */
        }
    }

    private async upsert(
        _context: IReadableContext,
        key: string,
        state: TType,
        expiration: Date,
    ): Promise<void> {
        await this.collection.updateOne(
            {
                key,
            },
            {
                $set: {
                    state: this.serde.serialize(state),
                    expiration,
                },
            },
            {
                upsert: true,
            },
        );
    }

    private async _transaction<TValue>(
        _context: IReadableContext,
        trxFn: InvokableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        if (this.enableTransactions) {
            return await this.client.withSession(async (session) => {
                return await session.withTransaction(async () => {
                    return await trxFn();
                });
            });
        }
        return trxFn();
    }

    async transaction<TValue>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this._transaction(context, async () => {
            return await fn({
                upsert: (context, key, state, exiration) =>
                    this.upsert(context, key, state, exiration),
                find: (context, key) => this.find(context, key),
            });
        });
    }

    async find(
        _context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterData<TType> | null> {
        const doc = await this.collection.findOne({
            key,
        });
        if (doc === null) {
            return null;
        }
        return {
            state: this.serde.deserialize(doc.state),
            expiration: doc.expiration,
        };
    }

    async remove(_context: IReadableContext, key: string): Promise<void> {
        await this.collection.deleteOne({
            key,
        });
    }
}
