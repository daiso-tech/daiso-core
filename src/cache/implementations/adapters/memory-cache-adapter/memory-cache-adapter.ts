/**
 * @module Cache
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ICacheAdapter, ICache } from "@/cache/contracts/_module.js";
import type {
    IDeinitizable,
    InvocableFn,
    IPrunable,
    Promisable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache/memory-cache-adapter"`
 * @group Adapters
 */
export type MemoryCacheEntryData<TValue = unknown> = {
    value: TValue;
    expiration: Date | null;
};

/**
 * The `MemoryCacheAdapter` is used for easily faking{@link ICache | `ICache`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/cache/memory-cache-adapter"`
 * @group Adapters
 */
export class MemoryCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>, IDeinitizable, IPrunable
{
    /**
     * You can provide an optional {@link Map | `Map`}, that will be used for storing the data.
     * @example
     * ```ts
     * import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
     *
     * const map = new Map<string, any>();
     * const cacheAdapter = new MemoryCacheAdapter(map);
     * ```
     */
    constructor(
        private readonly map: Map<
            string,
            MemoryCacheEntryData<TType>
        > = new Map(),
    ) {}

    private internalGet(key: string): MemoryCacheEntryData<TType> | null {
        const cacheEntry = this.map.get(key);
        if (cacheEntry === undefined) {
            return null;
        }
        if (cacheEntry.expiration === null) {
            return cacheEntry;
        }
        if (cacheEntry.expiration <= new Date()) {
            return null;
        }
        return cacheEntry;
    }

    private hasKey(key: string): boolean {
        const cacheEntry = this.internalGet(key);
        return cacheEntry !== null;
    }

    removeAllExpired(): Promise<void> {
        for (const key of this.map.keys()) {
            if (this.hasKey(key)) {
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

    get(key: string): Promise<TType | null> {
        const cacheEntry = this.internalGet(key);
        if (cacheEntry === null) {
            return Promise.resolve(null);
        }
        return Promise.resolve(cacheEntry.value);
    }

    getAndRemove(key: string): Promise<TType | null> {
        const cacheEntry = this.map.get(key);
        this.map.delete(key);
        if (cacheEntry === undefined) {
            return Promise.resolve(null);
        }
        if (cacheEntry.expiration === null) {
            return Promise.resolve(cacheEntry.value);
        }
        if (cacheEntry.expiration <= new Date()) {
            return Promise.resolve(null);
        }
        return Promise.resolve(cacheEntry.value);
    }

    private internalAdd(key: string, value: TType, ttl: Date | null): boolean {
        if (this.hasKey(key)) {
            return false;
        }
        this.map.set(key, {
            value,
            expiration: ttl ?? null,
        });
        return true;
    }

    add(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        return Promise.resolve(this.internalAdd(key, value, ttl));
    }

    async getOrAdd(
        key: string,
        valueToAdd: InvocableFn<[], Promisable<TType>>,
        ttl: Date | null,
    ): Promise<TType> {
        const cacheEntry = this.internalGet(key);
        if (cacheEntry === null) {
            const valueToAddResolved = valueToAdd()
            this.internalAdd(key, await valueToAddResolved, ttl);
            return valueToAddResolved;
        }
        return cacheEntry.value;
    }

    put(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        const hasKey = this.hasKey(key);
        this.map.set(key, {
            value,
            expiration: ttl ?? null,
        });
        return Promise.resolve(hasKey);
    }

    private internalRemove(key: string): boolean {
        const hasKey = this.hasKey(key);
        this.map.delete(key);
        return hasKey;
    }

    update(key: string, value: TType): Promise<boolean> {
        const cacheEntry = this.internalGet(key);
        if (cacheEntry === null) {
            this.internalRemove(key);
            return Promise.resolve(false);
        }
        this.map.set(key, {
            expiration: cacheEntry.expiration,
            value,
        });
        return Promise.resolve(true);
    }

    increment(key: string, value: number): Promise<boolean> {
        const cacheEntry = this.internalGet(key);
        if (cacheEntry === null) {
            this.internalRemove(key);
            return Promise.resolve(false);
        }
        if (typeof cacheEntry.value !== "number") {
            return Promise.reject(
                new TypeError(
                    `Unable to increment or decrement none number type key "${key}"`,
                ),
            );
        }
        const newValue = cacheEntry.value + value;
        this.map.set(key, {
            expiration: cacheEntry.expiration,
            value: newValue as TType,
        });
        return Promise.resolve(true);
    }

    removeMany(keys: Array<string>): Promise<boolean> {
        let hasRemoved = false;
        for (const key of keys) {
            if (this.internalRemove(key)) {
                hasRemoved = true;
            }
        }
        return Promise.resolve(hasRemoved);
    }

    removeByPrefix(prefix: string): Promise<void> {
        if (prefix === "") {
            this.map.clear();
            return Promise.resolve();
        }
        for (const key of this.map.keys()) {
            if (!key.startsWith(prefix)) {
                continue;
            }
            this.internalRemove(key);
        }
        return Promise.resolve();
    }
}
