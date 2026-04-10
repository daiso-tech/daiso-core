/**
 * @module Cache
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import {
    KeyNotFoundCacheError,
    type ICache,
    type NotFoundCacheEvent,
    type AddedCacheEvent,
    type DecrementedCacheEvent,
    type FoundCacheEvent,
    type IncrementedCacheEvent,
    type RemovedCacheEvent,
    type ClearedCacheEvent,
    type UpdatedCacheEvent,
    CACHE_EVENTS,
    KeyExistsCacheError,
} from "@/cache/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 */
export type CacheTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createCache: () => Promisable<ICache>;
    /**
     * @default false
     */
    excludeEventTests?: boolean;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span"
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    eventDispatchWaitTime?: ITimeSpan;
};

/**
 * The `cacheTestSuite` function simplifies the process of testing your custom implementation of {@link ICache | `ICache`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { beforeEach, describe, expect, test } from "vitest";
 * import { cacheTestSuite } from "@daiso-tech/core/cache/test-utilities";
 * import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
 * import { Cache } from "@daiso-tech/core/cache";
 *
 * describe("class: Cache", () => {
 *     cacheTestSuite({
 *       createCache: () => {
 *           return new Cache({
 *               adapter: new MemoryCacheAdapter(),
 *           });
 *       },
 *       test,
 *       beforeEach,
 *       expect,
 *       describe,
 *   });
 * });
 * ```
 */
