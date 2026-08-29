/**
 * @module Lock
 */
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock/test-utilities"`
 * @group Utilities
 */
export type LockAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ILockAdapter>;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
};

/**
 * The `lockAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ILockAdapter | `ILockAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { lockAdapterTestSuite } from "eridu-tech/lock/test-utilities";
 * import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
 * import { Redis } from "ioredis";
 * import {
 *     RedisContainer,
 *     type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { TimeSpan } from "eridu-tech/time-span";
 *
 * const timeout = TimeSpan.fromMinutes(2);
 * describe("class: RedisLockAdapter", () => {
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
 *     lockAdapterTestSuite({
 *         createAdapter: () =>
 *             new RedisLockAdapter(client),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function lockAdapterTestSuite(
    settings: LockAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ILockAdapter;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ILockAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });
        describe("method: acquire", () => {
            test("Should return true when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;

                const result = await adapter.acquire(key, lockId, ttl);

                expect(result).toBe(true);
            });
            test("Should return true when key is expired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, lockId, ttl.toEndDate());
                await delayWithBuffer(ttl);

                const result = await adapter.acquire(key, lockId, null);
                expect(result).toBe(true);
            });
            test("Should return true when key is unexpireable and acquired by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;

                await adapter.acquire(key, lockId, ttl);
                const result = await adapter.acquire(key, lockId, ttl);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and acquired by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId, ttl.toEndDate(currentDate));
                const result = await adapter.acquire(
                    key,
                    lockId,
                    ttl.toEndDate(currentDate),
                );

                expect(result).toBe(true);
            });
            test("Should return false when key is unexpireable and acquired by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;

                await adapter.acquire(key, lockId1, ttl);
                const lockId2 = "c";
                const result = await adapter.acquire(key, lockId2, ttl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and acquired by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));
                const lockId2 = "c";
                const result = await adapter.acquire(
                    key,
                    lockId2,
                    ttl.toEndDate(currentDate),
                );

                expect(result).toBe(false);
            });
        });
        describe("method: release", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";

                const result = await adapter.release(key, lockId);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                const lockId2 = "c";
                const result = await adapter.release(key, lockId2);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl.toEndDate());

                const lockId2 = "c";
                const result = await adapter.release(key, lockId2);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl.toEndDate());
                await delayWithBuffer(ttl);

                const lockId2 = "c";
                const result = await adapter.release(key, lockId2);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl.toEndDate());
                await delayWithBuffer(ttl);

                const result = await adapter.release(key, lockId);

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpireable and released by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;
                await adapter.acquire(key, lockId, ttl);

                const result = await adapter.release(key, lockId);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and released by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl.toEndDate());

                const result = await adapter.release(key, lockId);

                expect(result).toBe(true);
            });
            test("Should not be reacquirable when key is unexpireable and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);
                const lockId2 = "c";

                await adapter.release(key, lockId2);
                const result = await adapter.acquire(key, lockId2, ttl);

                expect(result).toBe(false);
            });
            test("Should not be reacquirable when key is unexpired and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));

                const lockId2 = "c";
                await adapter.release(key, lockId2);
                const result = await adapter.acquire(
                    key,
                    lockId2,
                    ttl.toEndDate(currentDate),
                );

                expect(result).toBe(false);
            });
            test("Should be reacquirable when key is unexpireable and released by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);
                await adapter.release(key, lockId1);

                const lockId2 = "c";
                const result = await adapter.acquire(key, lockId2, ttl);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when key is unexpired and released by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));
                await adapter.release(key, lockId1);

                const lockId2 = "c";
                const result = await adapter.acquire(
                    key,
                    lockId2,
                    ttl.toEndDate(currentDate),
                );

                expect(result).toBe(true);
            });
        });
        describe("method: forceRelease", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";

                const result = await adapter.forceRelease(key);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, lockId, ttl.toEndDate());
                await delayWithBuffer(ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(false);
            });
            test("Should return true when key is uenxpired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, lockId, ttl.toEndDate());

                const result = await adapter.forceRelease(key);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpireable", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;

                await adapter.acquire(key, lockId, ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when force released", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                await adapter.forceRelease(key);

                const lockId2 = "c";
                const result = await adapter.acquire(key, lockId2, ttl);
                expect(result).toBe(true);
            });
            test("Should return false when key expires exactly now", async () => {
                const key = "a";
                const lockId = "b";

                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, lockId, ttl.toEndDate());

                await delayWithBuffer(ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(false);
            });
        });
        describe("method: refresh", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(
                    key,
                    lockId,
                    newTtl.toEndDate(),
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(
                    key,
                    lockId2,
                    newTtl.toEndDate(),
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(
                    key,
                    lockId2,
                    newTtl.toEndDate(currentDate),
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));
                await delayWithBuffer(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(
                    key,
                    lockId2,
                    newTtl.toEndDate(currentDate),
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId, ttl.toEndDate(currentDate));
                await delayWithBuffer(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(
                    key,
                    lockId,
                    newTtl.toEndDate(currentDate),
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;
                await adapter.acquire(key, lockId, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(
                    key,
                    lockId,
                    newTtl.toEndDate(),
                );

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId, ttl.toEndDate(currentDate));

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(
                    key,
                    lockId,
                    newTtl.toEndDate(currentDate),
                );

                expect(result).toBe(true);
            });
            test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMilliseconds(50);
                await adapter.refresh(key, lockId1, newTtl.toEndDate());
                await delayWithBuffer(newTtl);
                const lockId2 = "a";
                const result = await adapter.acquire(key, lockId2, ttl);

                expect(result).toBe(false);
            });
            test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const currentDate = new Date();

                await adapter.acquire(key, lockId1, ttl.toEndDate(currentDate));

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refresh(
                    key,
                    lockId1,
                    newTtl.toEndDate(currentDate),
                );
                await delayWithBuffer(newTtl.divide(2));

                const lockId2 = "c";
                const result1 = await adapter.acquire(
                    key,
                    lockId2,
                    ttl.toEndDate(currentDate),
                );
                expect(result1).toBe(false);

                await delayWithBuffer(newTtl.divide(2));
                const result2 = await adapter.acquire(
                    key,
                    lockId2,
                    ttl.toEndDate(),
                );
                expect(result2).toBe(true);
            });
            test("Should not update expiration when key is unexpired and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const currentDate = new Date();

                const ttl = TimeSpan.fromMilliseconds(100);
                const originalExpiration = ttl.toEndDate(currentDate);

                await adapter.acquire(key, lockId1, originalExpiration);

                const lockId2 = "c";
                const newExpiration =
                    TimeSpan.fromSeconds(10).toEndDate(currentDate);

                const result = await adapter.refresh(
                    key,
                    lockId2,
                    newExpiration,
                );

                expect(result).toBe(false);

                const state = await adapter.getState(key);

                expect(state).not.toBeNull();
                expect(state?.owner).toBe(lockId1);
                expect(state?.expiration?.getTime()).toBe(
                    originalExpiration.getTime(),
                );
            });
        });
        describe("method: getState", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return null when lock is expired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl.toEndDate());
                await delayWithBuffer(ttl);

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return null when lock is released with forceRelease method", async () => {
                const key = "a";
                const ttl = null;
                const lockId = "1";
                await adapter.acquire(key, lockId, ttl);

                await adapter.forceRelease(key);

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return null when lock is released with release method", async () => {
                const key = "a";
                const ttl = null;
                const lockId = "1";
                await adapter.acquire(key, lockId, ttl);

                await adapter.release(key, lockId);

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return ILockAdapterState when lock exists and is uenxpireable", async () => {
                const key = "a";
                const ttl = null;
                const lockId = "1";
                await adapter.acquire(key, lockId, ttl);

                const state = await adapter.getState(key);

                expect(state).toEqual({
                    owner: lockId,
                    expiration: ttl,
                } satisfies ILockAdapterState);
            });
            test("Should return ILockAdapterState when lock exists and is unexpired", async () => {
                const key = "a";
                const lockId = "1";

                const ttl = TimeSpan.fromMinutes(5);
                const currentDate = new Date();
                const expiration = ttl.toEndDate(currentDate);
                await adapter.acquire(key, lockId, ttl.toEndDate(currentDate));

                const state = await adapter.getState(key);

                expect(state).toEqual({
                    owner: lockId,
                    expiration,
                } satisfies ILockAdapterState);
            });
        });
    });
}
