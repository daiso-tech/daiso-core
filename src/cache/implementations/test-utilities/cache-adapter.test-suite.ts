/**
 * @module Cache
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 */
export type CacheAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICacheAdapter>;
};

/**
 * The `cacheAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ICacheAdapter | `ICacheAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { Redis } from "ioredis";
 * import {
 *   RedisContainer,
 *   type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { cacheAdapterTestSuite } from "@daiso-tech/core/cache/test-utilities";
 * import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
 * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { Serde } from "@daiso-tech/core/serde";
 *
 * const timeout = TimeSpan.fromMinutes(2);
 * describe("class: RedisCacheAdapter", () => {
 *     let client: Redis;
 *     let startedContainer: StartedRedisContainer;
 *     beforeEach(async () => {
 *         startedContainer = await new RedisContainer("redis:7.4.2").start();
 *         client = new Redis(startedContainer.getConnectionUrl());
 *     }, timeout.toMilliseconds());
 *     afterEach(async () => {
 *         await client.quit();
 *         await startedContainer.stop();
 *     }, timeout.toMilliseconds());
 *     cacheAdapterTestSuite({
 *         createAdapter: () =>
 *             new RedisCacheAdapter({
 *                 database: client,
 *                 serde: new Serde(new SuperJsonSerdeAdapter()),
 *             }),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function cacheAdapterTestSuite(
    settings: CacheAdapterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: ICacheAdapter<string | number>;
    beforeEach(async () => {
        adapter = (await createAdapter()) as ICacheAdapter<string | number>;
    });

    const TTL = TimeSpan.fromMilliseconds(50);
    describe("ICacheAdapter tests:", () => {
        describe("method: get", () => {
            test("Should return the value when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(1);
            });
            test("Should return null when keys doesnt exists", async () => {
                expect(await adapter.get("a")).toBeNull();
            });
            test("Should return null when key is experied", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.get("a")).toBeNull();
            });
        });
        describe("method: getAndRemove", () => {
            test("Should return value when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.getAndRemove("a")).toBe(1);
            });
            test("Should return null when key doesnt exists", async () => {
                expect(await adapter.getAndRemove("a")).toBeNull();
            });
            test("Should return null when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.getAndRemove("a")).toBeNull();
            });
            test("Should persist removal when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                await adapter.getAndRemove("a");
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBeNull();
            });
        });
        describe("method: add", () => {
            test("Should return true when key doesnt exists", async () => {
                const result = await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(result).toBe(true);
            });
            test("Should return true when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.add("a", 1, null)).toBe(true);
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add("a", -1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                await adapter.add("a", 1, null);
                expect(await adapter.get("a")).toBe(1);
            });
            test("Should return false when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.add("a", 1, null)).toBe(false);
            });
            test("Should not persist value when key exist", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                await adapter.add("a", 2, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(1);
            });
        });
        describe("method: put", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.put("a", -1, null)).toBe(true);
            });
            test("Should persist value when key exist", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                await adapter.put("a", -1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.put("a", -1, null)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.put("a", -1, null)).toBe(false);
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.put("a", -1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(-1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                await adapter.put("a", -1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(-1);
            });
            test("Should replace the ttl value", async () => {
                const ttlA = TimeSpan.fromMilliseconds(100);
                await adapter.add("a", 1, ttlA);
                await Task.delay(TTL.divide(4));
                const ttlB = TimeSpan.fromMilliseconds(50);
                await adapter.put("a", -1, ttlB);
                await Task.delay(ttlB);
                expect(await adapter.get("a")).toBeNull();
            });
        });
        describe("method: update", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.update("a", -1)).toBe(true);
            });
            test("Should persist value when key exist", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                await adapter.update("a", -1);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.update("a", -1)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.update("a", -1)).toBe(false);
            });
            test("Should not persist value when key doesnt exist", async () => {
                await adapter.update("a", -1);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBeNull();
            });
            test("Should not persist value when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                await adapter.update("a", -1);
                expect(await adapter.get("a")).toBeNull();
            });
        });
        describe("method: increment", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                expect(await adapter.increment("a", 1)).toBe(true);
            });
            test("Should persist increment when key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));
                await adapter.increment("a", 1);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBe(2);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.increment("a", 1)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                expect(await adapter.increment("a", 1)).toBe(false);
            });
            test("Should not persist increment when key doesnt exists", async () => {
                await adapter.increment("a", 1);
                await Task.delay(TTL.divide(4));
                expect(await adapter.get("a")).toBeNull();
            });
            test("Should not persist increment when key is expired", async () => {
                await adapter.add("a", 1, TTL);
                await Task.delay(TTL.addTimeSpan(TTL.divide(4)));
                await adapter.increment("a", 1);
                expect(await adapter.get("a")).toBeNull();
            });
            test("Should throw TypeError when value is not number type", async () => {
                await adapter.add("a", "str", null);
                await Task.delay(TTL.divide(4));
                await expect(adapter.increment("a", 1)).rejects.toBeInstanceOf(
                    TypeError,
                );
            });
        });
        describe("method: removeMany", () => {
            test("Should return false when all keys does not exists", async () => {
                const result = await adapter.removeMany(["a", "b", "c"]);

                expect(result).toBe(false);
            });
            test("Should return true when one key exists", async () => {
                await adapter.add("a", 1, null);
                await Task.delay(TTL.divide(4));

                const result = await adapter.removeMany(["a", "b", "c"]);

                expect(result).toBe(true);
            });
            test("Should persist removal of the keys that exists", async () => {
                await adapter.add("a", 1, null);
                await adapter.add("b", 2, null);
                await adapter.add("c", 3, null);
                await Task.delay(TTL.divide(4));

                await adapter.removeMany(["a", "b"]);
                await Task.delay(TTL.divide(4));

                const result = [
                    await adapter.get("a"),
                    await adapter.get("b"),
                    await adapter.get("c"),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
        describe("method: removeAll", () => {
            test("Should remove all keys", async () => {
                await adapter.add("cache/a", 1, null);
                await adapter.add("cache/b", 2, null);
                await adapter.add("c", 3, null);
                await Task.delay(TTL.divide(4));
                await adapter.removeAll();
                await Task.delay(TTL.divide(4));
                expect([
                    await adapter.get("cache/a"),
                    await adapter.get("cache/b"),
                    await adapter.get("c"),
                ]).toEqual([null, null, null]);
            });
        });
        describe("method: removeByKeyPrefix", () => {
            test(`Should remove all keys that start with prefix "cache"`, async () => {
                await adapter.add("cache/a", 1, null);
                await adapter.add("cache/b", 2, null);
                await adapter.add("c", 3, null);
                await Task.delay(TTL.divide(4));
                await adapter.removeByKeyPrefix("cache");
                await Task.delay(TTL.divide(4));
                const result = [
                    await adapter.get("cache/a"),
                    await adapter.get("cache/b"),
                    await adapter.get("c"),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
    });
}
