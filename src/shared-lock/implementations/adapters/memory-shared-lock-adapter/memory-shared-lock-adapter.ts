/**
 * @module SharedLock
 */

import {
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { UnexpectedError, type IDeinitizable } from "@/utilities/_module.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedWriterLockData =
    | {
          owner: string;
          hasExpiration: true;
          timeoutId: string | number | NodeJS.Timeout;
          expiration: Date;
      }
    | {
          owner: string;
          hasExpiration: false;
      };

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedReaderSemaphoreData = {
    limit: number;
    slots: Map<
        string,
        {
            timeoutId: string | number | NodeJS.Timeout | null;
            expiration: Date | null;
        }
    >;
};

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedLockData = {
    writerLock: MemorySharedWriterLockData | null;
    readerSemaphore: MemorySharedReaderSemaphoreData | null;
};

/**
 * Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export class MemorySharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable
{
    /**
     *  @example
     * ```ts
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     *
     * const sharedLockAdapter = new MemorySharedLockAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     *
     * const map = new Map<any, any>();
     * const sharedLockAdapter = new MemorySharedLockAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemorySharedLockData>(),
    ) {}

    /**
     * Removes all in-memory shared-lock data.
     */
    async deInit(): Promise<void> {
        for (const [key, sharedLock] of this.map) {
            const writerLock = sharedLock.writerLock;
            if (writerLock !== null && writerLock.hasExpiration) {
                clearTimeout(writerLock.timeoutId);
            }

            const readerSemaphore = sharedLock.readerSemaphore;
            if (readerSemaphore !== null) {
                for (const [_, { timeoutId }] of readerSemaphore.slots) {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }
                }
            }

            this.map.delete(key);
        }
        return Promise.resolve();
    }

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;
        if (readerSemaphore !== null) {
            return Promise.resolve(false);
        }
        let writerLock = sharedLock?.writerLock ?? null;

        if (writerLock !== null) {
            return Promise.resolve(writerLock.owner === lockId);
        }

        if (ttl === null) {
            writerLock = {
                owner: lockId,
                hasExpiration: false,
            };
            this.map.set(key, {
                writerLock,
                readerSemaphore: null,
            });
        } else {
            const timeoutId = setTimeout(() => {
                this.map.delete(key);
            }, ttl.toMilliseconds());
            writerLock = {
                owner: lockId,
                hasExpiration: true,
                timeoutId,
                expiration: ttl.toEndDate(),
            };
            this.map.set(key, {
                writerLock,
                readerSemaphore: null,
            });
        }

        return Promise.resolve(true);
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;
        if (readerSemaphore !== null) {
            return Promise.resolve(false);
        }
        const writerLock = sharedLock?.writerLock ?? null;

        if (writerLock === null) {
            return Promise.resolve(false);
        }
        if (writerLock.owner !== lockId) {
            return Promise.resolve(false);
        }

        if (writerLock.hasExpiration) {
            clearTimeout(writerLock.timeoutId);
        }
        this.map.delete(key);

        return Promise.resolve(true);
    }

    async forceReleaseWriter(key: string): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;
        if (readerSemaphore !== null) {
            return Promise.resolve(false);
        }
        const writerLock = sharedLock?.writerLock ?? null;

        if (writerLock === null) {
            return Promise.resolve(false);
        }

        if (writerLock.hasExpiration) {
            clearTimeout(writerLock.timeoutId);
        }

        this.map.delete(key);

        return Promise.resolve(true);
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;
        if (readerSemaphore !== null) {
            return Promise.resolve(false);
        }
        const writerLock = sharedLock?.writerLock ?? null;

        if (writerLock === null) {
            return Promise.resolve(false);
        }
        if (writerLock.owner !== lockId) {
            return Promise.resolve(false);
        }
        if (!writerLock.hasExpiration) {
            return Promise.resolve(false);
        }

        clearTimeout(writerLock.timeoutId);
        const timeoutId = setTimeout(() => {
            this.map.delete(key);
        }, ttl.toMilliseconds());
        this.map.set(key, {
            readerSemaphore: null,
            writerLock: {
                ...writerLock,
                timeoutId,
            },
        });

        return Promise.resolve(true);
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const sharedLock = this.map.get(key);
        const writerLock = sharedLock?.writerLock ?? null;
        if (writerLock !== null) {
            return Promise.resolve(false);
        }
        let readerSemaphore = sharedLock?.readerSemaphore ?? null;

        if (readerSemaphore === null) {
            readerSemaphore = {
                limit,
                slots: new Map(),
            };
            this.map.set(key, {
                readerSemaphore,
                writerLock: null,
            });
        }

        if (readerSemaphore.slots.size >= readerSemaphore.limit) {
            return Promise.resolve(false);
        }

        if (readerSemaphore.slots.has(lockId)) {
            return Promise.resolve(true);
        }

        if (ttl === null) {
            readerSemaphore.slots.set(lockId, {
                timeoutId: null,
                expiration: null,
            });
        } else {
            const timeoutId = setTimeout(() => {
                readerSemaphore.slots.delete(lockId);
            }, ttl.toMilliseconds());

            readerSemaphore.slots.set(lockId, {
                timeoutId,
                expiration: ttl.toEndDate(),
            });
        }

        this.map.set(key, {
            readerSemaphore,
            writerLock: null,
        });

        return Promise.resolve(true);
    }

    async releaseReader(key: string, lockId: string): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const writerLock = sharedLock?.writerLock ?? null;
        if (writerLock !== null) {
            return Promise.resolve(false);
        }
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;

        if (readerSemaphore === null) {
            return Promise.resolve(false);
        }

        const slot = readerSemaphore.slots.get(lockId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }

        if (slot.timeoutId !== null) {
            clearTimeout(slot.timeoutId);
        }

        readerSemaphore.slots.delete(lockId);
        this.map.set(key, {
            readerSemaphore,
            writerLock: null,
        });

        if (readerSemaphore.slots.size === 0) {
            this.map.delete(key);
        }

        return Promise.resolve(true);
    }

    async forceReleaseAllReaders(key: string): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const writerLock = sharedLock?.writerLock ?? null;
        if (writerLock !== null) {
            return Promise.resolve(false);
        }
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;

        if (readerSemaphore === null) {
            return Promise.resolve(false);
        }
        const hasSlots = readerSemaphore.slots.size > 0;
        for (const [slotId, { timeoutId }] of readerSemaphore.slots) {
            clearTimeout(timeoutId ?? undefined);
            readerSemaphore.slots.delete(slotId);
        }
        this.map.delete(key);
        return Promise.resolve(hasSlots);
    }

    async refreshReader(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const sharedLock = this.map.get(key);
        const writerLock = sharedLock?.writerLock ?? null;
        if (writerLock !== null) {
            return Promise.resolve(false);
        }
        const readerSemaphore = sharedLock?.readerSemaphore ?? null;

        if (!readerSemaphore) {
            return Promise.resolve(false);
        }
        const slot = readerSemaphore.slots.get(lockId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }
        if (slot.timeoutId === null) {
            return Promise.resolve(false);
        }

        clearTimeout(slot.timeoutId);
        const timeoutId = setTimeout(() => {
            readerSemaphore.slots.delete(lockId);
            this.map.set(key, {
                readerSemaphore,
                writerLock: null,
            });
        }, ttl.toMilliseconds());

        readerSemaphore.slots.set(lockId, {
            timeoutId,
            expiration: ttl.toEndDate(),
        });
        this.map.set(key, {
            readerSemaphore,
            writerLock: null,
        });

        return Promise.resolve(true);
    }

    async forceRelease(key: string): Promise<boolean> {
        const [hasReleasedAllReaders, hasReleasedWriter] = await Promise.all([
            this.forceReleaseAllReaders(key),
            this.forceReleaseWriter(key),
        ]);
        return hasReleasedAllReaders || hasReleasedWriter;
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        const sharedLock = this.map.get(key);

        if (sharedLock === undefined) {
            return Promise.resolve(null);
        }

        const { writerLock, readerSemaphore } = sharedLock;

        if (
            writerLock === null &&
            readerSemaphore !== null &&
            readerSemaphore.slots.size === 0
        ) {
            return Promise.resolve(null);
        }
        if (
            writerLock === null &&
            readerSemaphore !== null &&
            readerSemaphore.slots.size !== 0
        ) {
            return Promise.resolve({
                writer: null,
                reader: {
                    limit: readerSemaphore.limit,
                    acquiredSlots: new Map(
                        [...readerSemaphore.slots.entries()].map(
                            ([key, value]) => [key, value.expiration] as const,
                        ),
                    ),
                },
            });
        }

        if (
            readerSemaphore === null &&
            writerLock !== null &&
            !writerLock.hasExpiration
        ) {
            return Promise.resolve({
                reader: null,
                writer: {
                    owner: writerLock.owner,
                    expiration: null,
                },
            });
        }
        if (
            readerSemaphore === null &&
            writerLock !== null &&
            writerLock.hasExpiration &&
            writerLock.expiration <= new Date()
        ) {
            return Promise.resolve(null);
        }
        if (
            readerSemaphore === null &&
            writerLock !== null &&
            writerLock.hasExpiration
        ) {
            return Promise.resolve({
                reader: null,
                writer: {
                    owner: writerLock.owner,
                    expiration: writerLock.expiration,
                },
            });
        }

        throw new UnexpectedError(
            "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
        );
    }
}
