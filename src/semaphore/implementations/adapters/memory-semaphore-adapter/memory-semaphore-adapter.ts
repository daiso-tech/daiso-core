/**
 * @module Semaphore
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ISemaphoreProvider,
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type IDeinitizable } from "@/utilities/_module.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export type MemorySemaphoreAdapterData = {
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
 * Note the `MemorySemaphoreAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily facking {@link ISemaphoreProvider | `ISemaphoreProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export class MemorySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable
{
    /**
     *  @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     *
     * const semaphoreAdapter = new MemorySemaphoreAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     *
     * const map = new Map<any, any>();
     * const semaphoreAdapter = new MemorySemaphoreAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemorySemaphoreAdapterData>(),
    ) {}

    /**
     * Removes all in-memory semaphore data.
     */
    async deInit(): Promise<void> {
        for (const [key, semaphoreData] of this.map) {
            for (const [slotId, slotData] of semaphoreData.slots) {
                if (slotData.timeoutId !== null) {
                    clearTimeout(slotData.timeoutId);
                }
                semaphoreData.slots.delete(slotId);
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        let semaphore = this.map.get(key);

        if (semaphore === undefined) {
            semaphore = {
                limit,
                slots: new Map(),
            };
            this.map.set(key, semaphore);
        }

        if (semaphore.slots.size >= semaphore.limit) {
            return Promise.resolve(false);
        }

        if (semaphore.slots.has(slotId)) {
            return Promise.resolve(true);
        }

        if (ttl === null) {
            semaphore.slots.set(slotId, {
                timeoutId: null,
                expiration: null,
            });
        } else {
            const timeoutId = setTimeout(() => {
                semaphore.slots.delete(slotId);
            }, ttl.toMilliseconds());

            semaphore.slots.set(slotId, {
                timeoutId,
                expiration: ttl.toEndDate(),
            });
        }

        this.map.set(key, semaphore);

        return Promise.resolve(true);
    }
    async release(key: string, slotId: string): Promise<boolean> {
        const semaphore = this.map.get(key);
        if (!semaphore) {
            return Promise.resolve(false);
        }

        const slot = semaphore.slots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }

        if (slot.timeoutId !== null) {
            clearTimeout(slot.timeoutId);
        }

        semaphore.slots.delete(slotId);
        this.map.set(key, semaphore);

        if (semaphore.slots.size === 0) {
            this.map.delete(key);
        }

        return Promise.resolve(true);
    }
    async forceReleaseAll(key: string): Promise<boolean> {
        const semaphore = this.map.get(key);
        if (semaphore === undefined) {
            return Promise.resolve(false);
        }
        const hasSlots = semaphore.slots.size > 0;
        for (const [slotId, { timeoutId }] of semaphore.slots) {
            clearTimeout(timeoutId ?? undefined);
            semaphore.slots.delete(slotId);
        }
        this.map.delete(key);
        return Promise.resolve(hasSlots);
    }

    async refresh(
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const semaphore = this.map.get(key);
        if (!semaphore) {
            return Promise.resolve(false);
        }
        const slot = semaphore.slots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }
        if (slot.timeoutId === null) {
            return Promise.resolve(false);
        }

        clearTimeout(slot.timeoutId);
        const timeoutId = setTimeout(() => {
            semaphore.slots.delete(slotId);
            this.map.set(key, semaphore);
        }, ttl.toMilliseconds());

        semaphore.slots.set(slotId, {
            timeoutId,
            expiration: ttl.toEndDate(),
        });
        this.map.set(key, semaphore);

        return Promise.resolve(true);
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        const semaphore = this.map.get(key);
        if (semaphore === undefined) {
            return Promise.resolve(null);
        }
        if (semaphore.slots.size === 0) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            limit: semaphore.limit,
            acquiredSlots: new Map(
                [...semaphore.slots.entries()].map(
                    ([key, value]) => [key, value.expiration] as const,
                ),
            ),
        });
    }
}