export function cacheTestSuite(settings: CacheTestSuiteSettings): void {
    const {
        expect,
        test,
        createCache,
        describe,
        beforeEach,
        excludeEventTests = false,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        eventDispatchWaitTime = TimeSpan.fromMilliseconds(10),
    } = settings;
    let cache: ICache<number>;
    beforeEach(async () => {
        cache = (await createCache()) as ICache<number>;
    });

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    const TTL = TimeSpan.fromMilliseconds(50);
    const LONG_TTL = TimeSpan.fromMinutes(5);

    describe("ICache tests:", () => {
        describe("Api tests:", () => {
            describe("method: exists", () => {
                test("Should return false when key does not exists", async () => {
                    const key = "a";

                    const result = await cache.exists(key);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = await cache.exists(key);

                    expect(result).toBe(false);
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    const result = await cache.exists(key);

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    const result = await cache.exists(key);

                    expect(result).toBe(true);
                });
            });
            describe("method: missing", () => {
                test("Should return true when key does not exists", async () => {
                    const key = "a";

                    const result = await cache.missing(key);

                    expect(result).toBe(true);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = await cache.missing(key);

                    expect(result).toBe(true);
                });
                test("Should return false when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    const result = await cache.missing(key);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    const result = await cache.missing(key);

                    expect(result).toBe(false);
                });
            });
            describe("method: get", () => {
                test("Should return null when key does not exists", async () => {
                    const key = "a";

                    const result = await cache.get(key);

                    expect(result).toBeNull();
                });
                test("Should return null when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = await cache.get(key);

                    expect(result).toBeNull();
                });
                test("Should return value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const result = await cache.get(key);

                    expect(result).toBe(value);
                });
                test("Should return value when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const result = await cache.get(key);

                    expect(result).toBe(value);
                });
            });
            describe("method: getOrFail", () => {
                test("Should throw KeyNotFoundCacheError when key does not exists", async () => {
                    const key = "a";

                    const result = cache.getOrFail(key);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should throw KeyNotFoundCacheError when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = cache.getOrFail(key);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should return value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const result = await cache.getOrFail(key);

                    expect(result).toBe(value);
                });
                test("Should return value when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const result = await cache.getOrFail(key);

                    expect(result).toBe(value);
                });
            });
            describe("method: getOr", () => {
                test("Should return default value when key does not exists", async () => {
                    const key = "a";

                    const defaultValue = -1;
                    const result = await cache.getOr(key, defaultValue);

                    expect(result).toBe(defaultValue);
                });
                test("Should return default value when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const defaultValue = -1;
                    const result = await cache.getOr(key, defaultValue);

                    expect(result).toBe(defaultValue);
                });
                test("Should return value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const defaultValue = -1;
                    const result = await cache.getOr(key, defaultValue);

                    expect(result).toBe(value);
                });
                test("Should return value when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const defaultValue = -1;
                    const result = await cache.getOr(key, defaultValue);

                    expect(result).toBe(value);
                });
            });
            describe("method: getAndRemove", () => {
                test("Should return null when key does not exists", async () => {
                    const key = "a";

                    const result = await cache.getAndRemove(key);

                    expect(result).toBeNull();
                });
                test("Should return null when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = await cache.getAndRemove(key);

                    expect(result).toBeNull();
                });
                test("Should return value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const result = await cache.getAndRemove(key);

                    expect(result).toBe(value);
                });
                test("Should return value when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const result = await cache.getAndRemove(key);

                    expect(result).toBe(value);
                });
                test("Should remove key when exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    await cache.getAndRemove(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should remove key when is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    await cache.getAndRemove(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
            });
            describe("method: getOrAdd", () => {
                test("Should return value to add when key does not exists", async () => {
                    const key = "a";

                    const valueToAdd = -1;
                    const result = await cache.getOrAdd(key, valueToAdd);

                    expect(result).toBe(valueToAdd);
                });
                test("Should persist value when key does not exists", async () => {
                    const key = "a";

                    const valueToAdd = -1;
                    await cache.getOrAdd(key, valueToAdd);

                    const result = await cache.get(key);
                    expect(result).toBe(valueToAdd);
                });
                test("Should return value to add when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const valueToAdd = -1;
                    const result = await cache.getOrAdd(key, valueToAdd);

                    expect(result).toBe(valueToAdd);
                });
                test("Should persist value when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const valueToAdd = -1;
                    await cache.getOrAdd(key, valueToAdd);

                    const result = await cache.get(key);
                    expect(result).toBe(valueToAdd);
                });
                test("Should return value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const valueToAdd = -1;
                    const result = await cache.getOrAdd(key, valueToAdd);

                    expect(result).toBe(value);
                });
                test("Should not persist value when key exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const valueToAdd = -1;
                    await cache.getOrAdd(key, valueToAdd);

                    const result = await cache.get(key);
                    expect(result).toBe(value);
                });
                test("Should return value when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const valueToAdd = -1;
                    const result = await cache.getOrAdd(key, valueToAdd);

                    expect(result).toBe(value);
                });
                test("Should not persist when key is unexpired", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value, { ttl: LONG_TTL });

                    const valueToAdd = -1;
                    await cache.getOrAdd(key, valueToAdd);

                    const result = await cache.get(key);
                    expect(result).toBe(value);
                });
            });
            describe("method: add", () => {
                test("Should return true when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = await cache.add(key, value);

                    expect(result).toBe(true);
                });
                test("Should persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.add(key, value);

                    const result = await cache.get(key);
                    expect(result).toBe(value);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = await cache.add(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    await cache.add(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should return false when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = await cache.add(key, value2);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = await cache.add(key, value2);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.add(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value1);
                });
                test("Should not persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.add(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value1);
                });
            });
            describe("method: addOrFail", () => {
                test("Should not throw error when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = cache.addOrFail(key, value);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.addOrFail(key, value);

                    const result = await cache.get(key);
                    expect(result).toBe(value);
                });
                test("Should not throw error when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.addOrFail(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = cache.addOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.addOrFail(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    await cache.addOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should throw KeyExistsCacheError when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.addOrFail(key, value1);

                    const value2 = 2;
                    const result = cache.addOrFail(key, value2);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsCacheError,
                    );
                });
                test("Should throw KeyExistsCacheError when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.addOrFail(key, value1, {
                        ttl: LONG_TTL,
                    });

                    const value2 = 2;
                    const result = cache.addOrFail(key, value2);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsCacheError,
                    );
                });
                test("Should not persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.addOrFail(key, value1);

                    const value2 = 2;
                    try {
                        await cache.addOrFail(key, value2);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBe(value1);
                });
                test("Should not persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.addOrFail(key, value1, {
                        ttl: LONG_TTL,
                    });

                    const value2 = 2;
                    try {
                        await cache.addOrFail(key, value2);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBe(value1);
                });
            });
            describe("method: put", () => {
                test("Should return true when key exists", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = await cache.put(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.put(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should persist ttl when key exists", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.put(key, value2, { ttl: TTL });

                    await delayWithBuffer(TTL);
                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = await cache.put(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.put(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should persist ttl when key is unexpired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.put(key, value2, { ttl: TTL });

                    await delayWithBuffer(TTL);
                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return false when key does not exist", async () => {
                    const key = "a";
                    const value = 1;

                    const result = await cache.put(key, value);

                    expect(result).toBe(false);
                });
                test("Should persist value when key does not exist", async () => {
                    const key = "a";

                    const value = 2;
                    await cache.put(key, value);

                    const result = await cache.get(key);
                    expect(result).toBe(value);
                });
                test("Should persist ttl when key does not exist", async () => {
                    const key = "a";

                    const value = 2;
                    await cache.put(key, value, { ttl: TTL });

                    await delayWithBuffer(TTL);
                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
            });
            describe("method: update", () => {
                test("Should return false when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = await cache.update(key, value);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.update(key, value);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = await cache.update(key, value2);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    await cache.update(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = await cache.update(key, value2);

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = await cache.update(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.update(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.update(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
            });
            describe("method: updateOrFail", () => {
                test("Should throw KeyNotFoundCacheError when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = cache.updateOrFail(key, value);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    try {
                        await cache.updateOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should throw KeyNotFoundCacheError when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = cache.updateOrFail(key, value2);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    try {
                        await cache.updateOrFail(key, value2);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should not throw error when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = cache.updateOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = cache.updateOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.updateOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.updateOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(value2);
                });
            });
            describe("method: increment", () => {
                test("Should return false when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = await cache.increment(key, value);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.increment(key, value);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = await cache.increment(key, value2);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    await cache.increment(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = await cache.increment(key, value2);

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = await cache.increment(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.increment(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(3);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.increment(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(3);
                });
            });
            describe("method: incrementOrFail", () => {
                test("Should throw KeyNotFoundCacheError when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = cache.incrementOrFail(key, value);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    try {
                        await cache.incrementOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should throw KeyNotFoundCacheError when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = cache.incrementOrFail(key, value2);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    try {
                        await cache.incrementOrFail(key, value2);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should not throw error when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = cache.incrementOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = cache.incrementOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.incrementOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(3);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.incrementOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(3);
                });
            });
            describe("method: decrement", () => {
                test("Should return false when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = await cache.decrement(key, value);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    await cache.decrement(key, value);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = await cache.decrement(key, value2);

                    expect(result).toBe(false);
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    await cache.decrement(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = await cache.decrement(key, value2);

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = await cache.decrement(key, value2);

                    expect(result).toBe(true);
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.decrement(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(-1);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.decrement(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(-1);
                });
            });
            describe("method: decrementOrFail", () => {
                test("Should throw KeyNotFoundCacheError when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    const result = cache.decrementOrFail(key, value);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key does not exists", async () => {
                    const key = "a";

                    const value = 1;
                    try {
                        await cache.decrementOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should throw KeyNotFoundCacheError when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    const result = cache.decrementOrFail(key, value2);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not persist value when key is expired", async () => {
                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const value2 = 2;
                    try {
                        await cache.decrementOrFail(key, value2);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should not throw error when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    const result = cache.decrementOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    const result = cache.decrementOrFail(key, value2);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist value when key exists", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1);

                    const value2 = 2;
                    await cache.decrementOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(-1);
                });
                test("Should persist value when key is unexpired", async () => {
                    const key = "a";

                    const value1 = 1;
                    await cache.add(key, value1, { ttl: LONG_TTL });

                    const value2 = 2;
                    await cache.decrementOrFail(key, value2);

                    const result = await cache.get(key);
                    expect(result).toBe(-1);
                });
            });
            describe("method: remove", () => {
                test("Should return false when key does not exists", async () => {
                    const key = "a";

                    const result = await cache.remove(key);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = await cache.remove(key);

                    expect(result).toBe(false);
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    const result = await cache.remove(key);

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    const result = await cache.remove(key);

                    expect(result).toBe(true);
                });
                test("Should persist removal when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    await cache.remove(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should persist removal when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    await cache.remove(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
            });
            describe("method: removeOrFail", () => {
                test("Should throw KeyNotFoundCacheError when key does not exists", async () => {
                    const key = "a";

                    const result = cache.removeOrFail(key);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should throw KeyNotFoundCacheError when key is expired", async () => {
                    const key = "a";
                    await cache.add(key, 1, {
                        ttl: TTL,
                    });
                    await delayWithBuffer(TTL);

                    const result = cache.removeOrFail(key);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundCacheError,
                    );
                });
                test("Should not throw error when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    const result = cache.removeOrFail(key);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    const result = cache.removeOrFail(key);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist removal when key exists", async () => {
                    const key = "a";

                    await cache.add(key, 1);

                    await cache.removeOrFail(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
                test("Should persist removal when key is unexpired", async () => {
                    const key = "a";

                    await cache.add(key, 1, { ttl: LONG_TTL });

                    await cache.removeOrFail(key);

                    const result = await cache.get(key);
                    expect(result).toBeNull();
                });
            });
            describe("method: removeMany", () => {
                test("Should return false when all keys dont exists", async () => {
                    const keyA = "a";
                    const keyB = "b";
                    const keyC = "c";
                    await cache.add(keyA, 1, { ttl: TTL });
                    await delayWithBuffer(TTL);

                    const result = await cache.removeMany([keyA, keyB, keyC]);

                    expect(result).toBe(false);
                });
                test("Should return true when one key exists", async () => {
                    const keyA = "a";
                    const keyB = "b";
                    const keyC = "c";
                    await cache.add(keyA, 1, { ttl: TTL });
                    await delayWithBuffer(TTL);

                    await cache.add(keyC, 2);
                    const result = await cache.removeMany([keyA, keyB, keyC]);

                    expect(result).toBe(true);
                });
                test("Should persist removal when one key exists", async () => {
                    const keyA = "a";
                    const keyB = "b";
                    const keyC = "c";
                    await cache.add(keyA, 1, { ttl: TTL });
                    await delayWithBuffer(TTL);

                    await cache.add(keyC, 2);
                    await cache.removeMany([keyA, keyB, keyC]);

                    const resultA = await cache.get(keyA);
                    expect(resultA).toBeNull();
                    const resultB = await cache.get(keyB);
                    expect(resultB).toBeNull();
                    const resultC = await cache.get(keyC);
                    expect(resultC).toBeNull();
                });
            });
        });
        describe.skipIf(excludeEventTests)("Event tests:", () => {
            describe("method: exists", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.exists(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.exists(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: missing", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.missing(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.missing(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: get", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.get(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.get(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: getOr", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.getOr(key, -1);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.getOr(key, -1);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: getOrFail", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    try {
                        await cache.getOrFail(key);
                    } catch {
                        /* EMPTY */
                    }
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.getOrFail(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: add", () => {
                test("Should dispatch AddedCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: AddedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.ADDED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value, { ttl: TTL });
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                                ttl: expect.any(TimeSpan) as TimeSpan,
                            } satisfies AddedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);

                            const ttl_ = handlerFn.mock.calls[0]?.[0].ttl;
                            expect(ttl_?.toMilliseconds()).toBe(
                                TTL.toMilliseconds(),
                            );
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: update", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.update(key, value);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch UpdatedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: UpdatedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.UPDATED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.update(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies UpdatedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: updateOrFail", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    try {
                        await cache.updateOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch UpdatedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: UpdatedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.UPDATED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.updateOrFail(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies UpdatedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: put", () => {
                test("Should dispatch AddedCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: AddedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.ADDED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.put(key, value, { ttl: TTL });
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                                ttl: expect.any(TimeSpan) as TimeSpan,
                            } satisfies AddedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);

                            const ttl = handlerFn.mock.calls[0]?.[0].ttl;
                            expect(ttl?.toMilliseconds()).toBe(
                                ttl?.toMilliseconds(),
                            );
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch UpdatedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: UpdatedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.UPDATED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.put(key, value, { ttl: TTL });
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies UpdatedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: remove", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.remove(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );

                    const keyObj = handlerFn.mock.calls[0]?.[0].key;
                    expect(keyObj?.get()).toBe(key);
                });
                test("Should dispatch RemovedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: RemovedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.REMOVED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.remove(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies RemovedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: removeOrFail", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    try {
                        await cache.removeOrFail(key);
                    } catch {
                        /* EMPTY */
                    }
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch RemovedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: RemovedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.REMOVED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.removeOrFail(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies RemovedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: removeMany", () => {
                test("Should dispatch RemovedCacheEvent when one key exists", async () => {
                    const handlerFn = vi.fn((_event: RemovedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.REMOVED,
                        handlerFn,
                    );

                    const key1 = "a";
                    const key2 = "b";
                    const value = 1;
                    await cache.add(key1, value);

                    await cache.removeMany([key1, key2]);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledTimes(2);
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies RemovedCacheEvent);

                            const keyObj1 = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj1?.get()).toBe("a");

                            const keyObj2 = handlerFn.mock.calls[1]?.[0].key;
                            expect(keyObj2?.get()).toBe("b");
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch NotFoundCacheEvent when all keys doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key1 = "a";
                    const key2 = "b";
                    await cache.removeMany([key1, key2]);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledTimes(2);
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj1 = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj1?.get()).toBe("a");

                            const keyObj2 = handlerFn.mock.calls[1]?.[0].key;
                            expect(keyObj2?.get()).toBe("b");
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: getAndRemove", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    await cache.getAndRemove(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should not dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.getAndRemove(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).not.toHaveBeenCalled();
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch RemovedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: RemovedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.REMOVED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.getAndRemove(key);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies RemovedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: getOrAdd", () => {
                test("Should not dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.getOrAdd(key, value);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).not.toHaveBeenCalled();
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch FoundCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: FoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.add(key, value);
                    await cache.getOrAdd(key, value);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                            } satisfies FoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch AddedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn((_event: AddedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.ADDED,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.getOrAdd(key, value, { ttl: TTL });
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value,
                                ttl: expect.any(TimeSpan) as TimeSpan,
                            } satisfies AddedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);

                            const ttl = handlerFn.mock.calls[0]?.[0].ttl;
                            expect(ttl?.toMilliseconds()).toBe(
                                TTL.toMilliseconds(),
                            );
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: increment", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.increment(key, value);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch IncrementedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn(
                        (_event: IncrementedCacheEvent) => {},
                    );
                    await cache.events.addListener(
                        CACHE_EVENTS.INCREMENTED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.increment(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies IncrementedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: incrementOrFail", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    try {
                        await cache.incrementOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch IncrementedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn(
                        (_event: IncrementedCacheEvent) => {},
                    );
                    await cache.events.addListener(
                        CACHE_EVENTS.INCREMENTED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.incrementOrFail(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies IncrementedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: decrement", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    await cache.decrement(key, value);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch DecrementedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn(
                        (_event: DecrementedCacheEvent) => {},
                    );
                    await cache.events.addListener(
                        CACHE_EVENTS.DECREMENTED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.decrement(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies DecrementedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: decrementOrFail", () => {
                test("Should dispatch NotFoundCacheEvent when key doesnt exists", async () => {
                    const handlerFn = vi.fn((_event: NotFoundCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.NOT_FOUND,
                        handlerFn,
                    );

                    const key = "a";
                    const value = 1;
                    try {
                        await cache.decrementOrFail(key, value);
                    } catch {
                        /* EMPTY */
                    }
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            } satisfies NotFoundCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
                test("Should dispatch DecrementedCacheEvent when key exists", async () => {
                    const handlerFn = vi.fn(
                        (_event: DecrementedCacheEvent) => {},
                    );
                    await cache.events.addListener(
                        CACHE_EVENTS.DECREMENTED,
                        handlerFn,
                    );

                    const key = "a";
                    const value1 = 1;
                    await cache.add(key, value1);
                    const value2 = 2;
                    await cache.decrementOrFail(key, value2);
                    await vi.waitFor(
                        () => {
                            expect(handlerFn).toHaveBeenCalledOnce();
                            expect(handlerFn).toHaveBeenCalledWith({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                                value: value2,
                            } satisfies DecrementedCacheEvent);

                            const keyObj = handlerFn.mock.calls[0]?.[0].key;
                            expect(keyObj?.get()).toBe(key);
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
            describe("method: clear", () => {
                test("Should dispatch ClearedCacheEvent when clear method is called", async () => {
                    const handler = vi.fn((_event: ClearedCacheEvent) => {});
                    await cache.events.addListener(
                        CACHE_EVENTS.CLEARED,
                        handler,
                    );

                    await cache.add("a", 1);
                    await cache.add("b", 2);
                    await cache.add("c", 3);
                    await cache.clear();
                    await vi.waitFor(
                        () => {
                            expect(handler).toHaveBeenCalledOnce();
                            expect(handler).toHaveBeenCalledWith({});
                        },
                        {
                            interval: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            ).toMilliseconds(),
                            timeout: TimeSpan.fromTimeSpan(
                                eventDispatchWaitTime,
                            )
                                .multiply(3)
                                .toMilliseconds(),
                        },
                    );
                });
            });
        });
    });
}
