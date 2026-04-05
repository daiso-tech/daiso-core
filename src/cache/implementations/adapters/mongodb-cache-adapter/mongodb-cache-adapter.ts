/**
 * @module Cache
 */

import escapeStringRegexp from "escape-string-regexp";
import {
    MongoServerError,
    type ObjectId,
    type Collection,
    type Filter,
    type CollectionOptions,
    type Db,
} from "mongodb";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { MongodbCacheAdapterSerde } from "@/cache/implementations/adapters/mongodb-cache-adapter/mongodb-cache-adapter-serde.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import {
    UnexpectedError,
    type IDeinitizable,
    type IInitizable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/mongodb-cache-adapter"`
 * @group Adapters
 */
export type MongodbCacheAdapterSettings = {
    database: Db;
    serde: ISerde<string>;
    /**
     * @default "cache"
     */
    collectionName?: string;
    collectionSettings?: CollectionOptions;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/mongodb-cache-adapter"`
 * @group Adapters
 */
export type MongodbCacheDocument = {
    _id: ObjectId;
    key: string;
    value: number | string;
    expiration: Date | null;
};

/**
 * To utilize the `MongodbCacheAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package and supply a {@link ISerde | `ISerde<string>`}, with an adapter like {@link SuperJsonSerdeAdapter | `SuperJsonSerdeAdapter `}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/mongodb-cache-adapter"`
 * @group Adapters
 */
export class MongodbCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>, IInitizable, IDeinitizable
{
    private static filterUnexpiredKeys(
        keys: Array<string>,
    ): Filter<MongodbCacheDocument> {
        const hasNoExpiration: Filter<MongodbCacheDocument> = {
            expiration: {
                $eq: null,
            },
        };
        const hasExpiration: Filter<MongodbCacheDocument> = {
            expiration: {
                $ne: null,
            },
        };
        const hasNotExpired: Filter<MongodbCacheDocument> = {
            expiration: {
                $gt: new Date(),
            },
        };
        const keysMatch = {
            key: {
                $in: keys,
            },
        };
        return {
            $and: [
                keysMatch,
                {
                    $or: [
                        hasNoExpiration,
                        {
                            $and: [hasExpiration, hasNotExpired],
                        },
                    ],
                },
            ],
        };
    }

    private static isMongodbIncrementError(
        value: unknown,
    ): value is MongoServerError {
        return (
            value instanceof MongoServerError &&
            value.code !== undefined &&
            (typeof value.code === "string" ||
                typeof value.code === "number") &&
            String(value.code) === "14"
        );
    }

    private readonly serde: ISerde<string | number>;
    private readonly collection: Collection<MongodbCacheDocument>;

    /**
     * @example
     * ```ts
     * import { MongodbCacheAdapter } from "@daiso-tech/core/cache/mongodb-cache-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import { MongoClient } from "mongodb";
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheAdapter = new MongodbCacheAdapter({
     *   database,
     *   serde,
     * });
     * // You need initialize the adapter once before using it.
     * await cacheAdapter.init();
     * ```
     */
    constructor(settings: MongodbCacheAdapterSettings) {
        const {
            collectionName = "cache",
            collectionSettings,
            database,
            serde,
        } = settings;
        this.collection = database.collection(
            collectionName,
            collectionSettings,
        );
        this.serde = new MongodbCacheAdapterSerde(serde);
    }

    /**
     * Creates all related indexes.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
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
            /* Empty */
        }

        try {
            await this.collection.createIndex("expiration", {
                expireAfterSeconds: 0,
            });
        } catch {
            /* Empty */
        }
    }

    /**
     * Removes the collection where the cache values are stored and all it's related indexes.
     * Note all cache data will be removed.
     */
    async deInit(): Promise<void> {
        try {
            await this.collection.dropIndexes();
        } catch {
            /* EMPTY */
        }

        try {
            await this.collection.drop();
        } catch {
            /* EMPTY */
        }
    }

    private getDocValue(document: MongodbCacheDocument | null): TType | null {
        if (document === null) {
            return null;
        }
        const { expiration, value } = document;
        if (expiration === null) {
            return this.serde.deserialize(value);
        }
        const hasExpired = expiration.getTime() <= new Date().getTime();
        if (hasExpired) {
            return null;
        }
        return this.serde.deserialize(value);
    }

    async get(_context: IReadableContext, key: string): Promise<TType | null> {
        const document = await this.collection.findOne(
            {
                key,
            },
            {
                projection: {
                    _id: 0,
                    expiration: 1,
                    value: 1,
                },
            },
        );
        return this.getDocValue(document);
    }

    async getAndRemove(
        _context: IReadableContext,
        key: string,
    ): Promise<TType | null> {
        const document = await this.collection.findOneAndDelete(
            {
                key,
            },
            {
                projection: {
                    _id: 0,
                    expiration: 1,
                    value: 1,
                },
            },
        );
        return this.getDocValue(document);
    }

    private isDocExpired(document: MongodbCacheDocument | null): boolean {
        if (document === null) {
            return true;
        }
        const { expiration } = document;
        if (expiration === null) {
            return false;
        }
        const hasExpired = expiration.getTime() <= new Date().getTime();
        return hasExpired;
    }

    async add(
        _context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const hasExpirationQuery = {
            $ne: ["$expiration", null],
        };
        const hasExpiredQuery = {
            $lte: ["$expiration", new Date()],
        };
        const hasExpirationAndExpiredQuery = {
            $and: [hasExpirationQuery, hasExpiredQuery],
        };
        const serializedValue = this.serde.serialize(value);
        const document = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                {
                    $set: {
                        value: {
                            $cond: {
                                if: hasExpirationAndExpiredQuery,
                                then: serializedValue,
                                else: "$value",
                            },
                        },
                        expiration: {
                            $cond: {
                                if: hasExpirationAndExpiredQuery,
                                then: ttl?.toEndDate() ?? null,
                                else: "$expiration",
                            },
                        },
                    },
                },
            ],
            {
                upsert: true,
                projection: {
                    _id: 0,
                    expiration: 1,
                },
            },
        );
        return this.isDocExpired(document);
    }

    async put(
        _context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const document = await this.collection.findOneAndUpdate(
            {
                key,
            },
            {
                $set: {
                    value: this.serde.serialize(value),
                    expiration: ttl?.toEndDate() ?? null,
                },
            },
            {
                upsert: true,
                projection: {
                    _id: 0,
                    expiration: 1,
                },
            },
        );
        return !this.isDocExpired(document);
    }

    async update(
        _context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<boolean> {
        const updateResult = await this.collection.updateOne(
            MongodbCacheAdapter.filterUnexpiredKeys([key]),
            {
                $set: {
                    value: this.serde.serialize(value),
                },
            },
        );
        if (!updateResult.acknowledged) {
            throw new UnexpectedError("Mongodb update was not acknowledged");
        }
        return updateResult.modifiedCount > 0;
    }

    async increment(
        _context: IReadableContext,
        key: string,
        value: number,
    ): Promise<boolean> {
        try {
            const updateResult = await this.collection.updateOne(
                MongodbCacheAdapter.filterUnexpiredKeys([key]),
                {
                    $inc: {
                        value,
                    } as Record<string, number>,
                },
            );
            if (!updateResult.acknowledged) {
                throw new UnexpectedError(
                    "Mongodb update was not acknowledged",
                );
            }
            return updateResult.modifiedCount > 0;
        } catch (error: unknown) {
            if (MongodbCacheAdapter.isMongodbIncrementError(error)) {
                throw new TypeError(
                    `Unable to increment or decrement none number type key "${key}"`,
                );
            }
            throw error;
        }
    }

    async removeMany(
        _context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean> {
        const deleteResult = await this.collection.deleteMany(
            MongodbCacheAdapter.filterUnexpiredKeys(keys),
        );
        if (!deleteResult.acknowledged) {
            throw new UnexpectedError("Mongodb deletion was not acknowledged");
        }
        return deleteResult.deletedCount > 0;
    }

    async removeAll(): Promise<void> {
        const mongodbResult = await this.collection.deleteMany();
        if (!mongodbResult.acknowledged) {
            throw new UnexpectedError("Mongodb deletion was not acknowledged");
        }
    }

    async removeByKeyPrefix(
        _context: IReadableContext,
        prefix: string,
    ): Promise<void> {
        const mongodbResult = await this.collection.deleteMany({
            key: {
                $regex: new RegExp(`^${escapeStringRegexp(prefix)}`),
            },
        });
        if (!mongodbResult.acknowledged) {
            throw new UnexpectedError("Mongodb deletion was not acknowledged");
        }
    }
}
