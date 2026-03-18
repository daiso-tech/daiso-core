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
import { Task } from "@/task/implementations/_module.js";
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
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: ILockAdapter;

    async function delay(time: TimeSpan): Promise<void> {
        await Task.delay(time.addMilliseconds(10));
    }

    describe("ILockAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });
        describe("method: acquire", () => {
            test("Should return true when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const ttl = null;

                const result = await adapter.acquire(key, owner, ttl);

                expect(result).toBe(true);
            });
            test(
                "Should return true when key is expired",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await adapter.acquire(key, owner, ttl);
                    await delay(ttl);

                    const result = await adapter.acquire(key, owner, null);
                    expect(result).toBe(true);
                },
            );
            test("Should return true when key is unexpireable and acquired by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = null;

                await adapter.acquire(key, owner, ttl);
                const result = await adapter.acquire(key, owner, ttl);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and acquired by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, owner, ttl);
                const result = await adapter.acquire(key, owner, ttl);

                expect(result).toBe(true);
            });
            test("Should return false when key is unexpireable and acquired by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;

                await adapter.acquire(key, owner1, ttl);
                const owner2 = "c";
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and acquired by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, owner1, ttl);
                const owner2 = "c";
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(false);
            });
        });
        describe("method: release", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";

                const result = await adapter.release(key, owner);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and released by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;
                await adapter.acquire(key, owner1, ttl);

                const owner2 = "c";
                const result = await adapter.release(key, owner2);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and released by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner1, ttl);

                const owner2 = "c";
                const result = await adapter.release(key, owner2);

                expect(result).toBe(false);
            });
            test(
                "Should return false when key is expired and released by different owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner1 = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner1, ttl);

                    const owner2 = "c";
                    const result = await adapter.release(key, owner2);
                    await delay(ttl);

                    expect(result).toBe(false);
                },
            );
            test(
                "Should return false when key is expired and released by same owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner, ttl);
                    await delay(ttl);

                    const result = await adapter.release(key, owner);

                    expect(result).toBe(false);
                },
            );
            test("Should return true when key is unexpireable and released by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = null;
                await adapter.acquire(key, owner, ttl);

                const result = await adapter.release(key, owner);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and released by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner, ttl);

                const result = await adapter.release(key, owner);

                expect(result).toBe(true);
            });
            test("Should not be reacquirable when key is unexpireable and released by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;
                await adapter.acquire(key, owner1, ttl);
                const owner2 = "c";

                await adapter.release(key, owner2);
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(false);
            });
            test("Should not be reacquirable when key is unexpired and released by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner1, ttl);

                const owner2 = "c";
                await adapter.release(key, owner2);
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(false);
            });
            test("Should be reacquirable when key is unexpireable and released by same owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;
                await adapter.acquire(key, owner1, ttl);
                await adapter.release(key, owner1);

                const owner2 = "c";
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when key is unexpired and released by same owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner1, ttl);
                await adapter.release(key, owner1);

                const owner2 = "c";
                const result = await adapter.acquire(key, owner2, ttl);

                expect(result).toBe(true);
            });
        });
        describe("method: forceRelease", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";

                const result = await adapter.forceRelease(key);

                expect(result).toBe(false);
            });
            test(
                "Should return false when key is expired",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await adapter.acquire(key, owner, ttl);
                    await delay(ttl);

                    const result = await adapter.forceRelease(key);

                    expect(result).toBe(false);
                },
            );
            test("Should return true when key is uenxpired", async () => {
                const key = "a";
                const owner = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquire(key, owner, ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpireable", async () => {
                const key = "a";
                const owner = "b";
                const ttl = null;

                await adapter.acquire(key, owner, ttl);

                const result = await adapter.forceRelease(key);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when force released", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;
                await adapter.acquire(key, owner1, ttl);

                await adapter.forceRelease(key);

                const owner2 = "c";
                const result = await adapter.acquire(key, owner2, ttl);
                expect(result).toBe(true);
            });
        });
        describe("method: refresh", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, owner, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = null;
                await adapter.acquire(key, owner1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const owner2 = "c";
                const result = await adapter.refresh(key, owner2, newTtl);

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and refreshed by different owner", async () => {
                const key = "a";
                const owner1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const owner2 = "c";
                const result = await adapter.refresh(key, owner2, newTtl);

                expect(result).toBe(false);
            });
            test(
                "Should return false when key is expired and refreshed by different owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner1 = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner1, ttl);
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const owner2 = "c";
                    const result = await adapter.refresh(key, owner2, newTtl);

                    expect(result).toBe(false);
                },
            );
            test(
                "Should return false when key is expired and refreshed by same owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner, ttl);
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await adapter.refresh(key, owner, newTtl);

                    expect(result).toBe(false);
                },
            );
            test("Should return false when key is unexpireable and refreshed by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = null;
                await adapter.acquire(key, owner, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, owner, newTtl);

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpired and refreshed by same owner", async () => {
                const key = "a";
                const owner = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquire(key, owner, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refresh(key, owner, newTtl);

                expect(result).toBe(true);
            });
            test(
                "Should not update expiration when key is unexpireable and refreshed by same owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner1 = "b";
                    const ttl = null;
                    await adapter.acquire(key, owner1, ttl);

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    await adapter.refresh(key, owner1, newTtl);
                    await delay(newTtl);
                    const owner2 = "a";
                    const result = await adapter.acquire(key, owner2, ttl);

                    expect(result).toBe(false);
                },
            );
            test(
                "Should update expiration when key is unexpired and refreshed by same owner",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner1 = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner1, ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await adapter.refresh(key, owner1, newTtl);
                    await delay(newTtl.divide(2));

                    const owner2 = "c";
                    const result1 = await adapter.acquire(key, owner2, ttl);
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await adapter.acquire(key, owner2, ttl);
                    expect(result2).toBe(true);
                },
            );
        });
        describe("method: getState", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test(
                "Should return null when lock is expired",
                {
                    retry: 10,
                },
                async () => {
                    const key = "a";
                    const owner = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquire(key, owner, ttl);
                    await delay(ttl);

                    const lockData = await adapter.getState(key);

                    expect(lockData).toBeNull();
                },
            );
            test("Should return null when lock is released with forceRelease method", async () => {
                const key = "a";
                const ttl = null;
                const owner = "1";
                await adapter.acquire(key, owner, ttl);

                await adapter.forceRelease(key);

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return null when lock is released with release method", async () => {
                const key = "a";
                const ttl = null;
                const owner = "1";
                await adapter.acquire(key, owner, ttl);

                await adapter.release(key, owner);

                const lockData = await adapter.getState(key);

                expect(lockData).toBeNull();
            });
            test("Should return ILockAdapterState when lock exists and is uenxpireable", async () => {
                const key = "a";
                const ttl = null;
                const owner = "1";
                await adapter.acquire(key, owner, ttl);

                const state = await adapter.getState(key);

                expect(state).toEqual({
                    owner,
                    expiration: ttl,
                } satisfies ILockAdapterState);
            });
            test("Should return ILockAdapterState when lock exists and is unexpired", async () => {
                const key = "a";
                const owner = "1";

                const ttl = TimeSpan.fromMinutes(5);
                let expiration: Date;
                try {
                    vi.useFakeTimers();
                    expiration = ttl.toEndDate();
                    await adapter.acquire(key, owner, ttl);
                } finally {
                    vi.useRealTimers();
                }

                const state = await adapter.getState(key);

                expect(state).toEqual({
                    owner,
                    expiration,
                } satisfies ILockAdapterState);
            });
        });
    });
}
