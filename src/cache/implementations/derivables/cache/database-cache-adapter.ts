/**
 * @module Cache
 */

import {
    type IDatabaseCacheAdapter,
    type ICacheAdapter,
    type ICacheData,
    type ICacheDataExpiration,
} from "@/cache/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
export class DatabaseCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>
{
    constructor(private readonly adapter: IDatabaseCacheAdapter<TType>) {}

    private static handleData<TType_>(
        data: ICacheData<TType_> | null,
    ): TType_ | null {
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

    async get(context: IReadableContext, key: string): Promise<TType | null> {
        return DatabaseCacheAdapter.handleData(
            await this.adapter.find(context, key),
        );
    }

    async getAndRemove(
        context: IReadableContext,
        key: string,
    ): Promise<TType | null> {
        const value = await this.get(context, key);
        if (value !== null) {
            await this.removeMany(context, [key]);
        }
        return value;
    }

    async add(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction(context, async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(context, key),
            );
            if (storedValue !== null) {
                return false;
            }

            await trx.upsert(context, key, value, expiration);

            return true;
        });
    }

    async put(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const expiration = ttl?.toEndDate() ?? null;
        return await this.adapter.transaction(context, async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(context, key),
            );
            await trx.upsert(context, key, value, expiration);
            return storedValue !== null;
        });
    }

    async update(
        context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<boolean> {
        return !DatabaseCacheAdapter.isExpired(
            await this.adapter.update(context, key, value),
        );
    }

    async increment(
        context: IReadableContext,
        key: string,
        value: number,
    ): Promise<boolean> {
        return await this.adapter.transaction(context, async (trx) => {
            const storedValue = DatabaseCacheAdapter.handleData(
                await trx.find(context, key),
            );
            if (storedValue === null) {
                return false;
            }

            if (typeof storedValue !== "number") {
                throw new TypeError(
                    `Key value type is invalid must be number but got instead "${typeof storedValue}"`,
                );
            }

            await trx.upsert(context, key, (storedValue + value) as TType);

            return true;
        });
    }

    async removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean> {
        const results = await this.adapter.removeMany(context, keys);
        for (const result of results) {
            if (!DatabaseCacheAdapter.isExpired(result)) {
                return true;
            }
        }
        return false;
    }

    async removeAll(context: IReadableContext): Promise<void> {
        await this.adapter.removeAll(context);
    }

    async removeByKeyPrefix(
        context: IReadableContext,
        prefix: string,
    ): Promise<void> {
        await this.adapter.removeByKeyPrefix(context, prefix);
    }
}
