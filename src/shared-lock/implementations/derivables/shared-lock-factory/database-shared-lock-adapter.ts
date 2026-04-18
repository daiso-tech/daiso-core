/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
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
        context: IReadableContext,
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<boolean> {
        const readerSemaphore = await trx.reader.findSemaphore(context, key);
        if (readerSemaphore !== null) {
            return false;
        }

        const lockData = await trx.writer.remove(context, key);
        if (lockData === null) {
            return false;
        }
        if (lockData.expiration === null) {
            return true;
        }
        return lockData.expiration > new Date();
    }

    private static async _forceReleaseAllReaders(
        context: IReadableContext,
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<boolean> {
        const writerLock = await trx.writer.find(context, key);
        if (writerLock !== null) {
            return false;
        }

        const semaphoreSlotDataArray = await trx.reader.removeAllSlots(
            context,
            key,
        );
        return semaphoreSlotDataArray.some((semaphoreSlotData) => {
            return (
                semaphoreSlotData.expiration === null ||
                semaphoreSlotData.expiration > new Date()
            );
        });
    }

    private static async getWriterState(
        context: IReadableContext,
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<IWriterLockAdapterState | null> {
        const lockData = await trx.writer.find(context, key);
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
        context: IReadableContext,
        trx: IDatabaseSharedLockTransaction,
        key: string,
    ): Promise<IReaderSemaphoreAdapterState | null> {
        const semaphore = await trx.reader.findSemaphore(context, key);
        if (semaphore === null) {
            return null;
        }
        const slots = await trx.reader.findSlots(context, key);
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
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(
                context,
                key,
            );
            if (readerSemaphore !== null) {
                return false;
            }

            const writerLock = await trx.writer.find(context, key);
            if (writerLock === null) {
                await trx.writer.upsert(context, key, lockId, expiration);
                return true;
            }
            if (writerLock.owner === lockId) {
                return true;
            }
            if (writerLock.expiration === null) {
                return false;
            }
            if (writerLock.expiration <= new Date()) {
                await trx.writer.upsert(context, key, lockId, expiration);
                return true;
            }

            return writerLock.expiration <= new Date();
        });
    }

    async releaseWriter(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(
                context,
                key,
            );
            if (readerSemaphore !== null) {
                return false;
            }

            const lockData = await trx.writer.removeIfOwner(
                context,
                key,
                lockId,
            );
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

    async forceReleaseWriter(
        context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            return DatabaseSharedLockAdapter._forceReleaseWriter(
                context,
                trx,
                key,
            );
        });
    }

    async refreshWriter(
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const readerSemaphore = await trx.reader.findSemaphore(
                context,
                key,
            );
            if (readerSemaphore !== null) {
                return false;
            }

            const updateCount = await trx.writer.updateExpiration(
                context,
                key,
                lockId,
                ttl.toEndDate(),
            );
            return Number(updateCount) > 0;
        });
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const expiration = settings.ttl?.toEndDate() ?? null;
        return await this.adapter.transaction<boolean>(
            settings.context,
            async (trx) => {
                const writerLock = await trx.writer.find(
                    settings.context,
                    settings.key,
                );
                if (writerLock !== null) {
                    return false;
                }

                const semaphoreData = await trx.reader.findSemaphore(
                    settings.context,
                    settings.key,
                );

                let limit = semaphoreData?.limit;
                if (limit === undefined) {
                    limit = settings.limit;
                    await trx.reader.upsertSemaphore(
                        settings.context,
                        settings.key,
                        limit,
                    );
                }

                const slots = await trx.reader.findSlots(
                    settings.context,
                    settings.key,
                );
                const unexpiredSlots = slots.filter(
                    (slot) =>
                        slot.expiration === null ||
                        slot.expiration > new Date(),
                );

                if (unexpiredSlots.length === 0) {
                    await trx.reader.upsertSemaphore(
                        settings.context,
                        settings.key,
                        settings.limit,
                    );
                }

                if (unexpiredSlots.length >= limit) {
                    return false;
                }

                const hasNotSlot = unexpiredSlots.every(
                    (slot) => slot.id !== settings.lockId,
                );
                if (hasNotSlot) {
                    await trx.reader.upsertSlot(
                        settings.context,
                        settings.key,
                        settings.lockId,
                        expiration,
                    );
                }

                return true;
            },
        );
    }

    async releaseReader(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const writerLock = await trx.writer.find(context, key);
            if (writerLock !== null) {
                return false;
            }

            const semaphoreSlotData = await trx.reader.removeSlot(
                context,
                key,
                lockId,
            );
            if (semaphoreSlotData === null) {
                return false;
            }
            return (
                semaphoreSlotData.expiration === null ||
                semaphoreSlotData.expiration > new Date()
            );
        });
    }

    async forceReleaseAllReaders(
        context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            return DatabaseSharedLockAdapter._forceReleaseAllReaders(
                context,
                trx,
                key,
            );
        });
    }

    async refreshReader(
        context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const writerLock = await trx.writer.find(context, key);
            if (writerLock !== null) {
                return false;
            }

            const updateCount = await trx.reader.updateExpiration(
                context,
                key,
                slotId,
                ttl.toEndDate(),
            );
            return Number(updateCount) > 0;
        });
    }

    async forceRelease(
        context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        return await this.adapter.transaction<boolean>(context, async (trx) => {
            const hasForceReleasedWriter =
                await DatabaseSharedLockAdapter._forceReleaseWriter(
                    context,
                    trx,
                    key,
                );
            const hasForceReleasedAllReaders =
                await DatabaseSharedLockAdapter._forceReleaseAllReaders(
                    context,
                    trx,
                    key,
                );
            return hasForceReleasedWriter || hasForceReleasedAllReaders;
        });
    }

    async getState(
        context: IReadableContext,
        key: string,
    ): Promise<ISharedLockAdapterState | null> {
        return await this.adapter.transaction<ISharedLockAdapterState | null>(
            context,
            async (trx) => {
                const writerState =
                    await DatabaseSharedLockAdapter.getWriterState(
                        context,
                        trx,
                        key,
                    );
                const readerState =
                    await DatabaseSharedLockAdapter.getReaderState(
                        context,
                        trx,
                        key,
                    );
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
