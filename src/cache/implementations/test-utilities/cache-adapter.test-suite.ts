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
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache/test-utilities"`
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
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "eridu-tech/execution-context"
     * import { NoOpExecutionContextAdapter } from "eridu-tech/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `cacheAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ICacheAdapter | `ICacheAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/cache/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { Redis } from "ioredis";
 * import {
 *   RedisContainer,
 *   type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { cacheAdapterTestSuite } from "eridu-tech/cache/test-utilities";
 * import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
 * import { TimeSpan } from "eridu-tech/time-span";
 * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
 * import { Serde } from "eridu-tech/serde";
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
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: ICacheAdapter<string | number>;
    beforeEach_(async () => {
        adapter = (await createAdapter()) as ICacheAdapter<string | number>;
    });

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    const TTL = TimeSpan.fromMilliseconds(50);
    describe("ICacheAdapter tests:", () => {
        describe("method: get", () => {
            test("Should return the value when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(1);
            });
            test("Should return null when keys doesnt exists", async () => {
                expect(await adapter.get("a", context)).toBeNull();
            });
            test("Should return null when key is experied", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.get("a", context)).toBeNull();
            });
        });
        describe("method: getAndRemove", () => {
            test("Should return value when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.getAndRemove("a", context)).toBe(1);
            });
            test("Should return null when key doesnt exists", async () => {
                expect(await adapter.getAndRemove("a", context)).toBeNull();
            });
            test("Should return null when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.getAndRemove("a", context)).toBeNull();
            });
            test("Should persist removal when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.getAndRemove("a", context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBeNull();
            });
        });
        describe("method: getOrAdd", () => {
            test("Should return value to add when key does not exists", async () => {
                const key = "a";

                const valueToAdd = -1;
                const result = await adapter.getOrAdd(
                    key,
                    valueToAdd,
                    null,
                    context,
                );

                expect(result).toBe(valueToAdd);
            });
            test("Should persist value when key does not exists", async () => {
                const key = "a";

                const valueToAdd = -1;
                await adapter.getOrAdd(key, valueToAdd, null, context);

                const result = await adapter.get(key, context);
                expect(result).toBe(valueToAdd);
            });
            test("Should return value to add when key is expired", async () => {
                const key = "a";
                await adapter.add(key, 1, TTL, context);
                await delayWithBuffer(TTL);

                const valueToAdd = -1;
                const result = await adapter.getOrAdd(
                    key,
                    valueToAdd,
                    null,
                    context,
                );

                expect(result).toBe(valueToAdd);
            });
            test("Should persist value when key is expired", async () => {
                const key = "a";
                await adapter.add(key, 1, TTL, context);
                await delayWithBuffer(TTL);

                const valueToAdd = -1;
                await adapter.getOrAdd(key, valueToAdd, null, context);

                const result = await adapter.get(key, context);
                expect(result).toBe(valueToAdd);
            });
            test("Should return value when key exists", async () => {
                const key = "a";

                const value = 1;
                await adapter.add(key, value, null, context);

                const valueToAdd = -1;
                const result = await adapter.getOrAdd(
                    key,
                    valueToAdd,
                    null,
                    context,
                );

                expect(result).toBe(value);
            });
            test("Should not persist value when key exists", async () => {
                const key = "a";

                const value = 1;
                await adapter.add(key, value, null, context);

                const valueToAdd = -1;
                await adapter.getOrAdd(key, valueToAdd, null, context);

                const result = await adapter.get(key, context);
                expect(result).toBe(value);
            });
            test("Should return value when key is unexpired", async () => {
                const key = "a";
                const longTtl = TimeSpan.fromMinutes(5);

                const value = 1;
                await adapter.add(key, value, longTtl, context);

                const valueToAdd = -1;
                const result = await adapter.getOrAdd(
                    key,
                    valueToAdd,
                    null,
                    context,
                );

                expect(result).toBe(value);
            });
            test("Should not persist when key is unexpired", async () => {
                const key = "a";
                const longTtl = TimeSpan.fromMinutes(5);

                const value = 1;
                await adapter.add(key, value, longTtl, context);

                const valueToAdd = -1;
                await adapter.getOrAdd(key, valueToAdd, null, context);

                const result = await adapter.get(key, context);
                expect(result).toBe(value);
            });
        });
        describe("method: add", () => {
            test("Should return true when key doesnt exists", async () => {
                const result = await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(result).toBe(true);
            });
            test("Should return true when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.add("a", 1, null, context)).toBe(true);
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add("a", -1, TTL, context);
                await delayWithBuffer(TTL);
                await adapter.add("a", 1, null, context);
                expect(await adapter.get("a", context)).toBe(1);
            });
            test("Should return false when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.add("a", 1, null, context)).toBe(false);
            });
            test("Should not persist value when key exist", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.add("a", 2, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(1);
            });
        });
        describe("method: put", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.put("a", -1, null, context)).toBe(true);
            });
            test("Should persist value when key exist", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.put("a", -1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.put("a", -1, null, context)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.put("a", -1, null, context)).toBe(false);
            });
            test("Should persist values when key doesnt exist", async () => {
                await adapter.put("a", -1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(-1);
            });
            test("Should persist values when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                await adapter.put("a", -1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(-1);
            });
            test("Should replace the ttl value", async () => {
                const ttlA = TimeSpan.fromMilliseconds(100);
                await adapter.add("a", 1, ttlA, context);
                await delayWithBuffer(TTL.divide(4));
                const ttlB = TimeSpan.fromMilliseconds(50);
                await adapter.put("a", -1, ttlB, context);
                await delayWithBuffer(ttlB);
                expect(await adapter.get("a", context)).toBeNull();
            });
        });
        describe("method: update", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.update("a", -1, context)).toBe(true);
            });
            test("Should persist value when key exist", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.update("a", -1, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(-1);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.update("a", -1, context)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.update("a", -1, context)).toBe(false);
            });
            test("Should not persist value when key doesnt exist", async () => {
                await adapter.update("a", -1, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBeNull();
            });
            test("Should not persist value when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                await adapter.update("a", -1, context);
                expect(await adapter.get("a", context)).toBeNull();
            });
        });
        describe("method: increment", () => {
            test("Should return true when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.increment("a", 1, context)).toBe(true);
            });
            test("Should persist increment when key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.increment("a", 1, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBe(2);
            });
            test("Should return false when key doesnt exists", async () => {
                expect(await adapter.increment("a", 1, context)).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                expect(await adapter.increment("a", 1, context)).toBe(false);
            });
            test("Should not persist increment when key doesnt exists", async () => {
                await adapter.increment("a", 1, context);
                await delayWithBuffer(TTL.divide(4));
                expect(await adapter.get("a", context)).toBeNull();
            });
            test("Should not persist increment when key is expired", async () => {
                await adapter.add("a", 1, TTL, context);
                await delayWithBuffer(TTL);
                await adapter.increment("a", 1, context);
                expect(await adapter.get("a", context)).toBeNull();
            });
            test("Should throw TypeError when value is not number type", async () => {
                await adapter.add("a", "str", null, context);
                await delayWithBuffer(TTL.divide(4));
                await expect(
                    adapter.increment("a", 1, context),
                ).rejects.toThrow(TypeError);
            });
        });
        describe("method: removeMany", () => {
            test("Should return false when all keys does not exists", async () => {
                const result = await adapter.removeMany(
                    ["a", "b", "c"],
                    context,
                );

                expect(result).toBe(false);
            });
            test("Should return true when one key exists", async () => {
                await adapter.add("a", 1, null, context);
                await delayWithBuffer(TTL.divide(4));

                const result = await adapter.removeMany(
                    ["a", "b", "c"],
                    context,
                );

                expect(result).toBe(true);
            });
            test("Should persist removal of the keys that exists", async () => {
                await adapter.add("a", 1, null, context);
                await adapter.add("b", 2, null, context);
                await adapter.add("c", 3, null, context);
                await delayWithBuffer(TTL.divide(4));

                await adapter.removeMany(["a", "b"], context);
                await delayWithBuffer(TTL.divide(4));

                const result = [
                    await adapter.get("a", context),
                    await adapter.get("b", context),
                    await adapter.get("c", context),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
        describe("method: removeAll", () => {
            test("Should remove all keys", async () => {
                await adapter.add("cache/a", 1, null, context);
                await adapter.add("cache/b", 2, null, context);
                await adapter.add("c", 3, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.removeAll(context);
                await delayWithBuffer(TTL.divide(4));
                expect([
                    await adapter.get("cache/a", context),
                    await adapter.get("cache/b", context),
                    await adapter.get("c", context),
                ]).toEqual([null, null, null]);
            });
        });
        describe("method: removeByKeyPrefix", () => {
            test(`Should remove all keys that start with prefix "cache"`, async () => {
                await adapter.add("cache/a", 1, null, context);
                await adapter.add("cache/b", 2, null, context);
                await adapter.add("c", 3, null, context);
                await delayWithBuffer(TTL.divide(4));
                await adapter.removeByKeyPrefix("cache", context);
                await delayWithBuffer(TTL.divide(4));
                const result = [
                    await adapter.get("cache/a", context),
                    await adapter.get("cache/b", context),
                    await adapter.get("c", context),
                ];
                expect(result).toEqual([null, null, 3]);
            });
        });
    });
}
