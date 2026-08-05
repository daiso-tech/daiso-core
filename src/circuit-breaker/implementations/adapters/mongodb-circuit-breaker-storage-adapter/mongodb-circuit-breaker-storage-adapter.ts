/**
 * @module CircuitBreaker
 */

import type {
    ClientSession,
    Collection,
    CollectionOptions,
    Db,
    MongoClient,
    ObjectId,
} from "mongodb";

import type {
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerStorageDocument = {
    _id: ObjectId;
    key: string;
    state: string;
};

/**
 * Configuration for `MongodbCircuitBreakerStorageAdapter`.
 * Requires a MongoDB `Db` instance.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerStorageAdapterSettings = {
    /**
     * The MongoDB `MongoClient` instance, required for transaction support.
     */
    client: MongoClient;
    /**
     * The MongoDB `Db` instance to store circuit-breaker state in.
     */
    database: Db;
    /**
     * Name of the MongoDB collection used to store circuit-breaker state records.
     * @default "circuitBreaker"
     */
    collectionName?: string;
    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;
    /**
     * Serde instance for serializing and deserializing circuit-breaker state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * To utilize the `MongodbCircuitBreakerStorageAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Note in order to use `MongodbCircuitBreakerStorageAdapter` correctly, you need to use a database that has support for transactions.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class MongodbCircuitBreakerStorageAdapter<TType = unknown>
    implements ICircuitBreakerStorageAdapter<TType>, IInitizable, IDeinitizable
{
    private readonly collection: Collection<MongodbCircuitBreakerStorageDocument>;
    private readonly client: MongoClient;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { MongodbCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter";
     * import { MongoClient } from "mongodb";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerStorageAdapter = new MongodbCircuitBreakerStorageAdapter({
     *   client,
     *   database,
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await circuitBreakerStorageAdapter.init()
     * ```
     */
    constructor(settings: MongodbCircuitBreakerStorageAdapterSettings) {
        const {
            client,
            collectionName = "circuitBreaker",
            collectionSettings,
            database,
            serde,
        } = settings;
        this.client = client;
        this.collection = database.collection(
            collectionName,
            collectionSettings,
        );
        this.serde = serde;
    }

    /**
     * Removes the collection where the circuit breaker keys are stored and all it's related indexes.
     * Note all circuit breaker data will be removed.
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
    }

    private async upsert<TType_>(
        key: string,
        state: TType_,
        _context: IReadableContext,
        session?: ClientSession,
    ): Promise<void> {
        await this.collection.updateOne(
            {
                key,
            },
            {
                $set: {
                    state: this.serde.serialize(state),
                },
            },
            {
                upsert: true,
                session,
            },
        );
    }

    private async _transaction<TValue>(
        trxFn: InvocableFn<[session?: ClientSession], Promise<TValue>>,
    ): Promise<TValue> {
        return await this.client.withSession(async (session) => {
            return await session.withTransaction(async () => {
                return await trxFn(session);
            });
        });
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
        _context: IReadableContext,
    ): Promise<TValue> {
        return await this._transaction(async (session) => {
            return await fn({
                upsert: (key, state, context) =>
                    this.upsert(key, state, context, session),
                find: (key, context) => this.find(key, context, session),
            });
        });
    }

    async find(
        key: string,
        _context: IReadableContext,
        session?: ClientSession,
    ): Promise<TType | null> {
        const doc = await this.collection.findOne(
            { key },
            {
                session,
            },
        );
        if (doc === null) {
            return null;
        }
        return this.serde.deserialize<TType>(doc.state);
    }

    async remove(
        key: string,
        _context: IReadableContext,
        session?: ClientSession,
    ): Promise<void> {
        await this.collection.deleteOne(
            {
                key,
            },
            { session },
        );
    }
}
