/**
 * @module Semaphore
 */

import {
    type Document,
    type Collection,
    type CollectionOptions,
    type Db,
    type ObjectId,
} from "mongodb";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type IDeinitizable, type IInitizable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-semaphore-adapter"`
 * @group Adapters
 */
export type MongodbSemaphoreSlotSubDocument = {
    id: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-semaphore-adapter"`
 * @group Adapters
 */
export type MongodbSemaphoreDocument = {
    _id: ObjectId;
    key: string;
    limit: number;
    slots: Array<MongodbSemaphoreSlotSubDocument>;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-semaphore-adapter"`
 * @group Adapters
 */
export type MongodbSemaphoreAdapterSettings = {
    database: Db;
    /**
     * @default "semaphore"
     */
    collectionName?: string;
    collectionSettings?: CollectionOptions;
};

/**
 * To utilize the `MongodbSemaphoreAdapter`, you must install the `"mongodb"` package.
 *
 * Note in order to use `MongodbSemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/mongodb-semaphore-adapter"`
 * @group Adapters
 */
export class MongodbSemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IInitizable
{
    private static isSlotNotExpired = (slot: MongodbSemaphoreSlotSubDocument) =>
        slot.expiration === null || slot.expiration > new Date();

    private readonly collection: Collection<MongodbSemaphoreDocument>;

    /**
     * @example
     * ```ts
     * import { MongodbSemaphoreAdapter } from "@daiso-tech/core/semaphore/mongodb-semaphore-adapter";
     * import { MongoClient } from "mongodb";
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const semaphoreAdapter = new MongodbSemaphoreAdapter({
     *   database
     * });
     * // You need initialize the adapter once before using it.
     * await semaphoreAdapter.init()
     * ```
     */
    constructor(settings: MongodbSemaphoreAdapterSettings) {
        const {
            collectionName = "semaphore",
            collectionSettings,
            database,
        } = settings;
        this.collection = database.collection(
            collectionName,
            collectionSettings,
        );
    }

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
     * Removes the collection where the semaphore keys are stored and all it's related indexes.
     * Note all semaphore data will be removed.
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

    private initSemaphoreIfNotExistsStage(
        key: string,
        limit: number,
    ): Document {
        // Initialies the fields if they dont exist when upserting
        return {
            $set: {
                key,
                limit: {
                    $ifNull: ["$limit", limit],
                },
                slots: {
                    $ifNull: ["$slots", []],
                },
            },
        };
    }

    private removeExpiredSlotsStage(): Document {
        return {
            $set: {
                slots: {
                    // We filter all slots that are not expired
                    $filter: {
                        input: "$slots",
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

    private updateSemaphoreExpiration(): Array<Document> {
        const hasUnexpireableSlotQuery = {
            $in: [
                null,
                {
                    $map: {
                        input: "$slots",
                        as: "slot",
                        in: "$$slot.expiration",
                    },
                },
            ],
        };
        const hasNoSlotsQuery = {
            $eq: [{ $size: "$slots" }, 0],
        };
        return [
            {
                $set: {
                    expiration: {
                        $cond: {
                            // Check if there is at least one unexpirable slot
                            if: hasUnexpireableSlotQuery,
                            // If there are at least one unexpirable slot we set the expiration to null
                            then: null,
                            // If all slots are expireable we set the expiration to highest expiration
                            else: {
                                $max: "$slots.expiration",
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    expiration: {
                        $cond: {
                            // Are there slots acquired
                            if: hasNoSlotsQuery,
                            // If there are no slots acquired we immediatley expire the semaphore
                            then: TimeSpan.fromMinutes(1).toStartDate(),
                            // If there are slots acquired we do nothing
                            else: "$expiration",
                        },
                    },
                },
            },
        ];
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const hasNotReachedLimitQuery = {
            $lt: [
                {
                    $size: "$slots",
                },
                "$limit",
            ],
        };
        const hasAlreadyAcquiredSlotQuery = {
            $not: [
                {
                    $in: [
                        slotId,
                        // We select the ids of each element in the $slots
                        {
                            $map: {
                                input: "$slots",
                                as: "slot",
                                in: "$$slot.id",
                            },
                        },
                    ],
                },
            ],
        };
        const semaphoreData = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                this.initSemaphoreIfNotExistsStage(key, limit),
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        limit: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: "$slots",
                                        },
                                        0,
                                    ],
                                },
                                then: limit,
                                else: "$limit",
                            },
                        },
                    },
                },
                {
                    $set: {
                        slots: {
                            $cond: {
                                // We check if the limit is not reached and slotId does not exist
                                if: {
                                    $and: [
                                        hasNotReachedLimitQuery,
                                        hasAlreadyAcquiredSlotQuery,
                                    ],
                                },
                                // If the limit is not reached and slot id does not exist we append the slot
                                then: {
                                    $concatArrays: [
                                        "$slots",
                                        [
                                            {
                                                id: slotId,
                                                expiration:
                                                    ttl?.toEndDate() ?? null,
                                            } satisfies MongodbSemaphoreSlotSubDocument,
                                        ],
                                    ],
                                },
                                // If the limit is reached or slot id does exist we do nonthing
                                else: "$slots",
                            },
                        },
                    },
                },
                ...this.updateSemaphoreExpiration(),
            ],
            {
                upsert: true,
                projection: {
                    _id: 0,
                    limit: 1,
                    slots: 1,
                },
            },
        );
        if (semaphoreData === null) {
            return true;
        }

        // We need to filter out expired slots from semaphoreData to ensure the data is current.
        // The update that handles slot expiration runs after this function.
        const unexpiredSlots = semaphoreData.slots.filter(
            MongodbSemaphoreAdapter.isSlotNotExpired,
        );
        const hasReachedLimit = unexpiredSlots.length >= semaphoreData.limit;
        if (hasReachedLimit) {
            return false;
        }

        const hasAlreadyAcquiredSlot = unexpiredSlots.some(
            (slot) => slot.id === slotId,
        );
        if (hasAlreadyAcquiredSlot) {
            return true;
        }

        return true;
    }

    async release(
        _context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean> {
        const semaphoreData = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        slots: {
                            $filter: {
                                input: "$slots",
                                as: "slot",
                                cond: {
                                    $ne: ["$$slot.id", slotId],
                                },
                            },
                        },
                    },
                },
                ...this.updateSemaphoreExpiration(),
            ],
            {
                projection: {
                    _id: 0,
                    slots: 1,
                },
            },
        );
        if (semaphoreData === null) {
            return false;
        }

        const hasSlot = semaphoreData.slots.some(
            (slot) =>
                slot.id === slotId &&
                MongodbSemaphoreAdapter.isSlotNotExpired(slot),
        );
        if (hasSlot) {
            return true;
        }

        return false;
    }

    async forceReleaseAll(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const semaphoreData = await this.collection.findOneAndDelete(
            {
                key,
            },
            {
                projection: { _id: 0, slots: 1 },
            },
        );
        if (semaphoreData === null) {
            return false;
        }
        const unexpiredSlots = semaphoreData.slots.filter(
            MongodbSemaphoreAdapter.isSlotNotExpired,
        );

        return unexpiredSlots.length > 0;
    }

    async refresh(
        _context: IReadableContext,
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
        const semaphoreData = await this.collection.findOneAndUpdate(
            {
                key,
            },
            [
                this.removeExpiredSlotsStage(),
                {
                    $set: {
                        slots: {
                            $map: {
                                input: "$slots",
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
            ],
            {
                projection: {
                    _id: 0,
                    slots: 1,
                },
                returnDocument: "after",
            },
        );

        if (semaphoreData === null) {
            return false;
        }

        const hasRefreshed = semaphoreData.slots
            .filter(MongodbSemaphoreAdapter.isSlotNotExpired)
            .some((slot) => slot.id === slotId && slot.expiration !== null);
        return hasRefreshed;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ISemaphoreAdapterState | null> {
        const semaphore = await this.collection.findOne(
            { key },
            {
                projection: {
                    _id: 0,
                    slots: 1,
                    limit: 1,
                },
            },
        );
        if (semaphore === null) {
            return null;
        }
        const unexpiredSlots = semaphore.slots.filter((slot) => {
            return slot.expiration === null || slot.expiration > new Date();
        });
        if (unexpiredSlots.length === 0) {
            return null;
        }
        const unexpiredSlotsAsMap = new Map(
            unexpiredSlots.map((slot) => [slot.id, slot.expiration] as const),
        );
        return {
            limit: semaphore.limit,
            acquiredSlots: unexpiredSlotsAsMap,
        };
    }
}
