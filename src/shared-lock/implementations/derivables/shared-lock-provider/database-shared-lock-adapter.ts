/**
 * @module SharedLock
 */

import {
    type IDatabaseSharedLockAdapter,
    type IDatabaseSharedLockTransaction,
    type IReaderSemaphoreAdapterState,
    type IWriterLockAdapterState,
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
export class DatabaseSharedLockAdapter implements ISharedLockAdapter {
    private static async _forceReleaseWriter(
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<boolean> {
        const readerSemaphore = await trx.reader.findSemaphore(key);
        if (readerSemaphore !== null) {
            return false;
        }

        const lockData = await trx.writer.remove(key);
        if (lockData === null) {
            return false;
        }
        if (lockData.expiration === null) {
            return true;
        }
        return lockData.expiration > new Date();
    }

    private static async _forceReleaseAllReaders(
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<boolean> {
        const writerLock = await trx.writer.find(key);
        if (writerLock !== null) {
            return false;
        }

        const semaphoreSlotDataArray = await trx.reader.removeAllSlots(key);
        return semaphoreSlotDataArray.some((semaphoreSlotData) => {
            return (
                semaphoreSlotData.expiration === null ||
                semaphoreSlotData.expiration > new Date()
            );
        });
    }

    private static async getWriterState(
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<IWriterLockAdapterState | null> {
        const lockData = await trx.writer.find(key);
        if (lockData === null) {
            return null;
        }
        if (lockData.expiration === null) {
            return lockData;
        }
        if (lockData.expiration <= new Date()) {
            return null;
        }
        return lockData;
    }

    private static async getReaderState(
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<IReaderSemaphoreAdapterState | null> {
        const semaphore = await trx.reader.findSemaphore(key);
        if (semaphore === null) {
            return null;
        }
        const slots = await trx.reader.findSlots(key);
        const unexpiredSlots = slots.filter(
            (slot) => slot.expiration === null || slot.expiration > new Date(),
        );
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

    constructor(private readonly adapter: IDatabaseSharedLockAdapter) {}

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction<boolean>(async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(key);
            if (readerSemaphore !== null) {
                return false;
            }

            const writerLock = await trx.writer.find(key);
            if (writerLock === null) {
                await trx.writer.upsert(key, lockId, expiration);
                return true;
            }
            if (writerLock.owner === lockId) {
                return true;
            }
            if (writerLock.expiration === null) {
                return false;
            }
            if (writerLock.expiration <= new Date()) {
                await trx.writer.upsert(key, lockId, expiration);
                return true;
            }

            return writerLock.expiration <= new Date();
        });
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(key);
            if (readerSemaphore !== null) {
                return false;
            }

            const lockData = await trx.writer.removeIfOwner(key, lockId);
            if (lockData === null) {
                return false;
            }

            const { expiration } = lockData;
            const hasNoExpiration = expiration === null;
            if (hasNoExpiration) {
                return true;
            }

            const { owner } = lockData;
            const isNotExpired = expiration > new Date();
            const isCurrentOwner = lockId === owner;
            return isNotExpired && isCurrentOwner;
        });
    }

    async forceReleaseWriter(key: string): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            return DatabaseSharedLockAdapter._forceReleaseWriter(trx, key);
        });
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(key);
            if (readerSemaphore !== null) {
                return false;
            }

            const updateCount = await trx.writer.updateExpiration(
                key,
                lockId,
                ttl.toEndDate(),
            );
            return Number(updateCount) > 0;
        });
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const expiration = settings.ttl?.toEndDate() ?? null;
        return await this.adapter.transaction<boolean>(async (trx) => {
            const writerLock = await trx.writer.find(settings.key);
            if (writerLock !== null) {
                return false;
            }

            const semaphoreData = await trx.reader.findSemaphore(settings.key);

            let limit = semaphoreData?.limit;
            if (limit === undefined) {
                limit = settings.limit;
                await trx.reader.upsertSemaphore(settings.key, limit);
            }

            const slots = await trx.reader.findSlots(settings.key);
            const unexpiredSlots = slots.filter(
                (slot) =>
                    slot.expiration === null || slot.expiration > new Date(),
            );

            if (unexpiredSlots.length === 0) {
                await trx.reader.upsertSemaphore(settings.key, settings.limit);
            }

            if (unexpiredSlots.length >= limit) {
                return false;
            }

            const hasNotSlot = unexpiredSlots.every(
                (slot) => slot.id !== settings.lockId,
            );
            if (hasNotSlot) {
                await trx.reader.upsertSlot(
                    settings.key,
                    settings.lockId,
                    expiration,
                );
            }

            return true;
        });
    }

    async releaseReader(key: string, lockId: string): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            const writerLock = await trx.writer.find(key);
            if (writerLock !== null) {
                return false;
            }

            const semaphoreSlotData = await trx.reader.removeSlot(key, lockId);
            if (semaphoreSlotData === null) {
                return false;
            }
            return (
                semaphoreSlotData.expiration === null ||
                semaphoreSlotData.expiration > new Date()
            );
        });
    }

    async forceReleaseAllReaders(key: string): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            return DatabaseSharedLockAdapter._forceReleaseAllReaders(trx, key);
        });
    }

    async refreshReader(
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            const writerLock = await trx.writer.find(key);
            if (writerLock !== null) {
                return false;
            }

            const updateCount = await trx.reader.updateExpiration(
                key,
                slotId,
                ttl.toEndDate(),
            );
            return Number(updateCount) > 0;
        });
    }

    async forceRelease(key: string): Promise<boolean> {
        return await this.adapter.transaction<boolean>(async (trx) => {
            const [hasForceReleasedWriter, hasForceReleasedAllReaders] =
                await Promise.all([
                    await DatabaseSharedLockAdapter._forceReleaseWriter(
                        trx,
                        key,
                    ),
                    await DatabaseSharedLockAdapter._forceReleaseAllReaders(
                        trx,
                        key,
                    ),
                ]);
            return hasForceReleasedWriter || hasForceReleasedAllReaders;
        });
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        return await this.adapter.transaction<ISharedLockAdapterState | null>(
            async (trx) => {
                const [writerState, readerState] = await Promise.all([
                    DatabaseSharedLockAdapter.getWriterState(trx, key),
                    DatabaseSharedLockAdapter.getReaderState(trx, key),
                ]);
                if (writerState === null && readerState === null) {
                    return null;
                }
                return {
                    writer: writerState,
                    reader: readerState,
                };
            },
        );
    }
}
