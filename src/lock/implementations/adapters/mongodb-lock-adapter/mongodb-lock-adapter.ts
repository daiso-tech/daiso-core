/**
 * @module Lock
 */

import type { Collection, CollectionOptions, Db, ObjectId } from "mongodb";

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module.js";
import type { IDeinitizable, IInitizable } from "@/utilities/_module.js";

/**
 * Configuration for `MongodbLockAdapter`.
 * Requires a MongoDB `Db` instance.
 *
 * IMPORT_PATH: `"eridu-tech/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export type MongodbLockAdapterSettings = {
    /**
     * The MongoDB `Db` instance to store lock state in.
     */
    database: Db;
    /**
     * Name of the MongoDB collection used to store lock records.
     * @default "lock"
     */
    collectionName?: string;
    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;
};

/**
 * IMPORT_PATH: `"eridu-tech/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export type MongodbLockEntryDocument = {
    _id: ObjectId;
    key: string;
    owner: string;
    expiration: Date | null;
};

/**
 * To utilize the `MongodbLockAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Note in order to use `MongodbLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"eridu-tech/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export class MongodbLockAdapter
    implements ILockAdapter, IDeinitizable, IInitizable
{
    private readonly collection: Collection<MongodbLockEntryDocument>;

    /**
     * @example
     * ```ts
     * import { MongodbLockAdapter } from "eridu-tech/lock/mongodb-lock-adapter";
     * import { MongoClient } from "mongodb";
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const lockAdapter = new MongodbLockAdapter({
     *   database
     * });
     * // You need initialize the adapter once before using it.
     * await lockAdapter.init()
     * ```
     */
    constructor(settings: MongodbLockAdapterSettings) {
        const {
            collectionName = "lock",
            collectionSettings,
            database,
        } = settings;
        this.collection = database.collection(
            collectionName,
            collectionSettings,
        );
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

    /**
     * Removes the collection where the lock keys are stored and all it's related indexes.
     * Note all lock data will be removed.
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

    async acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const expiration = ttl ?? null;
        const isExpiredQuery = {
            $and: [
                {
                    $ne: ["$expiration", null],
                },
                {
                    $lte: ["$expiration", new Date()],
                },
            ],
        };
        const lockData = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                {
                    $set: {
                        key,
                        owner: {
                            $ifNull: ["$owner", lockId],
                        },
                        expiration: {
                            $ifNull: ["$expiration", expiration],
                        },
                    },
                },
                {
                    $set: {
                        owner: {
                            $cond: {
                                if: isExpiredQuery,
                                then: lockId,
                                else: "$owner",
                            },
                        },
                        expiration: {
                            $cond: {
                                if: isExpiredQuery,
                                then: expiration,
                                else: "$expiration",
                            },
                        },
                    },
                },
            ],
            {
                upsert: true,
            },
        );
        if (lockData === null) {
            return true;
        }
        if (lockData.owner === lockId) {
            return true;
        }
        if (lockData.expiration === null) {
            return false;
        }
        return lockData.expiration <= new Date();
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const isUnexpirableQuery = {
            expiration: {
                $eq: null,
            },
        };
        const isUnexpiredQuery = {
            expiration: {
                $gt: new Date(),
            },
        };
        const lockData = await this.collection.findOneAndDelete({
            key,
            owner: lockId,
            $or: [isUnexpirableQuery, isUnexpiredQuery],
        });

        if (lockData === null) {
            return false;
        }

        const { expiration } = lockData;
        const hasNoExpiration = expiration === null;
        if (hasNoExpiration) {
            return true;
        }

        const { owner: currentOwner } = lockData;
        const isNotExpired = expiration > new Date();
        const isCurrentOwner = lockId === currentOwner;
        return isNotExpired && isCurrentOwner;
    }

    async forceRelease(key: string): Promise<boolean> {
        const lockData = await this.collection.findOneAndDelete({ key });
        if (lockData === null) {
            return false;
        }
        if (lockData.expiration === null) {
            return true;
        }
        const isNotExpired = lockData.expiration >= new Date();
        return isNotExpired;
    }

    async refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        const now = new Date();

        const lockData = await this.collection.findOneAndUpdate(
            {
                key,
                owner: lockId,
                expiration: {
                    $ne: null,
                    $gt: now,
                },
            },
            {
                $set: {
                    expiration: ttl,
                },
            },
        );

        return lockData !== null;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const lockData = await this.collection.findOne({
            key,
        });
        if (lockData === null) {
            return null;
        }
        if (lockData.expiration !== null && lockData.expiration <= new Date()) {
            return null;
        }
        return {
            owner: lockData.owner,
            expiration: lockData.expiration,
        };
    }
}
