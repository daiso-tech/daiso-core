/**
 * @module Lock
 */

import {
    type IDatabaseLockAdapter,
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
export class DatabaseLockAdapter implements ILockAdapter {
    constructor(private readonly adapter: IDatabaseLockAdapter) {}

    async acquire(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction<boolean>(async (trx) => {
            const lockData = await trx.find(key);
            if (lockData === null) {
                await trx.upsert(key, lockId, expiration);
                return true;
            }
            if (lockData.owner === lockId) {
                return true;
            }
            if (lockData.expiration === null) {
                return false;
            }
            if (lockData.expiration <= new Date()) {
                await trx.upsert(key, lockId, expiration);
                return true;
            }

            return lockData.expiration <= new Date();
        });
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const lockData = await this.adapter.removeIfOwner(key, lockId);
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
    }

    async forceRelease(key: string): Promise<boolean> {
        const lockData = await this.adapter.remove(key);
        if (lockData === null) {
            return false;
        }
        if (lockData.expiration === null) {
            return true;
        }
        return lockData.expiration > new Date();
    }

    async refresh(
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const updateCount = await this.adapter.updateExpiration(
            key,
            lockId,
            ttl.toEndDate(),
        );
        return Number(updateCount) > 0;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const lockData = await this.adapter.find(key);
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
}
