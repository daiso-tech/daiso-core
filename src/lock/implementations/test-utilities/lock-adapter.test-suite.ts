/**
 * @module Lock
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import {
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
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
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
};

/**
 * The `lockAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ILockAdapter | `ILockAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { lockAdapterTestSuite } from "@daiso-tech/core/lock/test-utilities";
 * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
 * import { Redis } from "ioredis";
 * import {
 *     RedisContainer,
 *     type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
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
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ILockAdapter;

    async function delay(ttl: ITimeSpan): Promise<void> {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer).toMilliseconds());
        });
    }

    describe("ILockAdapter tests:", () => {
        beforeEach(async () => {
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

                await adapter.acquire(key, lockId, ttl);
                await delay(ttl);

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

                await adapter.acquire(key, lockId, ttl);
                const result = await adapter.acquire(key, lockId, ttl);

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

                await adapter.acquire(key, lockId1, ttl);
                const lockId2 = "c";
                const result = await adapter.acquire(key, lockId2, ttl);

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
                await adapter.acquire(key, lockId1, ttl);

                const lockId2 = "c";
                const result = await adapter.release(key, lockId2);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl);
                await delay(ttl);

                const lockId2 = "c";
                const result = await adapter.release(key, lockId2);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl);
                await delay(ttl);

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
                await adapter.acquire(key, lockId, ttl);

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
                await adapter.acquire(key, lockId1, ttl);

                const lockId2 = "c";
                await adapter.release(key, lockId2);
                const result = await adapter.acquire(key, lockId2, ttl);

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
                await adapter.acquire(key, lockId1, ttl);
                await adapter.release(key, lockId1);

                const lockId2 = "c";
                const result = await adapter.acquire(key, lockId2, ttl);

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

                await adapter.acquire(key, lockId, ttl);
                await delay(ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(false);
            });
            test("Should return true when key is uenxpired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, lockId, ttl);

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
        });
        describe("method: refresh", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, lockId, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(key, lockId2, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(key, lockId2, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by different lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl);
                await delay(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const lockId2 = "c";
                const result = await adapter.refresh(key, lockId2, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl);
                await delay(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, lockId, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;
                await adapter.acquire(key, lockId, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, lockId, newTtl);

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, lockId, newTtl);

                expect(result).toBe(true);
            });
            test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = null;
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMilliseconds(50);
                await adapter.refresh(key, lockId1, newTtl);
                await delay(newTtl);
                const lockId2 = "a";
                const result = await adapter.acquire(key, lockId2, ttl);

                expect(result).toBe(false);
            });
            test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                const key = "a";
                const lockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, lockId1, ttl);

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refresh(key, lockId1, newTtl);
                await delay(newTtl.divide(2));

                const lockId2 = "c";
                const result1 = await adapter.acquire(key, lockId2, ttl);
                expect(result1).toBe(false);

                await delay(newTtl.divide(2));
                const result2 = await adapter.acquire(key, lockId2, ttl);
                expect(result2).toBe(true);
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
                await adapter.acquire(key, lockId, ttl);
                await delay(ttl);

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
                let expiration: Date;
                try {
                    vi.useFakeTimers();
                    expiration = ttl.toEndDate();
                    await adapter.acquire(key, lockId, ttl);
                } finally {
                    vi.useRealTimers();
                }

                const state = await adapter.getState(key);

                expect(state).toEqual({
                    owner: lockId,
                    expiration,
                } satisfies ILockAdapterState);
            });
        });
    });
}
