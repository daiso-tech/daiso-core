/**
 * @module Semaphore
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISemaphoreFactory,
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module.js";

/**
 * Note the `MemorySemaphoreAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ISemaphoreFactory | `ISemaphoreFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export class MemorySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IPrunable
{
    /**
     *  @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
     *
     * const semaphoreAdapter = new MemorySemaphoreAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
     *
     * const map = new Map<string, any>();
     * const semaphoreAdapter = new MemorySemaphoreAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, ISemaphoreAdapterState>(),
    ) {}

    private static isSlotExpired(expiration: Date | null): boolean {
        return expiration !== null && expiration <= new Date();
    }

    private static removeExpiredSlots(semaphore: ISemaphoreAdapterState): void {
        for (const [key, slot] of semaphore.acquiredSlots) {
            if (!MemorySemaphoreAdapter.isSlotExpired(slot)) {
                continue;
            }
            semaphore.acquiredSlots.delete(key);
        }
    }

    private get(key: string): ISemaphoreAdapterState | null {
        const semaphore = this.map.get(key);
        if (semaphore === undefined) {
            return null;
        }
        MemorySemaphoreAdapter.removeExpiredSlots(semaphore);
        if (semaphore.acquiredSlots.size === 0) {
            return null;
        }
        return semaphore;
    }

    /**
     * Removes all in-memory shared-lock data.
     */
    removeAllExpired(): Promise<void> {
        for (const [key] of this.map) {
            const semaphore = this.get(key);
            if (semaphore !== null) {
                continue;
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }

    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        let semaphoreEntry = this.get(key);

        if (semaphoreEntry === null) {
            semaphoreEntry = {
                limit,
                acquiredSlots: new Map(),
            };
            this.map.set(key, semaphoreEntry);
        }

        if (semaphoreEntry.acquiredSlots.size >= semaphoreEntry.limit) {
            return Promise.resolve(false);
        }

        if (semaphoreEntry.acquiredSlots.has(slotId)) {
            return Promise.resolve(true);
        }

        if (ttl === null) {
            semaphoreEntry.acquiredSlots.set(slotId, null);
        } else {
            semaphoreEntry.acquiredSlots.set(slotId, ttl);
        }

        return Promise.resolve(true);
    }

    release(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const semaphoreEntry = this.get(key);
        if (semaphoreEntry === null) {
            return Promise.resolve(false);
        }

        const slot = semaphoreEntry.acquiredSlots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }

        semaphoreEntry.acquiredSlots.delete(slotId);

        if (semaphoreEntry.acquiredSlots.size === 0) {
            this.map.delete(key);
        }

        return Promise.resolve(true);
    }

    forceReleaseAll(key: string, _context: IReadableContext): Promise<boolean> {
        const semaphoreEntry = this.get(key);
        if (semaphoreEntry === null) {
            return Promise.resolve(false);
        }
        const hasSlots = semaphoreEntry.acquiredSlots.size > 0;
        this.map.delete(key);
        return Promise.resolve(hasSlots);
    }

    refresh(
        key: string,
        slotId: string,
        ttl: Date,
        _context: IReadableContext,
    ): Promise<boolean> {
        const semaphoreEntry = this.get(key);
        if (semaphoreEntry === null) {
            return Promise.resolve(false);
        }
        const expiration = semaphoreEntry.acquiredSlots.get(slotId);
        if (expiration === undefined) {
            return Promise.resolve(false);
        }
        if (expiration === null) {
            return Promise.resolve(false);
        }

        semaphoreEntry.acquiredSlots.set(slotId, ttl);

        return Promise.resolve(true);
    }

    getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISemaphoreAdapterState | null> {
        const semaphoreEntry = this.get(key);
        if (semaphoreEntry === null) {
            return Promise.resolve(null);
        }
        if (semaphoreEntry.acquiredSlots.size === 0) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            limit: semaphoreEntry.limit,
            acquiredSlots: semaphoreEntry.acquiredSlots,
        });
    }
}
