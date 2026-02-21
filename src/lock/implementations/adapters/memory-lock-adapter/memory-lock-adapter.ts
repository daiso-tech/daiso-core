/**
 * @module Lock
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ILockProvider,
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type IDeinitizable } from "@/utilities/_module.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/memory-lock-adapter"`
 * @group Adapters
 */
export type MemoryLockData =
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
 * Note the `MemoryLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily facking {@link ILockProvider | `ILockProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/memory-lock-adapter"`
 * @group Adapters
 */
export class MemoryLockAdapter implements ILockAdapter, IDeinitizable {
    /**
     *  @example
     * ```ts
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     *
     * const lockAdapter = new MemoryLockAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     *
     * const map = new Map<any, any>();
     * const lockAdapter = new MemoryLockAdapter(map);
     * ```
     */
    constructor(private readonly map = new Map<string, MemoryLockData>()) {}

    /**
     * Removes all in-memory lock data.
     */
    async deInit(): Promise<void> {
        for (const [key, lockData] of this.map) {
            if (lockData.hasExpiration) {
                clearTimeout(lockData.timeoutId);
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }

    async acquire(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        let lock = this.map.get(key);
        if (lock !== undefined) {
            return Promise.resolve(lock.owner === lockId);
        }

        if (ttl === null) {
            lock = {
                owner: lockId,
                hasExpiration: false,
            };
            this.map.set(key, lock);
        } else {
            const timeoutId = setTimeout(() => {
                this.map.delete(key);
            }, ttl.toMilliseconds());
            lock = {
                owner: lockId,
                hasExpiration: true,
                timeoutId,
                expiration: ttl.toEndDate(),
            };
            this.map.set(key, lock);
        }

        return Promise.resolve(true);
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const lock = this.map.get(key);
        if (lock === undefined) {
            return Promise.resolve(false);
        }
        if (lock.owner !== lockId) {
            return Promise.resolve(false);
        }

        if (lock.hasExpiration) {
            clearTimeout(lock.timeoutId);
        }
        this.map.delete(key);

        return Promise.resolve(true);
    }

    async forceRelease(key: string): Promise<boolean> {
        const lock = this.map.get(key);

        if (lock === undefined) {
            return Promise.resolve(false);
        }

        if (lock.hasExpiration) {
            clearTimeout(lock.timeoutId);
        }

        this.map.delete(key);

        return Promise.resolve(true);
    }

    async refresh(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const lock = this.map.get(key);
        if (lock === undefined) {
            return Promise.resolve(false);
        }
        if (lock.owner !== lockId) {
            return Promise.resolve(false);
        }
        if (!lock.hasExpiration) {
            return Promise.resolve(false);
        }

        clearTimeout(lock.timeoutId);
        const timeoutId = setTimeout(() => {
            this.map.delete(key);
        }, ttl.toMilliseconds());
        this.map.set(key, {
            ...lock,
            timeoutId,
        });

        return Promise.resolve(true);
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const lockData = this.map.get(key);
        if (lockData === undefined) {
            return Promise.resolve(null);
        }
        if (!lockData.hasExpiration) {
            return Promise.resolve({
                owner: lockData.owner,
                expiration: null,
            });
        }
        if (lockData.expiration <= new Date()) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            owner: lockData.owner,
            expiration: lockData.expiration,
        });
    }
}
