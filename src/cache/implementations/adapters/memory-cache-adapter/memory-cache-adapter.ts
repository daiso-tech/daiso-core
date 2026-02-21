/**
 * @module Cache
 */

import {
    type ICacheAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICache,
} from "@/cache/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * This `MemoryCacheAdapter` is used for easily facking {@link ICache | `ICache`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/memory-cache-adapter"`
 * @group Adapters
 */
export class MemoryCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>
{
    private readonly timeoutMap = new Map<
        string,
        NodeJS.Timeout | string | number
    >();

    /**
     * You can provide an optional {@link Map | `Map`}, that will be used for storing the data.
     * @example
     * ```ts
     * import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
     *
     * const map = new Map<any, any>();
     * const cacheAdapter = new MemoryCacheAdapter(map);
     * ```
     */
    constructor(private readonly map: Map<string, unknown> = new Map()) {}

    get(key: string): Promise<TType | null> {
        return Promise.resolve(
            this.map.get(key) ?? null,
        ) as Promise<TType | null>;
    }

    async getAndRemove(key: string): Promise<TType | null> {
        const value = await this.get(key);
        await this.remove(key);
        return value;
    }

    add(key: string, value: TType, ttl: TimeSpan | null): Promise<boolean> {
        const hasNotKey = !this.map.has(key);
        if (hasNotKey) {
            this.map.set(key, value);
        }
        if (hasNotKey && ttl !== null) {
            this.timeoutMap.set(
                key,
                setTimeout(() => {
                    this.map.delete(key);
                    this.timeoutMap.delete(key);
                }, ttl.toMilliseconds()),
            );
        }
        return Promise.resolve(hasNotKey);
    }

    async put(
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const hasKey = await this.remove(key);
        await this.add(key, value, ttl);
        return hasKey;
    }

    update(key: string, value: TType): Promise<boolean> {
        const hasKey = this.map.has(key);
        if (hasKey) {
            this.map.set(key, value);
        }
        return Promise.resolve(hasKey);
    }

    increment(key: string, value: number): Promise<boolean> {
        const prevValue = this.map.get(key);
        const hasKey = prevValue !== undefined;
        if (hasKey) {
            if (typeof prevValue !== "number") {
                throw new TypeError(
                    `Unable to increment or decrement none number type key "${key}"`,
                );
            }
            const newValue = prevValue + value;
            this.map.set(key, newValue as TType);
        }
        return Promise.resolve(hasKey);
    }

    remove(key: string): Promise<boolean> {
        clearTimeout(this.timeoutMap.get(key));
        this.timeoutMap.delete(key);
        return Promise.resolve(this.map.delete(key));
    }

    removeMany(keys: Array<string>): Promise<boolean> {
        let deleteCount = 0;
        for (const key of keys) {
            clearTimeout(this.timeoutMap.get(key));
            this.timeoutMap.delete(key);
            const hasDeleted = this.map.delete(key);
            if (hasDeleted) {
                deleteCount++;
            }
        }
        return Promise.resolve(deleteCount > 0);
    }

    removeAll(): Promise<void> {
        this.map.clear();
        this.timeoutMap.clear();
        return Promise.resolve();
    }

    removeByKeyPrefix(prefix: string): Promise<void> {
        for (const key of this.map.keys()) {
            if (key.startsWith(prefix)) {
                clearTimeout(this.timeoutMap.get(key));
                this.timeoutMap.delete(key);
                this.map.delete(key);
            }
        }
        return Promise.resolve();
    }
}
