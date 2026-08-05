/**
 * @module SharedLock
 */

import {
    OPTION,
    optionNone,
    optionSome,
    UnexpectedError,
} from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISharedLockFactory,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type { IDeinitizable, Option } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
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
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
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
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedLockData = {
    writerLock: MemorySharedWriterLockData | null;
    readerSemaphore: MemorySharedReaderSemaphoreData | null;
};

/**
 * Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ISharedLockFactory | `ISharedLockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export class MemorySharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable
{
    /**
     *  @example
     * ```ts
     * import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
     *
     * const sharedLockAdapter = new MemorySharedLockAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
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
        _context: IReadableContext,
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

    async releaseWriter(
        key: string,
        lockId: string,
        _context: IReadableContext,
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
        // Check expiration: if expired, cannot release
        if (writerLock.hasExpiration && writerLock.expiration <= new Date()) {
            return Promise.resolve(false);
        }

        if (writerLock.hasExpiration) {
            clearTimeout(writerLock.timeoutId);
        }
        this.map.delete(key);

        return Promise.resolve(true);
    }

    private async _forceReleaseWriter(
        key: string,
        _context: IReadableContext,
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
        // Check expiration: if expired, cannot force release
        if (writerLock.hasExpiration && writerLock.expiration <= new Date()) {
            return Promise.resolve(false);
        }

        if (writerLock.hasExpiration) {
            clearTimeout(writerLock.timeoutId);
        }

        this.map.delete(key);

        return Promise.resolve(true);
    }

    forceReleaseWriter(
        key: string,
        context: IReadableContext,
    ): Promise<boolean> {
        return this._forceReleaseWriter(key, context);
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
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
        // Check expiration: if expired, cannot refresh
        if (writerLock.hasExpiration && writerLock.expiration <= new Date()) {
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

    async releaseReader(
        key: string,
        lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
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
        // Check expiration: if expired, cannot release
        if (slot.expiration !== null && slot.expiration <= new Date()) {
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

    private async _forceReleaseAllReaders(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
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
        for (const [slotId, slot] of readerSemaphore.slots) {
            // Check expiration: if expired, skip force release
            if (slot.expiration !== null && slot.expiration <= new Date()) {
                continue;
            }
            clearTimeout(slot.timeoutId ?? undefined);
            readerSemaphore.slots.delete(slotId);
        }
        this.map.delete(key);
        return Promise.resolve(hasSlots);
    }

    forceReleaseAllReaders(
        key: string,
        context: IReadableContext,
    ): Promise<boolean> {
        return this._forceReleaseAllReaders(key, context);
    }

    async refreshReader(
        key: string,
        lockId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
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
        // Check expiration: if expired, cannot refresh
        if (slot.expiration !== null && slot.expiration <= new Date()) {
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

    async forceRelease(
        key: string,
        context: IReadableContext,
    ): Promise<boolean> {
        const hasReleasedAllReaders = await this._forceReleaseAllReaders(
            key,
            context,
        );
        const hasReleasedWriter = await this._forceReleaseWriter(key, context);
        return hasReleasedAllReaders || hasReleasedWriter;
    }

    private static extractReaderState(
        writerLock: MemorySharedWriterLockData | null,
        readerSemaphore: MemorySharedReaderSemaphoreData | null,
    ): Option<ISharedLockAdapterState | null> {
        if (
            writerLock === null &&
            readerSemaphore !== null &&
            readerSemaphore.slots.size === 0
        ) {
            return optionSome(null);
        }
        if (
            writerLock === null &&
            readerSemaphore !== null &&
            readerSemaphore.slots.size !== 0
        ) {
            return optionSome({
                writer: null,
                reader: {
                    limit: readerSemaphore.limit,
                    acquiredSlots: new Map(
                        [...readerSemaphore.slots.entries()].map(
                            ([key_, value]) =>
                                [key_, value.expiration] as const,
                        ),
                    ),
                },
            });
        }

        return optionNone();
    }

    private static extractWriterState_(
        writerLock: MemorySharedWriterLockData | null,
        readerSemaphore: MemorySharedReaderSemaphoreData | null,
    ): Option<ISharedLockAdapterState | null> {
        if (
            readerSemaphore === null &&
            writerLock !== null &&
            !writerLock.hasExpiration
        ) {
            return optionSome({
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
            writerLock.hasExpiration
        ) {
            return optionSome({
                reader: null,
                writer: {
                    owner: writerLock.owner,
                    expiration: writerLock.expiration,
                },
            });
        }

        return optionNone();
    }

    private static extractActiveWriterState(
        writerLock: MemorySharedWriterLockData | null,
        readerSemaphore: MemorySharedReaderSemaphoreData | null,
    ): Option<ISharedLockAdapterState | null> {
        const activeWriterStateOption =
            MemorySharedLockAdapter.extractWriterState_(
                writerLock,
                readerSemaphore,
            );
        if (activeWriterStateOption.type === OPTION.SOME) {
            return activeWriterStateOption;
        }

        if (
            readerSemaphore === null &&
            writerLock !== null &&
            writerLock.hasExpiration &&
            writerLock.expiration <= new Date()
        ) {
            return optionSome(null);
        }

        return optionNone();
    }

    async getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISharedLockAdapterState | null> {
        const sharedLock = this.map.get(key);

        if (sharedLock === undefined) {
            return Promise.resolve(null);
        }

        const { writerLock, readerSemaphore } = sharedLock;

        const writerState = MemorySharedLockAdapter.extractReaderState(
            writerLock,
            readerSemaphore,
        );
        if (writerState.type === OPTION.SOME) {
            return writerState.value;
        }

        const readerState = MemorySharedLockAdapter.extractActiveWriterState(
            writerLock,
            readerSemaphore,
        );
        if (readerState.type === OPTION.SOME) {
            return readerState.value;
        }

        throw new UnexpectedError(
            "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
        );
    }
}
