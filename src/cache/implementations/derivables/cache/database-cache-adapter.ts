/**
 * @module Cache
 */

import {
    type IDatabaseCacheAdapter,
    type ICacheAdapter,
    type ICacheData,
    type ICacheDataExpiration,
} from "@/cache/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
export class DatabaseCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>
{
    constructor(private readonly adapter: IDatabaseCacheAdapter<TType>) {}

    private static handleData<TType>(
        data: ICacheData<TType> | null,
    ): TType | null {
        if (data === null) {
            return null;
        }
        if (data.expiration === null) {
            return data.value;
        }
        if (data.expiration <= new Date()) {
            return null;
        }
        return data.value;
    }

    private static isExpired(
        cacheExpiration: ICacheDataExpiration | null,
    ): boolean {
        if (cacheExpiration === null) {
            return true;
        }
        if (cacheExpiration.expiration === null) {
            return false;
        }
        return cacheExpiration.expiration <= new Date();
    }

    async get(key: string): Promise<TType | null> {
        return DatabaseCacheAdapter.handleData(await this.adapter.find(key));
    }

    async getAndRemove(key: string): Promise<TType | null> {
        const value = await this.get(key);
        if (value !== null) {
            await this.removeMany([key]);
        }
        return value;
    }

    async add(
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction(async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(key),
            );
            if (storedValue !== null) {
                return false;
            }

            await trx.upsert(key, value, expiration);

            return true;
        });
    }

    async put(
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction(async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(key),
            );
            await trx.upsert(key, value, expiration);
            return storedValue !== null;
        });
    }

    async update(key: string, value: TType): Promise<boolean> {
        return !DatabaseCacheAdapter.isExpired(
            await this.adapter.update(key, value),
        );
    }

    async increment(key: string, value: number): Promise<boolean> {
        return await this.adapter.transaction(async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(key),
            );
            if (storedValue === null) {
                return false;
            }

            if (typeof storedValue !== "number") {
                throw new TypeError(
                    `Key value type is invalid must be number but got instead "${typeof storedValue}"`,
                );
            }

            await trx.upsert(key, (storedValue + value) as TType);

            return true;
        });
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        const results = await this.adapter.removeMany(keys);
        for (const result of results) {
            if (!DatabaseCacheAdapter.isExpired(result)) {
                return true;
            }
        }
        return false;
    }

    async removeAll(): Promise<void> {
        await this.adapter.removeAll();
    }

    async removeByKeyPrefix(prefix: string): Promise<void> {
        await this.adapter.removeByKeyPrefix(prefix);
    }
}
