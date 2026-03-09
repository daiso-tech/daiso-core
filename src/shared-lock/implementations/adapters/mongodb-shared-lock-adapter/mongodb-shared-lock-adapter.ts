/**
 * @module SharedLock
 */

import {
    type Collection,
    type CollectionOptions,
    type Db,
    type Document,
    type ObjectId,
} from "mongodb";

import {
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    UnexpectedError,
    type IDeinitizable,
    type IInitizable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/mongodb-shared-lock-adapter"`
 * @group Adapters
 */
export type MongodbSharedLockAdapterSettings = {
    database: Db;
    /**
     * @default "sharedLock"
     */
    collectionName?: string;
    collectionSettings?: CollectionOptions;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/mongodb-shared-lock"`
 * @group Adapters
 */
export type MongodbWriterLockSubDocument = {
    owner: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-shared-lock"`
 * @group Adapters
 */
export type MongodbReaderSemaphoreSlotSubDocument = {
    id: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-shared-lock"`
 * @group Adapters
 */
export type MongodbReaderSemaphoreDocument = {
    limit: number;
    slots: Array<MongodbReaderSemaphoreSlotSubDocument>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/mongodb-shared-lock-adapter"`
 * @group Adapters
 */
export type MongodbSharedLockDocument = {
    _id: ObjectId;
    key: string;
    expiration: Date | null;
    writer: MongodbWriterLockSubDocument | null;
    reader: MongodbReaderSemaphoreDocument | null;
};

/**
 * To utilize the `MongodbSharedLockAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Note in order to use `MongodbSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/mongodb-shared-lock-adapter"`
 * @group Adapters
 */
export class MongodbSharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable, IInitizable
{
    private static isSlotNotExpired = (
        slot: MongodbReaderSemaphoreSlotSubDocument,
    ) => slot.expiration === null || slot.expiration > new Date();

    private readonly collection: Collection<MongodbSharedLockDocument>;

    /**
     * @example
     * ```ts
     * import { MongodbSharedLockAdapter } from "@daiso-tech/core/shared-lock/mongodb-shared-lock-adapter";
     * import { MongoClient } from "mongodb";
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const sharedLockAdapter = new MongodbSharedLockAdapter({
     *   database
     * });
     * // You need initialize the adapter once before using it.
     * await sharedLockAdapter.init()
     * ```
     */
    constructor(settings: MongodbSharedLockAdapterSettings) {
        const {
            collectionName = "sharedLock",
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
     * Removes the collection where the shared-lock keys are stored and all it's related indexes.
     * Note all shared-lock data will be removed.
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

    private updateSemaphoreExpiration(): Array<Document> {
        const hasUnexpireableSlotQuery = {
            $in: [
                null,
                {
                    $map: {
                        input: "$reader.slots",
                        as: "slot",
                        in: "$$slot.expiration",
                    },
                },
            ],
        };
        const hasNoSlotsQuery = {
            $eq: [{ $size: "$reader.slots" }, 0],
        };
        return [
            {
                $set: {
                    expiration: {
                        $cond: {
                            if: {
                                $ne: ["$reader", null],
                            },
                            then: {
                                $cond: {
                                    // Check if there is at least one unexpirable slot
                                    if: hasUnexpireableSlotQuery,
                                    // If there are at least one unexpirable slot we set the expiration to null
                                    then: null,
                                    // If all slots are expireable we set the expiration to highest expiration
                                    else: {
                                        $max: "$reader.slots.expiration",
                                    },
                                },
                            },
                            else: "$expiration",
                        },
                    },
                },
            },
            {
                $set: {
                    expiration: {
                        $cond: {
                            if: {
                                $ne: ["$reader", null],
                            },
                            then: {
                                $cond: {
                                    // Are there slots acquired
                                    if: hasNoSlotsQuery,
                                    // If there are no slots acquired we immediatley expire the semaphore
                                    then: TimeSpan.fromMinutes(1).toStartDate(),
                                    // If there are slots acquired we do nothing
                                    else: "$expiration",
                                },
                            },
                            else: "$expiration",
                        },
                    },
                },
            },
        ];
    }

    private removeWriterWhenReaderIsActive(): Array<Document> {
        return [
            {
                $set: {
                    writer: {
                        $cond: {
                            if: {
                                $ne: ["$reader", null],
                            },
                            then: null,
                            else: "$writer",
                        },
                    },
                },
            },
            ...this.updateSemaphoreExpiration(),
        ];
    }

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        const isExpiredQuery = {
            $and: [
                {
                    $ne: ["$writer.expiration", null],
                },
                {
                    $lte: ["$writer.expiration", new Date()],
                },
            ],
        };
        const sharedLock = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                {
                    $set: {
                        key,
                        reader: {
                            $ifNull: ["$reader", null],
                        },
                        "writer.owner": {
                            $ifNull: ["$writer.owner", lockId],
                        },
                        "writer.expiration": {
                            $ifNull: ["$writer.expiration", expiration],
                        },
                        expiration: {
                            $ifNull: ["$expiration", expiration],
                        },
                    },
                },
                {
                    $set: {
                        "writer.owner": {
                            $cond: {
                                if: isExpiredQuery,
                                then: lockId,
                                else: "$writer.owner",
                            },
                        },
                        "writer.expiration": {
                            $cond: {
                                if: isExpiredQuery,
                                then: expiration,
                                else: "$writer.expiration",
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
                ...this.removeWriterWhenReaderIsActive(),
            ],
            {
                upsert: true,
                projection: {
                    _id: 0,
                    writer: 1,
                    reader: 1,
                },
            },
        );
        if (sharedLock === null) {
            return true;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (readerSemaphore !== null) {
            return false;
        }
        if (writerLock === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        if (writerLock.owner === lockId) {
            return true;
        }
        if (writerLock.expiration === null) {
            return false;
        }
        return writerLock.expiration <= new Date();
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        const isWriterActive = {
            writer: {
                $ne: null,
            },
            reader: {
                $eq: null,
            },
        };
        const isUnexpirableQuery = {
            "writer.expiration": {
                $eq: null,
            },
        };
        const isUnexpiredQuery = {
            "writer.expiration": {
                $gt: new Date(),
            },
        };
        const sharedLock = await this.collection.findOneAndDelete(
            {
                key,
                "writer.owner": lockId,
                $or: [isWriterActive, isUnexpirableQuery, isUnexpiredQuery],
            },
            {
                projection: {
                    _id: 0,
                    writer: 1,
                    reader: 1,
                },
            },
        );
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (readerSemaphore !== null) {
            return false;
        }
        if (writerLock === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        const { expiration } = writerLock;
        const hasNoExpiration = expiration === null;
        if (hasNoExpiration) {
            return true;
        }

        const { owner: currentOwner } = writerLock;
        const isNotExpired = expiration > new Date();
        const isCurrentOwner = lockId === currentOwner;
        return isNotExpired && isCurrentOwner;
    }

    async forceReleaseWriter(key: string): Promise<boolean> {
        const sharedLock = await this.collection.findOneAndDelete(
            {
                key,
                writer: {
                    $ne: null,
                },
                reader: {
                    $eq: null,
                },
            },
            {
                projection: {
                    _id: 0,
                    reader: 1,
                    writer: 1,
                },
            },
        );
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (readerSemaphore !== null) {
            return false;
        }
        if (writerLock === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        if (writerLock.expiration === null) {
            return true;
        }
        const isNotExpired = writerLock.expiration >= new Date();
        return isNotExpired;
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const isUnexpiredQuery = {
            $and: [
                {
                    $ne: ["$writer", null],
                },
                {
                    $eq: ["$reader", null],
                },
                {
                    $ne: ["$writer.expiration", null],
                },
                {
                    $gt: ["$writer.expiration", new Date()],
                },
            ],
        };

        const sharedLock = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                {
                    $set: {
                        "writer.expiration": {
                            $cond: {
                                if: isUnexpiredQuery,
                                then: ttl.toEndDate(),
                                else: "$writer.expiration",
                            },
                        },
                        expiration: {
                            $cond: {
                                if: isUnexpiredQuery,
                                then: ttl.toEndDate(),
                                else: "$expiration",
                            },
                        },
                    },
                },
                ...this.removeWriterWhenReaderIsActive(),
            ],
            {
                projection: {
                    _id: 0,
                    reader: 1,
                    writer: 1,
                },
            },
        );

        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (readerSemaphore !== null) {
            return false;
        }
        if (writerLock === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        if (writerLock.owner !== lockId) {
            return false;
        }

        if (writerLock.expiration === null) {
            return false;
        }

        if (writerLock.expiration <= new Date()) {
            return false;
        }

        return true;
    }

    private initSemaphoreIfNotExistsStage(
        key: string,
        limit: number,
    ): Document {
        // Initialies the fields if they dont exist when upserting
        return {
            $set: {
                key,
                writer: {
                    $ifNull: ["$writer", null],
                },
                "reader.limit": {
                    $ifNull: ["$reader.limit", limit],
                },
                "reader.slots": {
                    $ifNull: ["$reader.slots", []],
                },
            },
        };
    }

    private removeExpiredSlotsStage(): Document {
        return {
            $set: {
                "reader.slots": {
                    // We filter all slots that are not expired
                    $filter: {
                        input: "$reader.slots",
                        as: "slot",
                        cond: {
                            $or: [
                                // We filter all slots that have no ttl
                                {
                                    $eq: ["$$slot.expiration", null],
                                },
                                // We filter all slots that have ttl but are not expired
                                {
                                    $gt: ["$$slot.expiration", new Date()],
                                },
                            ],
                        },
                    },
                },
            },
        };
    }

    private removeReaderWhenWriterIsActive(): Document {
        return {
            $set: {
                reader: {
                    $cond: {
                        if: {
                            $ne: ["$writer", null],
                        },
                        then: null,
                        else: "$reader",
                    },
                },
                expiration: {
                    $cond: {
                        if: {
                            $ne: ["$writer", null],
                        },
                        then: "$writer.expiration",
                        else: "$expiration",
                    },
                },
            },
        };
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const hasNotReachedLimitQuery = {
            $lt: [
                {
                    $size: "$reader.slots",
                },
                "$reader.limit",
            ],
        };
        const hasAlreadyAcquiredSlotQuery = {
            $not: [
                {
                    $in: [
                        lockId,
                        // We select the ids of each element in the $slots
                        {
                            $map: {
                                input: "$reader.slots",
                                as: "slot",
                                in: "$$slot.id",
                            },
                        },
                    ],
                },
            ],
        };
        const sharedLock = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                this.initSemaphoreIfNotExistsStage(key, limit),
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        "reader.limit": {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: "$reader.slots",
                                        },
                                        0,
                                    ],
                                },
                                then: limit,
                                else: "$reader.limit",
                            },
                        },
                    },
                },
                {
                    $set: {
                        "reader.slots": {
                            $cond: {
                                // We check if the limit is not reached and slot id does not exist
                                if: {
                                    $and: [
                                        hasNotReachedLimitQuery,
                                        hasAlreadyAcquiredSlotQuery,
                                    ],
                                },
                                // If the limit is not reached and slot id does not exist we append the slot
                                then: {
                                    $concatArrays: [
                                        "$reader.slots",
                                        [
                                            {
                                                id: lockId,
                                                expiration:
                                                    ttl?.toEndDate() ?? null,
                                            } satisfies MongodbReaderSemaphoreSlotSubDocument,
                                        ],
                                    ],
                                },
                                // If the limit is reached or slot id does exist we do nonthing
                                else: "$reader.slots",
                            },
                        },
                    },
                },
                ...this.updateSemaphoreExpiration(),
                this.removeReaderWhenWriterIsActive(),
            ],
            {
                upsert: true,
                projection: {
                    _id: 0,
                    writer: 1,
                    reader: 1,
                },
            },
        );
        if (sharedLock === null) {
            return true;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (writerLock !== null) {
            return false;
        }
        if (readerSemaphore === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        // We need to filter out expired slots from semaphoreData to ensure the data is current.
        // The update that handles slot expiration runs after this function.
        const unexpiredSlots = readerSemaphore.slots.filter(
            MongodbSharedLockAdapter.isSlotNotExpired,
        );
        const hasReachedLimit = unexpiredSlots.length >= readerSemaphore.limit;
        if (hasReachedLimit) {
            return false;
        }

        const hasAlreadyAcquiredSlot = unexpiredSlots.some(
            (slot) => slot.id === lockId,
        );
        if (hasAlreadyAcquiredSlot) {
            return true;
        }

        return true;
    }

    async releaseReader(key: string, slotId: string): Promise<boolean> {
        const sharedLock = await this.collection.findOneAndUpdate(
            {
                key,
                writer: {
                    $eq: null,
                },
                reader: {
                    $ne: null,
                },
            },
            [
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        "reader.slots": {
                            $filter: {
                                input: "$reader.slots",
                                as: "slot",
                                cond: {
                                    $ne: ["$$slot.id", slotId],
                                },
                            },
                        },
                    },
                },
                ...this.updateSemaphoreExpiration(),
                this.removeReaderWhenWriterIsActive(),
            ],
            {
                projection: {
                    _id: 0,
                    writer: 1,
                    reader: 1,
                },
            },
        );
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (writerLock !== null) {
            return false;
        }
        if (readerSemaphore === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        const hasSlot = readerSemaphore.slots.some(
            (slot) =>
                slot.id === slotId &&
                MongodbSharedLockAdapter.isSlotNotExpired(slot),
        );
        if (hasSlot) {
            return true;
        }

        return false;
    }

    async forceReleaseAllReaders(key: string): Promise<boolean> {
        const sharedLock = await this.collection.findOneAndDelete(
            {
                key,
                writer: {
                    $eq: null,
                },
                reader: {
                    $ne: null,
                },
            },
            {
                projection: {
                    _id: 0,
                    writer: 1,
                    reader: 1,
                },
            },
        );
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (writerLock !== null) {
            return false;
        }
        if (readerSemaphore === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        const unexpiredSlots = readerSemaphore.slots.filter(
            MongodbSharedLockAdapter.isSlotNotExpired,
        );

        return unexpiredSlots.length > 0;
    }

    async refreshReader(
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const isExpireableQuery = {
            $ne: ["$$slot.expiration", null],
        };
        const isUnexpiredQuery = {
            $gt: ["$$slot.expiration", new Date()],
        };
        const sharedLock = await this.collection.findOneAndUpdate(
            {
                key,
                writer: {
                    $eq: null,
                },
                reader: {
                    $ne: null,
                },
            },
            [
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        "reader.slots": {
                            $map: {
                                input: "$reader.slots",
                                as: "slot",
                                in: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                {
                                                    $eq: ["$$slot.id", slotId],
                                                },
                                                isExpireableQuery,
                                                isUnexpiredQuery,
                                            ],
                                        },
                                        then: {
                                            id: "$$slot.id",
                                            expiration: ttl.toEndDate(),
                                        },
                                        else: "$$slot",
                                    },
                                },
                            },
                        },
                    },
                },
                ...this.updateSemaphoreExpiration(),
                this.removeReaderWhenWriterIsActive(),
            ],
            {
                projection: {
                    _id: 0,
                    reader: 1,
                    writer: 1,
                },
                returnDocument: "after",
            },
        );
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;
        if (writerLock !== null) {
            return false;
        }
        if (readerSemaphore === null) {
            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
            );
        }

        const hasRefreshed = readerSemaphore.slots
            .filter(MongodbSharedLockAdapter.isSlotNotExpired)
            .some((slot) => slot.id === slotId && slot.expiration !== null);
        return hasRefreshed;
    }

    async forceRelease(key: string): Promise<boolean> {
        const sharedLock = await this.collection.findOneAndDelete({
            key,
        });
        if (sharedLock === null) {
            return false;
        }
        const { writer: writerLock, reader: readerSemaphore } = sharedLock;

        if (writerLock !== null && writerLock.expiration === null) {
            return true;
        }

        if (writerLock !== null && writerLock.expiration !== null) {
            const isNotExpired = writerLock.expiration >= new Date();
            return isNotExpired;
        }

        if (readerSemaphore !== null) {
            const unexpiredSlots = readerSemaphore.slots.filter(
                MongodbSharedLockAdapter.isSlotNotExpired,
            );

            return unexpiredSlots.length > 0;
        }

        throw new UnexpectedError(
            "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
        );
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        const sharedLock = await this.collection.findOne(
            { key },
            {
                projection: {
                    _id: 0,
                    reader: 1,
                    writer: 1,
                },
            },
        );
        if (sharedLock === null) {
            return null;
        }

        const { writer, reader } = sharedLock;

        const unexpiredSlots = reader?.slots.filter((slot) => {
            return slot.expiration === null || slot.expiration > new Date();
        });
        if (
            writer === null &&
            reader !== null &&
            unexpiredSlots !== undefined &&
            unexpiredSlots.length === 0
        ) {
            return null;
        }
        if (
            writer === null &&
            reader !== null &&
            unexpiredSlots !== undefined
        ) {
            return {
                writer: null,
                reader: {
                    limit: reader.limit,
                    acquiredSlots: new Map(
                        unexpiredSlots.map(
                            (slot) => [slot.id, slot.expiration] as const,
                        ),
                    ),
                },
            };
        }

        if (reader === null && writer !== null && writer.expiration === null) {
            return {
                reader: null,
                writer: {
                    owner: writer.owner,
                    expiration: writer.expiration,
                },
            };
        }
        if (
            reader === null &&
            writer !== null &&
            writer.expiration !== null &&
            writer.expiration <= new Date()
        ) {
            return null;
        }
        if (writer !== null) {
            return {
                reader: null,
                writer: {
                    owner: writer.owner,
                    expiration: writer.expiration,
                },
            };
        }

        throw new UnexpectedError(
            "Invalid ISharedLockAdapterState, expected either the writer field must be defined, but not both.",
        );
    }
}
