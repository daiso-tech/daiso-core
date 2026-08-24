/**
 * @module SharedLock
 */

import { UnexpectedError } from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISharedLockFactory,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    SharedLockAcquireSettings,
    IWriterLockAdapterState,
    IReaderSemaphoreAdapterState,
} from "@/shared-lock/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedWriterLockEntryData = {
    owner: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedReaderSemaphoreEntryData = {
    limit: number;
    slots: Map<string, Date | null>;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedLockData = {
    writerLock: MemorySharedWriterLockEntryData | null;
    readerSemaphore: MemorySharedReaderSemaphoreEntryData | null;
};

/**
 * Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ISharedLockFactory | `ISharedLockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export class MemorySharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable, IPrunable
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
     * const map = new Map<string, any>();
     * const sharedLockAdapter = new MemorySharedLockAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemorySharedLockData>(),
    ) {}

    private getWriter(
        key: string,
    ): MemorySharedWriterLockEntryData | "not-found" | "reader-active" {
        const sharedLockEntry = this.map.get(key);
        if (sharedLockEntry === undefined) {
            return "not-found";
        }
        const { writerLock, readerSemaphore } = sharedLockEntry;
        if (readerSemaphore !== null && writerLock !== null) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }
        if (readerSemaphore !== null) {
            return "reader-active";
        }
        if (writerLock === null) {
            return "not-found";
        }
        if (writerLock.expiration === null) {
            return writerLock;
        }
        if (writerLock.expiration <= new Date()) {
            return "not-found";
        }
        return writerLock;
    }

    private static isSlotExpired(expiration: Date | null): boolean {
        return expiration !== null && expiration <= new Date();
    }

    private static removeExpiredSlots(
        sharedLock: MemorySharedReaderSemaphoreEntryData,
    ): void {
        for (const [key, slot] of sharedLock.slots) {
            if (!MemorySharedLockAdapter.isSlotExpired(slot)) {
                continue;
            }
            sharedLock.slots.delete(key);
        }
    }

    private getReader(
        key: string,
    ): MemorySharedReaderSemaphoreEntryData | "not-found" | "writer-active" {
        const sharedLock = this.map.get(key);
        if (sharedLock === undefined) {
            return "not-found";
        }
        const { writerLock, readerSemaphore } = sharedLock;
        if (readerSemaphore !== null && writerLock !== null) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }
        if (writerLock !== null) {
            return "writer-active";
        }
        if (readerSemaphore === null) {
            return "not-found";
        }
        MemorySharedLockAdapter.removeExpiredSlots(readerSemaphore);
        if (readerSemaphore.slots.size === 0) {
            return "not-found";
        }
        return readerSemaphore;
    }

    removeAllExpired(): Promise<void> {
        for (const key of this.map.keys()) {
            if (this.getWriter(key) === "not-found") {
                this.map.delete(key);
            }

            if (this.getReader(key) === "not-found") {
                this.map.delete(key);
            }
        }
        return Promise.resolve();
    }

    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === "reader-active") {
            return Promise.resolve(false);
        }
        if (lockEntry !== "not-found" && lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.set(key, {
            readerSemaphore: null,
            writerLock: {
                owner: lockId,
                expiration: ttl?.toEndDate() ?? null,
            },
        });
        return Promise.resolve(true);
    }

    releaseWriter(
        key: string,
        lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === "not-found" || lockEntry === "reader-active") {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    forceReleaseWriter(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === "not-found" || lockEntry === "reader-active") {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === "not-found" || lockEntry == "reader-active") {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        if (lockEntry.expiration === null) {
            return Promise.resolve(false);
        }
        lockEntry.expiration = ttl.toEndDate();
        return Promise.resolve(true);
    }

    acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        let semaphoreEntry = this.getReader(key);
        if (semaphoreEntry === "writer-active") {
            return Promise.resolve(false);
        }
        if (semaphoreEntry === "not-found") {
            semaphoreEntry = {
                limit,
                slots: new Map(),
            };
            this.map.set(key, {
                writerLock: null,
                readerSemaphore: semaphoreEntry,
            });
        }

        if (semaphoreEntry.slots.size >= semaphoreEntry.limit) {
            return Promise.resolve(false);
        }

        if (semaphoreEntry.slots.has(lockId)) {
            return Promise.resolve(true);
        }

        if (ttl === null) {
            semaphoreEntry.slots.set(lockId, null);
        } else {
            semaphoreEntry.slots.set(lockId, ttl.toEndDate());
        }

        return Promise.resolve(true);
    }

    releaseReader(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const semaphoreEntry = this.getReader(key);
        if (
            semaphoreEntry === "not-found" ||
            semaphoreEntry === "writer-active"
        ) {
            return Promise.resolve(false);
        }

        const slot = semaphoreEntry.slots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }

        semaphoreEntry.slots.delete(slotId);

        if (semaphoreEntry.slots.size === 0) {
            this.map.delete(key);
        }

        return Promise.resolve(true);
    }

    forceReleaseAllReaders(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const semaphoreEntry = this.getReader(key);
        if (
            semaphoreEntry === "not-found" ||
            semaphoreEntry === "writer-active"
        ) {
            return Promise.resolve(false);
        }
        const hasSlots = semaphoreEntry.slots.size > 0;
        this.map.delete(key);
        return Promise.resolve(hasSlots);
    }

    refreshReader(
        key: string,
        slotId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const semaphoreEntry = this.getReader(key);
        if (
            semaphoreEntry === "not-found" ||
            semaphoreEntry === "writer-active"
        ) {
            return Promise.resolve(false);
        }
        const expiratoin = semaphoreEntry.slots.get(slotId);
        if (expiratoin === undefined) {
            return Promise.resolve(false);
        }
        if (expiratoin === null) {
            return Promise.resolve(false);
        }

        semaphoreEntry.slots.set(slotId, ttl.toEndDate());

        return Promise.resolve(true);
    }

    forceRelease(key: string, _context: IReadableContext): Promise<boolean> {
        const reader = this.getReader(key);
        const writer = this.getWriter(key);
        const hasSharedLock =
            typeof reader !== "string" || typeof writer !== "string";
        this.map.delete(key);

        return Promise.resolve(hasSharedLock);
    }

    private getWriterState(key: string): IWriterLockAdapterState | null {
        const lockEntry = this.getWriter(key);
        if (lockEntry === "not-found" || lockEntry === "reader-active") {
            return null;
        }
        return {
            owner: lockEntry.owner,
            expiration: lockEntry.expiration,
        };
    }

    private getReaderState(key: string): IReaderSemaphoreAdapterState | null {
        const semaphoreEntry = this.getReader(key);
        if (
            semaphoreEntry === "not-found" ||
            semaphoreEntry === "writer-active"
        ) {
            return null;
        }
        if (semaphoreEntry.slots.size === 0) {
            return null;
        }
        return {
            limit: semaphoreEntry.limit,
            acquiredSlots: semaphoreEntry.slots,
        };
    }

    getState(key: string): Promise<ISharedLockAdapterState | null> {
        const writerState = this.getWriterState(key);
        const readerState = this.getReaderState(key);
        if (writerState === null && readerState === null) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            writer: writerState,
            reader: readerState,
        });
    }
}
