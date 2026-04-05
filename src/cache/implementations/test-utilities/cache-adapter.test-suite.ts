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
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay as delay_, type Promisable } from "@/utilities/_module.js";

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

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
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
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ICacheAdapter<string | number>;
    beforeEach(async () => {
        adapter = (await createAdapter()) as ICacheAdapter<string | number>;
    });

    async function delay(ttl: ITimeSpan): Promise<void> {
        await delay_(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());
    const TTL = TimeSpan.fromMilliseconds(50);
    describe("ICacheAdapter tests:", () => {
        describe("method: get", () => {
            test("Should return the value when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(1);
            });
            test("Should return null when keys doesnt exists", async () => {
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
            test("Should return null when key is experied", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
        });
        describe("method: getAndRemove", () => {
            test("Should return value when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.getAndRemove(noOpContext, "a")).toBe(1);
            });
            test("Should return null when key doesnt exists", async () => {
                expect(await adapter.getAndRemove(noOpContext, "a")).toBeNull();
            });
            test("Should return null when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.getAndRemove(noOpContext, "a")).toBeNull();
            });
            test("Should persist removal when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                await adapter.getAndRemove(noOpContext, "a");
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
        });
        describe("method: add", () => {
            test("Should return true when key doesnt exists", async () => {
                const result = await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(result).toBe(true);
            });
            test("Should return true when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.add(noOpContext, "a", 1, null)).toBe(true);
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add(noOpContext, "a", -1, TTL);
                await delay(TTL);
                await adapter.add(noOpContext, "a", 1, null);
                expect(await adapter.get(noOpContext, "a")).toBe(1);
            });
            test("Should return false when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.add(noOpContext, "a", 1, null)).toBe(
                    false,
                );
            });
            test("Should not persist value when key exist", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                await adapter.add(noOpContext, "a", 2, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(1);
            });
        });
        describe("method: put", () => {
            test("Should return true when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.put(noOpContext, "a", -1, null)).toBe(
                    true,
                );
            });
            test("Should persist value when key exist", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                await adapter.put(noOpContext, "a", -1, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.put(noOpContext, "a", -1, null)).toBe(
                    false,
                );
            });
            test("Should return false when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.put(noOpContext, "a", -1, null)).toBe(
                    false,
                );
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.put(noOpContext, "a", -1, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(-1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                await adapter.put(noOpContext, "a", -1, null);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(-1);
            });
            test("Should replace the ttl value", async () => {
                const ttlA = TimeSpan.fromMilliseconds(100);
                await adapter.add(noOpContext, "a", 1, ttlA);
                await delay(TTL.divide(4));
                const ttlB = TimeSpan.fromMilliseconds(50);
                await adapter.put(noOpContext, "a", -1, ttlB);
                await delay(ttlB);
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
        });
        describe("method: update", () => {
            test("Should return true when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.update(noOpContext, "a", -1)).toBe(true);
            });
            test("Should persist value when key exist", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                await adapter.update(noOpContext, "a", -1);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.update(noOpContext, "a", -1)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.update(noOpContext, "a", -1)).toBe(false);
            });
            test("Should not persist value when key doesnt exist", async () => {
                await adapter.update(noOpContext, "a", -1);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
            test("Should not persist value when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                await adapter.update(noOpContext, "a", -1);
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
        });
        describe("method: increment", () => {
            test("Should return true when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                expect(await adapter.increment(noOpContext, "a", 1)).toBe(true);
            });
            test("Should persist increment when key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));
                await adapter.increment(noOpContext, "a", 1);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBe(2);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.increment(noOpContext, "a", 1)).toBe(
                    false,
                );
            });
            test("Should return false when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                expect(await adapter.increment(noOpContext, "a", 1)).toBe(
                    false,
                );
            });
            test("Should not persist increment when key doesnt exists", async () => {
                await adapter.increment(noOpContext, "a", 1);
                await delay(TTL.divide(4));
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
            test("Should not persist increment when key is expired", async () => {
                await adapter.add(noOpContext, "a", 1, TTL);
                await delay(TTL);
                await adapter.increment(noOpContext, "a", 1);
                expect(await adapter.get(noOpContext, "a")).toBeNull();
            });
            test("Should throw TypeError when value is not number type", async () => {
                await adapter.add(noOpContext, "a", "str", null);
                await delay(TTL.divide(4));
                await expect(
                    adapter.increment(noOpContext, "a", 1),
                ).rejects.toBeInstanceOf(TypeError);
            });
        });
        describe("method: removeMany", () => {
            test("Should return false when all keys does not exists", async () => {
                const result = await adapter.removeMany(noOpContext, [
                    "a",
                    "b",
                    "c",
                ]);

                expect(result).toBe(false);
            });
            test("Should return true when one key exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await delay(TTL.divide(4));

                const result = await adapter.removeMany(noOpContext, [
                    "a",
                    "b",
                    "c",
                ]);

                expect(result).toBe(true);
            });
            test("Should persist removal of the keys that exists", async () => {
                await adapter.add(noOpContext, "a", 1, null);
                await adapter.add(noOpContext, "b", 2, null);
                await adapter.add(noOpContext, "c", 3, null);
                await delay(TTL.divide(4));

                await adapter.removeMany(noOpContext, ["a", "b"]);
                await delay(TTL.divide(4));

                const result = [
                    await adapter.get(noOpContext, "a"),
                    await adapter.get(noOpContext, "b"),
                    await adapter.get(noOpContext, "c"),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
        describe("method: removeAll", () => {
            test("Should remove all keys", async () => {
                await adapter.add(noOpContext, "cache/a", 1, null);
                await adapter.add(noOpContext, "cache/b", 2, null);
                await adapter.add(noOpContext, "c", 3, null);
                await delay(TTL.divide(4));
                await adapter.removeAll(noOpContext);
                await delay(TTL.divide(4));
                expect([
                    await adapter.get(noOpContext, "cache/a"),
                    await adapter.get(noOpContext, "cache/b"),
                    await adapter.get(noOpContext, "c"),
                ]).toEqual([null, null, null]);
            });
        });
        describe("method: removeByKeyPrefix", () => {
            test(`Should remove all keys that start with prefix "cache"`, async () => {
                await adapter.add(noOpContext, "cache/a", 1, null);
                await adapter.add(noOpContext, "cache/b", 2, null);
                await adapter.add(noOpContext, "c", 3, null);
                await delay(TTL.divide(4));
                await adapter.removeByKeyPrefix(noOpContext, "cache");
                await delay(TTL.divide(4));
                const result = [
                    await adapter.get(noOpContext, "cache/a"),
                    await adapter.get(noOpContext, "cache/b"),
                    await adapter.get(noOpContext, "c"),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
    });
}
