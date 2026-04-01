/**
 * @module Semaphore
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import { type ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay as delay_, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 */
export type SemaphoreAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ISemaphoreAdapter>;

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
 * The `semaphoreAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ISemaphoreAdapter | `ISemaphoreAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { semaphoreAdapterTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
 * import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
 * import { Redis } from "ioredis";
 * import {
 *     RedisContainer,
 *     type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { TimeSpan } from "@daiso-tech/core/time-span";
 *
 * const timeout = TimeSpan.fromMinutes(2);
 * describe("class: RedisSemaphoreAdapter", () => {
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
 *     semaphoreAdapterTestSuite({
 *         createAdapter: () =>
 *             new RedisSemaphoreAdapter(client),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function semaphoreAdapterTestSuite(
    settings: SemaphoreAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ISemaphoreAdapter;

    async function delay(ttl: ITimeSpan): Promise<void> {
        await delay_(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ISemaphoreAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });
        describe("method: acquire", () => {
            test("Should return true when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = null;

                const result = await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when key exists and slot is expired", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });
                await delay(ttl);

                const result = await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when limit is not reached", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                const result = await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return false when limit is reached", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });
                const slotId3 = "3";
                const result = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit,
                    ttl,
                });

                expect(result).toBe(false);
            });
            test("Should return true when one slot is expired", async () => {
                const key = "a";
                const limit = 2;

                const slotId1 = "1";
                const ttl1 = null;
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl: ttl1,
                });
                const slotId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl: ttl2,
                });
                await delay(ttl2);

                const slotId3 = "3";
                const ttl3 = null;
                const result = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit,
                    ttl: ttl3,
                });

                expect(result).toBe(true);
            });
            test("Should return true when slot exists, is unexpireable and acquired multiple times", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = null;

                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });
                const result = await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when slot exists, is unexpired and acquired multiple times", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });
                const result = await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not acquire a slot when slot exists, is unexpireable and acquired multiple times", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });

                const slotId2 = "2";
                const result = await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not acquire a slot when slot exists, is unexpired and acquired multiple times", async () => {
                const key = "a";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });

                const slotId2 = "2";
                const result = await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not update limit when slot count is more than 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                const newLimit = 3;
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit: newLimit,
                    ttl,
                });
                const slotId3 = "3";

                const result1 = await adapter.getState(key);
                expect(result1?.limit).toBe(limit);

                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(false);
            });
        });
        describe("method: release", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                const noneExistingKey = "c";
                const result = await adapter.release(noneExistingKey, slotId);

                expect(result).toBe(false);
            });
            test("Should return false when slot doesnt exists", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;

                const slotId = "1";
                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });

                const noneExistingSlotId = "2";
                const result = await adapter.release(key, noneExistingSlotId);

                expect(result).toBe(false);
            });
            test("Should return false when slot is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                const slotId = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId,
                    ttl,
                    limit,
                });
                await delay(ttl);

                const result = await adapter.release(key, slotId);

                expect(result).toBe(false);
            });
            test("Should return true when slot exists and is unexpired", async () => {
                const key = "a";
                const slotId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });
                const result = await adapter.release(key, slotId);

                expect(result).toBe(true);
            });
            test("Should return true when slot exists and is unexpireable", async () => {
                const key = "a";
                const slotId = "b";
                const ttl = null;
                const limit = 2;

                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });
                const result = await adapter.release(key, slotId);

                expect(result).toBe(true);
            });
            test("Should update limit when slot count is 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });
                await adapter.release(key, slotId1);
                await adapter.release(key, slotId2);

                const newLimit = 3;
                const slotId3 = "3";
                await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit: newLimit,
                    ttl,
                });

                const result1 = await adapter.getState(key);
                expect(result1?.limit).toBe(newLimit);

                const slotId4 = "4";
                await adapter.acquire({
                    key,
                    slotId: slotId4,
                    limit: newLimit,
                    ttl,
                });

                const slotId5 = "5";
                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId5,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(true);

                const slotId6 = "6";
                const result3 = await adapter.acquire({
                    key,
                    slotId: slotId6,
                    limit,
                    ttl,
                });
                expect(result3).toBe(false);
            });
            test("Should decrement slot count when one slot is released", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });
                await adapter.release(key, slotId1);

                const result1 = await adapter.getState(key);
                expect(result1?.acquiredSlots.size).toBe(1);

                await adapter.release(key, slotId2);

                const slotId3 = "3";
                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit,
                    ttl,
                });
                expect(result2).toBe(true);

                const slotId4 = "4";
                const result3 = await adapter.acquire({
                    key,
                    slotId: slotId4,
                    limit,
                    ttl,
                });
                expect(result3).toBe(true);
            });
        });
        describe("method: forceReleaseAll", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                const noneExistingKey = "c";
                const result = await adapter.forceReleaseAll(noneExistingKey);

                expect(result).toBe(false);
            });
            test("Should return false when slot is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;
                const slotId = "1";

                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });
                await delay(ttl);

                const result = await adapter.forceReleaseAll(key);

                expect(result).toBe(false);
            });
            test("Should return false when no slots are acquired", async () => {
                const key = "a";
                const ttl = null;
                const slotId1 = "1";
                const limit = 2;

                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });
                await adapter.release(key, slotId1);
                await adapter.release(key, slotId2);

                const result = await adapter.forceReleaseAll(key);

                expect(result).toBe(false);
            });
            test("Should return true when at least 1 slot is acquired", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;
                const slotId = "1";

                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                const result = await adapter.forceReleaseAll(key);

                expect(result).toBe(true);
            });
            test("Should make all slots reacquirable", async () => {
                const key = "a";
                const limit = 2;
                const slotId1 = "1";
                const ttl1 = null;
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl: ttl1,
                });
                const slotId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl: ttl2,
                });

                await adapter.forceReleaseAll(key);

                const slotId3 = "3";
                const ttl3 = null;
                const result1 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit,
                    ttl: ttl3,
                });
                expect(result1).toBe(true);
                const slotId4 = "4";
                const ttl4 = null;
                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId4,
                    limit,
                    ttl: ttl4,
                });
                expect(result2).toBe(true);
            });
            test("Should update limit when slot count is 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    limit,
                    ttl,
                });
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    limit,
                    ttl,
                });
                await adapter.forceReleaseAll(key);

                const newLimit = 3;
                const slotId3 = "3";
                await adapter.acquire({
                    key,
                    slotId: slotId3,
                    limit: newLimit,
                    ttl,
                });

                const result1 = await adapter.getState(key);
                expect(result1?.limit).toBe(newLimit);

                const slotId4 = "4";
                await adapter.acquire({
                    key,
                    slotId: slotId4,
                    limit: newLimit,
                    ttl,
                });

                const slotId5 = "5";
                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId5,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(true);

                const slotId6 = "6";
                const result3 = await adapter.acquire({
                    key,
                    slotId: slotId6,
                    limit,
                    ttl,
                });
                expect(result3).toBe(false);
            });
        });
        describe("method: refresh", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                const noneExistingKey = "c";
                const result = await adapter.refresh(
                    noneExistingKey,
                    slotId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when slot doesnt exists", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;

                const slotId = "b";
                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });

                const noneExistingSlotId = "c";
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refresh(
                    key,
                    noneExistingSlotId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when slot is expired", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire({
                    key,
                    slotId,
                    limit,
                    ttl,
                });
                await delay(ttl);

                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refresh(key, slotId, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when slot exists and is unexpireable", async () => {
                const key = "a";
                const slotId = "b";
                const ttl = null;
                const limit = 2;

                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refresh(key, slotId, newTtl);

                expect(result).toBe(false);
            });
            test("Should return true when slot exists and is unexpired", async () => {
                const key = "a";
                const slotId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                await adapter.acquire({
                    key,
                    slotId,
                    ttl,
                    limit,
                });
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refresh(key, slotId, newTtl);

                expect(result).toBe(true);
            });
            test("Should not update expiration when slot exists and is unexpireable", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    ttl: ttl1,
                    limit,
                });

                const ttl2 = null;
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    ttl: ttl2,
                    limit,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refresh(key, slotId2, newTtl);
                await delay(newTtl);

                const slotId3 = "3";
                const result1 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result1).toBe(false);
            });
            test("Should update expiration when slot exists and is unexpired", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    slotId: slotId1,
                    ttl: ttl1,
                    limit,
                });

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const slotId2 = "2";
                await adapter.acquire({
                    key,
                    slotId: slotId2,
                    ttl: ttl2,
                    limit,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refresh(key, slotId2, newTtl);
                await delay(newTtl.divide(2));

                const slotId3 = "3";
                const result1 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result1).toBe(false);

                await delay(newTtl.divide(2));
                const result2 = await adapter.acquire({
                    key,
                    slotId: slotId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result2).toBe(true);
            });
        });
        describe("method: getState", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";

                const result = await adapter.getState(key);

                expect(result).toBeNull();
            });
            test("Should return null when key is expired", async () => {
                const key = "a";
                const slotId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;
                await adapter.acquire({
                    key,
                    limit,
                    slotId,
                    ttl,
                });
                await delay(ttl);

                const result = await adapter.getState(key);

                expect(result).toBeNull();
            });
            test("Should return null when all slots are released with forceRelease method", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId1,
                    ttl: ttl1,
                });

                const ttl2 = null;
                const slotId2 = "1";
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId2,
                    ttl: ttl2,
                });

                await adapter.forceReleaseAll(key);

                const result = await adapter.getState(key);

                expect(result).toBeNull();
            });
            test("Should return null when all slots are released with release method", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const slotId1 = "1";
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId1,
                    ttl: ttl1,
                });

                const ttl2 = null;
                const slotId2 = "1";
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId2,
                    ttl: ttl2,
                });

                await adapter.release(key, slotId1);
                await adapter.release(key, slotId2);

                const result = await adapter.getState(key);

                expect(result).toBeNull();
            });
            test("Should return limit when key exists", async () => {
                const key = "a";
                const limit = 3;
                const slotId = "1";
                const ttl = null;

                await adapter.acquire({
                    key,
                    limit,
                    slotId,
                    ttl,
                });

                const state = await adapter.getState(key);

                expect(state?.limit).toBe(limit);
            });
            test("Should return slot count when key exists", async () => {
                const key = "a";
                const limit = 3;

                const slotId1 = "1";
                const ttl1 = null;
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId1,
                    ttl: ttl1,
                });

                const slotId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquire({
                    key,
                    limit,
                    slotId: slotId2,
                    ttl: ttl2,
                });

                const state = await adapter.getState(key);

                expect(state?.acquiredSlots.size).toBe(2);
            });
            test("Should return slot when key exists, slot exists and slot is unexpired", async () => {
                const key = "a";
                const limit = 3;

                const slotId = "a";
                const ttl = null;
                await adapter.acquire({
                    key,
                    limit,
                    slotId,
                    ttl: ttl,
                });

                const state = await adapter.getState(key);

                expect({
                    ...state,
                    acquiredSlots: Object.fromEntries(
                        state?.acquiredSlots ?? [],
                    ),
                }).toEqual({
                    limit,
                    acquiredSlots: {
                        [slotId]: ttl,
                    },
                });
            });
            test("Should return slot when key exists, slot exists and slot is unexpireable", async () => {
                const key = "a";
                const limit = 3;

                const slotId = "a";
                const ttl = TimeSpan.fromMinutes(5);
                let expiration: Date;
                try {
                    vi.useFakeTimers();
                    expiration = ttl.toEndDate();
                    await adapter.acquire({
                        key,
                        limit,
                        slotId,
                        ttl: ttl,
                    });
                } finally {
                    vi.useRealTimers();
                }

                const state = await adapter.getState(key);

                expect({
                    ...state,
                    acquiredSlots: Object.fromEntries(
                        state?.acquiredSlots ?? [],
                    ),
                }).toEqual({
                    limit,
                    acquiredSlots: {
                        [slotId]: expiration,
                    },
                });
            });
        });
    });
}
