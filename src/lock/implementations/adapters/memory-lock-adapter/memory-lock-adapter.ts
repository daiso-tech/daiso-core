/**
 * @module Lock
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ILockFactory,
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module.js";

/**
 * Note the `MemoryLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ILockFactory | `ILockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/lock/memory-lock-adapter"`
 * @group Adapters
 */
export class MemoryLockAdapter
    implements ILockAdapter, IDeinitizable, IPrunable
{
    /**
     *  @example
     * ```ts
     * import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
     *
     * const lockAdapter = new MemoryLockAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
     *
     * const map = new Map<string, any>();
     * const lockAdapter = new MemoryLockAdapter(map);
     * ```
     */
    constructor(private readonly map = new Map<string, ILockAdapterState>()) {}

    private get(key: string): ILockAdapterState | null {
        const lockEntry = this.map.get(key);
        if (lockEntry === undefined) {
            return null;
        }
        if (lockEntry.expiration === null) {
            return lockEntry;
        }
        if (lockEntry.expiration <= new Date()) {
            return null;
        }
        return lockEntry;
    }

    /**
     * Removes all in-memory shared-lock data.
     */
    removeAllExpired(): Promise<void> {
        for (const key of this.map.keys()) {
            if (this.get(key) !== null) {
                continue;
            }

            this.map.delete(key);
        }
        return Promise.resolve();
    }

    /**
     * Removes all in-memory lock data.
     */
    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        const existingEntry = this.get(key);
        if (existingEntry !== null && existingEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.set(key, {
            owner: lockId,
            expiration: ttl ?? null,
        });
        return Promise.resolve(true);
    }

    release(
        key: string,
        lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.get(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    forceRelease(key: string, _context: IReadableContext): Promise<boolean> {
        const lockEntry = this.get(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    refresh(
        key: string,
        lockId: string,
        ttl: Date,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.get(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        if (lockEntry.expiration === null) {
            return Promise.resolve(false);
        }
        lockEntry.expiration = ttl;
        return Promise.resolve(true);
    }

    getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ILockAdapterState | null> {
        const lockEntry = this.get(key);
        if (lockEntry === null) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            owner: lockEntry.owner,
            expiration: lockEntry.expiration,
        });
    }
}
