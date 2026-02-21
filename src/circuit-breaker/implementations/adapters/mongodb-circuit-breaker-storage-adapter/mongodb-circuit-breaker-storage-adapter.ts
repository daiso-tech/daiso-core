/**
 * @module CircuitBreaker
 */

import {
    type Collection,
    type CollectionOptions,
    type Db,
    type MongoClient,
    type ObjectId,
} from "mongodb";

import {
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import {
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerStorageDocument = {
    _id: ObjectId;
    key: string;
    state: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerStorageAdapterSettings = {
    client: MongoClient;
    database: Db;
    /**
     * @default "circuitBreaker"
     */
    collectionName?: string;
    collectionSettings?: CollectionOptions;
    serde: ISerde<string>;

    /**
     * @default true
     */
    enableTransactions?: boolean;
};

/**
 * To utilize the `MongodbCircuitBreakerStorageAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Note in order to use `MongodbCircuitBreakerStorageAdapter` correctly, you need to use a database that has support for transactions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/mongodb-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class MongodbCircuitBreakerStorageAdapter<TType = unknown>
    implements ICircuitBreakerStorageAdapter<TType>, IInitizable, IDeinitizable
{
    private readonly collection: Collection<MongodbCircuitBreakerStorageDocument>;
    private readonly client: MongoClient;
    private readonly serde: ISerde<string>;
    private readonly enableTransactions: boolean;

    /**
     * @example
     * ```ts
     * import { MongodbCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/mongodb-circuit-breaker-storage-adapter";
     * import { MongoClient } from "mongodb";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
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

    private async upsert<TType>(key: string, state: TType): Promise<void> {
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
            },
        );
    }

    private async _transaction<TValue>(
        trxFn: InvokableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        if (this.enableTransactions) {
            return await this.client
                .startSession()
                .withTransaction(async () => {
                    return await trxFn();
                });
        }
        return trxFn();
    }

    async transaction<TValue>(
        fn: InvokableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this._transaction(async () => {
            return await fn({
                upsert: (key, state) => this.upsert(key, state),
                find: (key) => this.find(key),
            });
        });
    }

    async find(key: string): Promise<TType | null> {
        const doc = await this.collection.findOne({ key });
        if (doc === null) {
            return null;
        }
        return this.serde.deserialize<TType>(doc.state);
    }

    async remove(key: string): Promise<void> {
        await this.collection.deleteOne({
            key,
        });
    }
}
