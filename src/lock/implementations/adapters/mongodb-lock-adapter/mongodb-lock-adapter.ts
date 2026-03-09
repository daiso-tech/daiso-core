/**
 * @module Lock
 */

import {
    type Collection,
    type CollectionOptions,
    type Db,
    type ObjectId,
} from "mongodb";

import {
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type IDeinitizable, type IInitizable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export type MongodbLockAdapterSettings = {
    database: Db;
    /**
     * @default "lock"
     */
    collectionName?: string;
    collectionSettings?: CollectionOptions;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export type MongodbLockDocument = {
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
 * IMPORT_PATH: `"@daiso-tech/core/lock/mongodb-lock-adapter"`
 * @group Adapters
 */
export class MongodbLockAdapter
    implements ILockAdapter, IDeinitizable, IInitizable
{
    private readonly collection: Collection<MongodbLockDocument>;

    /**
     * @example
     * ```ts
     * import { MongodbLockAdapter } from "@daiso-tech/core/lock/mongodb-lock-adapter";
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
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
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

    async refresh(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const isUnexpiredQuery = {
            $and: [
                {
                    $ne: ["$expiration", null],
                },
                {
                    $gt: ["$expiration", new Date()],
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
                        expiration: {
                            $cond: {
                                if: isUnexpiredQuery,
                                then: ttl.toEndDate(),
                                else: "$expiration",
                            },
                        },
                    },
                },
            ],
        );

        if (lockData === null) {
            return false;
        }

        if (lockData.owner !== lockId) {
            return false;
        }

        if (lockData.expiration === null) {
            return false;
        }

        if (lockData.expiration <= new Date()) {
            return false;
        }

        return true;
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
