/**
 * @module SharedLock
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
} from "@/shared-lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 */
export type SharedLockAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ISharedLockAdapter>;

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
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `sharedLockAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ISharedLockAdapter | `ISharedLockAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { sharedLockAdapterTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
 * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
 * import { Redis } from "ioredis";
 * import {
 *     RedisContainer,
 *     type StartedRedisContainer,
 * } from "@testcontainers/redis";
 * import { TimeSpan } from "@daiso-tech/core/time-span";
 *
 * const timeout = TimeSpan.fromMinutes(2);
 * describe("class: RedisSharedLockAdapter", () => {
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
 *     sharedLockAdapterTestSuite({
 *         createAdapter: () =>
 *             new RedisSharedLockAdapter(client),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function sharedLockAdapterTestSuite(
    settings: SharedLockAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: ISharedLockAdapter;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ISharedLockAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });
        describe("method: acquireWriter", () => {
            test("Should return true when key doesnt exists", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;

                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId,
                    ttl,
                );

                expect(result).toBe(true);
            });
            test("Should return true when key is expired", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                await delayWithBuffer(ttl);

                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId,
                    null,
                );
                expect(result).toBe(true);
            });
            test("Should return true when key is unexpireable and acquired by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;

                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId,
                    ttl,
                );

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and acquired by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId,
                    ttl,
                );

                expect(result).toBe(true);
            });
            test("Should return false when key is unexpireable and acquired by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;

                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and acquired by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const result = await adapter.acquireWriter(
                    context,
                    key,
                    lockId,
                    ttl,
                );
                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                await adapter.acquireWriter(context, key, lockId, ttl);

                const state = await adapter.getState(context, key);

                expect({
                    ...state,
                    reader: {
                        ...state?.reader,
                        acquiredSlots: Object.fromEntries(
                            state?.reader?.acquiredSlots.entries() ?? [],
                        ),
                    },
                }).toEqual({
                    writer: null,
                    reader: {
                        limit,
                        acquiredSlots: {
                            [lockId]: ttl,
                        },
                    },
                });
            });
        });
        describe("method: releaseWriter", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const sharedLockId = "b";

                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and released by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const sharedLockId2 = "c";
                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId2,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and released by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const sharedLockId2 = "c";
                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId2,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                await delayWithBuffer(ttl);

                const sharedLockId2 = "c";
                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId2,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and released by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                await delayWithBuffer(ttl);

                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId,
                );

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpireable and released by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId,
                );

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpired and released by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.releaseWriter(
                    context,
                    key,
                    sharedLockId,
                );

                expect(result).toBe(true);
            });
            test("Should not be reacquirable when key is unexpireable and released by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                const sharedLockId2 = "c";

                await adapter.releaseWriter(context, key, sharedLockId2);
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(false);
            });
            test("Should not be reacquirable when key is unexpired and released by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const sharedLockId2 = "c";
                await adapter.releaseWriter(context, key, sharedLockId2);
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(false);
            });
            test("Should be reacquirable when key is unexpireable and released by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                await adapter.releaseWriter(context, key, sharedLockId1);

                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(true);
            });
            test("Should be reacquirable when key is unexpired and released by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                await adapter.releaseWriter(context, key, sharedLockId1);

                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(true);
            });
            test("Should return false when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = TimeSpan.fromSeconds(10);

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const result = await adapter.releaseWriter(
                    context,
                    key,
                    lockId,
                );

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                await adapter.releaseWriter(context, key, lockId);

                const state = await adapter.getState(context, key);

                expect({
                    ...state,
                    reader: {
                        ...state?.reader,
                        acquiredSlots: Object.fromEntries(
                            state?.reader?.acquiredSlots.entries() ?? [],
                        ),
                    },
                }).toEqual({
                    writer: null,
                    reader: {
                        limit,
                        acquiredSlots: {
                            [lockId]: ttl,
                        },
                    },
                });
            });
        });
        describe("method: forceReleaseWriter", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";

                const result = await adapter.forceReleaseWriter(context, key);

                expect(result).toBe(false);
            });
            test("Should return false when key is expired", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                await delayWithBuffer(ttl);

                const result = await adapter.forceReleaseWriter(context, key);

                expect(result).toBe(false);
            });
            test("Should return true when key is uenxpired", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.forceReleaseWriter(context, key);

                expect(result).toBe(true);
            });
            test("Should return true when key is unexpireable", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;

                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.forceReleaseWriter(context, key);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when key is force released", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                await adapter.forceReleaseWriter(context, key);

                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );
                expect(result).toBe(true);
            });
            test("Should return false when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = TimeSpan.fromSeconds(10);

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const result = await adapter.forceReleaseWriter(context, key);

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                await adapter.forceReleaseWriter(context, key);

                const state = await adapter.getState(context, key);

                expect({
                    ...state,
                    reader: {
                        ...state?.reader,
                        acquiredSlots: Object.fromEntries(
                            state?.reader?.acquiredSlots.entries() ?? [],
                        ),
                    },
                }).toEqual({
                    writer: null,
                    reader: {
                        limit,
                        acquiredSlots: {
                            [lockId]: ttl,
                        },
                    },
                });
            });
        });
        describe("method: refreshWriter", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const sharedLockId = "b";

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const sharedLockId2 = "c";
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId2,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpired and refreshed by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const sharedLockId2 = "c";
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId2,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by different shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);
                await delayWithBuffer(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const sharedLockId2 = "c";
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId2,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is expired and refreshed by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                await delayWithBuffer(ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when key is unexpireable and refreshed by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return true when key is unexpired and refreshed by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const newTtl = TimeSpan.fromMinutes(1);
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId,
                    newTtl,
                );

                expect(result).toBe(true);
            });
            test("Should not update expiration when key is unexpireable and refreshed by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const newTtl = TimeSpan.fromMilliseconds(50);
                await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId1,
                    newTtl,
                );
                await delayWithBuffer(newTtl);
                const sharedLockId2 = "2";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );

                expect(result).toBe(false);
            });
            test("Should update expiration when key is unexpired and refreshed by same shared-lock-id", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refreshWriter(
                    context,
                    key,
                    sharedLockId1,
                    newTtl,
                );
                await delayWithBuffer(newTtl.divide(2));

                const sharedLockId2 = "c";
                const result1 = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );
                expect(result1).toBe(false);

                await delayWithBuffer(newTtl.divide(2));
                const result2 = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );
                expect(result2).toBe(true);
            });
            test("Should return false when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = TimeSpan.fromSeconds(10);

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const newTtl = TimeSpan.fromSeconds(20);
                const result = await adapter.refreshWriter(
                    context,
                    key,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as reader", async () => {
                const key = "a";
                const lockId = "1";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const newTtl = TimeSpan.fromSeconds(20);
                await adapter.refreshWriter(context, key, lockId, newTtl);

                const state = await adapter.getState(context, key);

                expect({
                    ...state,
                    reader: {
                        ...state?.reader,
                        acquiredSlots: Object.fromEntries(
                            state?.reader?.acquiredSlots.entries() ?? [],
                        ),
                    },
                }).toEqual({
                    writer: null,
                    reader: {
                        limit,
                        acquiredSlots: {
                            [lockId]: ttl,
                        },
                    },
                });
            });
        });
        describe("method: acquireReader", () => {
            test("Should return true when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = null;

                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when key exists and shared-lock-slot is expired", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                await delayWithBuffer(ttl);

                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when limit is not reached", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return false when limit is reached", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                const lockId3 = "3";
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit,
                    ttl,
                });

                expect(result).toBe(false);
            });
            test("Should return true when one shared-lock-slot is expired", async () => {
                const key = "a";
                const limit = 2;

                const lockId1 = "1";
                const ttl1 = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl: ttl1,
                });
                const lockId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl: ttl2,
                });
                await delayWithBuffer(ttl2);

                const lockId3 = "3";
                const ttl3 = null;
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit,
                    ttl: ttl3,
                });

                expect(result).toBe(true);
            });
            test("Should return true when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = null;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should return true when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });

                const lockId2 = "2";
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                const key = "a";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });

                const lockId2 = "2";
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });

                expect(result).toBe(true);
            });
            test("Should not update limit when shared-lock-slot count is more than 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                const newLimit = 3;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit: newLimit,
                    ttl,
                });
                const lockId3 = "3";

                const result1 = await adapter.getState(context, key);
                expect(result1?.reader?.limit).toBe(limit);

                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(false);
            });
            test("Should return false when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const limit = 3;
                const result = await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const limit = 3;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });

                const state = await adapter.getState(context, key);

                expect(state).toEqual({
                    writer: {
                        owner: lockId,
                        expiration: ttl,
                    },
                    reader: null,
                } satisfies ISharedLockAdapterState);
            });
        });
        describe("method: releaseReader", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const noneExistingKey = "c";
                const result = await adapter.releaseReader(
                    context,
                    noneExistingKey,
                    lockId,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot doesnt exists", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;

                const lockId = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });

                const noneExistingLockId = "2";
                const result = await adapter.releaseReader(
                    context,
                    key,
                    noneExistingLockId,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                const lockId = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });
                await delayWithBuffer(ttl);

                const result = await adapter.releaseReader(
                    context,
                    key,
                    lockId,
                );

                expect(result).toBe(false);
            });
            test("Should return true when shared-lock-slot exists and is unexpired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });
                const result = await adapter.releaseReader(
                    context,
                    key,
                    lockId,
                );

                expect(result).toBe(true);
            });
            test("Should return true when shared-lock-slot exists and is unexpireable", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });
                const result = await adapter.releaseReader(
                    context,
                    key,
                    lockId,
                );

                expect(result).toBe(true);
            });
            test("Should update limit when shared-lock-slot count is 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.releaseReader(context, key, lockId1);
                await adapter.releaseReader(context, key, lockId2);

                const newLimit = 3;
                const lockId3 = "3";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit: newLimit,
                    ttl,
                });

                const result1 = await adapter.getState(context, key);
                expect(result1?.reader?.limit).toBe(newLimit);

                const lockId4 = "4";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit: newLimit,
                    ttl,
                });

                const lockId5 = "5";
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId5,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(true);

                const lockId6 = "6";
                const result3 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId6,
                    limit,
                    ttl,
                });
                expect(result3).toBe(false);
            });
            test("Should decrement shared-lock-slot count when one shared-lock-slot is released", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.releaseReader(context, key, lockId1);

                const result1 = await adapter.getState(context, key);
                expect(result1?.reader?.acquiredSlots.size).toBe(1);

                await adapter.releaseReader(context, key, lockId2);

                const lockId3 = "3";
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit,
                    ttl,
                });
                expect(result2).toBe(true);

                const lockId4 = "4";
                const result3 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit,
                    ttl,
                });
                expect(result3).toBe(true);
            });
            test("Should return false when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const result = await adapter.releaseReader(
                    context,
                    key,
                    lockId,
                );

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                await adapter.releaseReader(context, key, lockId);

                const state = await adapter.getState(context, key);

                expect(state).toEqual({
                    writer: {
                        owner: lockId,
                        expiration: ttl,
                    },
                    reader: null,
                } satisfies ISharedLockAdapterState);
            });
        });
        describe("method: forceReleaseAllReaders", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const noneExistingKey = "c";
                const result = await adapter.forceReleaseAllReaders(
                    context,
                    noneExistingKey,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;
                const lockId = "1";

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                await delayWithBuffer(ttl);

                const result = await adapter.forceReleaseAllReaders(
                    context,
                    key,
                );

                expect(result).toBe(false);
            });
            test("Should return false when no shared-lock-slots are acquired", async () => {
                const key = "a";
                const ttl = null;
                const lockId1 = "1";
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.releaseReader(context, key, lockId1);
                await adapter.releaseReader(context, key, lockId2);

                const result = await adapter.forceReleaseAllReaders(
                    context,
                    key,
                );

                expect(result).toBe(false);
            });
            test("Should return true when at least 1 shared-lock-slot is acquired", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;
                const lockId = "1";

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const result = await adapter.forceReleaseAllReaders(
                    context,
                    key,
                );

                expect(result).toBe(true);
            });
            test("Should make all shared-lock-slots reacquirable", async () => {
                const key = "a";
                const limit = 2;
                const lockId1 = "1";
                const ttl1 = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl: ttl1,
                });
                const lockId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl: ttl2,
                });

                await adapter.forceReleaseAllReaders(context, key);

                const lockId3 = "3";
                const ttl3 = null;
                const result1 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit,
                    ttl: ttl3,
                });
                expect(result1).toBe(true);
                const lockId4 = "4";
                const ttl4 = null;
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit,
                    ttl: ttl4,
                });
                expect(result2).toBe(true);
            });
            test("Should update limit when shared-lock-slot count is 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.forceReleaseAllReaders(context, key);

                const newLimit = 3;
                const lockId3 = "3";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit: newLimit,
                    ttl,
                });

                const result1 = await adapter.getState(context, key);
                expect(result1?.reader?.limit).toBe(newLimit);

                const lockId4 = "4";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit: newLimit,
                    ttl,
                });

                const lockId5 = "5";
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId5,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(true);

                const lockId6 = "6";
                const result3 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId6,
                    limit,
                    ttl,
                });
                expect(result3).toBe(false);
            });
            test("Should return false when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const result = await adapter.forceReleaseAllReaders(
                    context,
                    key,
                );

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                await adapter.forceReleaseAllReaders(context, key);

                const state = await adapter.getState(context, key);

                expect(state).toEqual({
                    writer: {
                        owner: lockId,
                        expiration: ttl,
                    },
                    reader: null,
                } satisfies ISharedLockAdapterState);
            });
        });
        describe("method: refreshReader", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                const noneExistingKey = "c";
                const result = await adapter.refreshReader(
                    context,
                    noneExistingKey,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot doesnt exists", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;

                const lockId = "b";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });

                const noneExistingLockId = "c";
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refreshReader(
                    context,
                    key,
                    noneExistingLockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot is expired", async () => {
                const key = "a";
                const lockId = "b";
                const limit = 2;
                const ttl = TimeSpan.fromMilliseconds(50);
                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                await delayWithBuffer(ttl);

                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refreshReader(
                    context,
                    key,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return false when shared-lock-slot exists and is unexpireable", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = null;
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refreshReader(
                    context,
                    key,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should return true when shared-lock-slot exists and is unexpired", async () => {
                const key = "a";
                const lockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    ttl,
                    limit,
                });
                const newTtl = TimeSpan.fromMilliseconds(100);
                const result = await adapter.refreshReader(
                    context,
                    key,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(true);
            });
            test("Should not update expiration when shared-lock-slot exists and is unexpireable", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    ttl: ttl1,
                    limit,
                });

                const ttl2 = null;
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    ttl: ttl2,
                    limit,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refreshReader(context, key, lockId2, newTtl);
                await delayWithBuffer(newTtl);

                const lockId3 = "3";
                const result1 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result1).toBe(false);
            });
            test("Should update expiration when shared-lock-slot exists and is unexpired", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    ttl: ttl1,
                    limit,
                });

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    ttl: ttl2,
                    limit,
                });

                const newTtl = TimeSpan.fromMilliseconds(100);
                await adapter.refreshReader(context, key, lockId2, newTtl);
                await delayWithBuffer(newTtl.divide(2));

                const lockId3 = "3";
                const result1 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result1).toBe(false);

                await delayWithBuffer(newTtl.divide(2));
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    ttl: ttl2,
                    limit,
                });
                expect(result2).toBe(true);
            });
            test("Should return false when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const newTtl = TimeSpan.fromSeconds(20);
                const result = await adapter.refreshReader(
                    context,
                    key,
                    lockId,
                    newTtl,
                );

                expect(result).toBe(false);
            });
            test("Should not update state when key is acquired as writer", async () => {
                const key = "a";
                const lockId = "1";
                const ttl = null;
                await adapter.acquireWriter(context, key, lockId, ttl);

                const newTtl = TimeSpan.fromSeconds(20);
                await adapter.refreshReader(context, key, lockId, newTtl);

                const state = await adapter.getState(context, key);

                expect(state).toEqual({
                    writer: {
                        owner: lockId,
                        expiration: ttl,
                    },
                    reader: null,
                } satisfies ISharedLockAdapterState);
            });
        });
        describe("method: forceRelease", () => {
            test("Should return false when key doesnt exists", async () => {
                const key = "a";

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(false);
            });
            test("Should return false when key is acquired as writer and is expired", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);
                await delayWithBuffer(ttl);

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(false);
            });
            test("Should return true when key is acquired as writer and is uenxpired", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = TimeSpan.fromMilliseconds(50);

                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(true);
            });
            test("Should return true when key is acquired as writer and is unexpireable", async () => {
                const key = "a";
                const sharedLockId = "b";
                const ttl = null;

                await adapter.acquireWriter(context, key, sharedLockId, ttl);

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(true);
            });
            test("Should be reacquirable when key is acquired as writer and is force released", async () => {
                const key = "a";
                const sharedLockId1 = "b";
                const ttl = null;
                await adapter.acquireWriter(context, key, sharedLockId1, ttl);

                await adapter.forceRelease(context, key);

                const sharedLockId2 = "c";
                const result = await adapter.acquireWriter(
                    context,
                    key,
                    sharedLockId2,
                    ttl,
                );
                expect(result).toBe(true);
            });
            test("Should return false when key is acquired as reader and shared-lock-slot is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;
                const lockId = "1";

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });
                await delayWithBuffer(ttl);

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(false);
            });
            test("Should return false when key is acquired as reader and no shared-lock-slots are acquired", async () => {
                const key = "a";
                const ttl = null;
                const lockId1 = "1";
                const limit = 2;

                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.releaseReader(context, key, lockId1);
                await adapter.releaseReader(context, key, lockId2);

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(false);
            });
            test("Should return true when key is acquired as reader and at least 1 shared-lock-slot is acquired", async () => {
                const key = "a";
                const ttl = null;
                const limit = 2;
                const lockId = "1";

                await adapter.acquireReader({
                    context,
                    key,
                    lockId,
                    limit,
                    ttl,
                });

                const result = await adapter.forceRelease(context, key);

                expect(result).toBe(true);
            });
            test("Should make all shared-lock-slots reacquirable when key is acquired as reader", async () => {
                const key = "a";
                const limit = 2;
                const lockId1 = "1";
                const ttl1 = null;
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl: ttl1,
                });
                const lockId2 = "2";
                const ttl2 = TimeSpan.fromMilliseconds(50);
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl: ttl2,
                });

                await adapter.forceRelease(context, key);

                const lockId3 = "3";
                const ttl3 = null;
                const result1 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit,
                    ttl: ttl3,
                });
                expect(result1).toBe(true);
                const lockId4 = "4";
                const ttl4 = null;
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit,
                    ttl: ttl4,
                });
                expect(result2).toBe(true);
            });
            test("Should update limit when key is reader mode and shared-lock-slot count is 0", async () => {
                const key = "a";
                const limit = 2;
                const ttl = null;

                const lockId1 = "1";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId1,
                    limit,
                    ttl,
                });
                const lockId2 = "2";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId2,
                    limit,
                    ttl,
                });
                await adapter.forceRelease(context, key);

                const newLimit = 3;
                const lockId3 = "3";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId3,
                    limit: newLimit,
                    ttl,
                });

                const result1 = await adapter.getState(context, key);
                expect(result1?.reader?.limit).toBe(newLimit);

                const lockId4 = "4";
                await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId4,
                    limit: newLimit,
                    ttl,
                });

                const lockId5 = "5";
                const result2 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId5,
                    limit: newLimit,
                    ttl,
                });
                expect(result2).toBe(true);

                const lockId6 = "6";
                const result3 = await adapter.acquireReader({
                    context,
                    key,
                    lockId: lockId6,
                    limit,
                    ttl,
                });
                expect(result3).toBe(false);
            });
        });
        describe("method: getState", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";

                const sharedLockData = await adapter.getState(context, key);

                expect(sharedLockData).toBeNull();
            });
            describe("Writer state:", () => {
                test("Should return null when writer lock is expired", async () => {
                    const key = "a";
                    const sharedLockId = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await adapter.acquireWriter(
                        context,
                        key,
                        sharedLockId,
                        ttl,
                    );
                    await delayWithBuffer(ttl);

                    const sharedLockData = await adapter.getState(context, key);

                    expect(sharedLockData).toBeNull();
                });
                test("Should return null when writer lock is released with forceReleaseWriter method", async () => {
                    const key = "a";
                    const ttl = null;
                    const sharedLockId = "1";
                    await adapter.acquireWriter(
                        context,
                        key,
                        sharedLockId,
                        ttl,
                    );

                    await adapter.forceReleaseWriter(context, key);

                    const sharedLockData = await adapter.getState(context, key);

                    expect(sharedLockData).toBeNull();
                });
                test("Should return null when writer lock is released with forceRelease method", async () => {
                    const key = "a";
                    const ttl = null;
                    const sharedLockId = "1";
                    await adapter.acquireWriter(
                        context,
                        key,
                        sharedLockId,
                        ttl,
                    );

                    await adapter.forceRelease(context, key);

                    const sharedLockData = await adapter.getState(context, key);

                    expect(sharedLockData).toBeNull();
                });
                test("Should return null when lock is released with releaseWriter method", async () => {
                    const key = "a";
                    const ttl = null;
                    const sharedLockId = "1";
                    await adapter.acquireWriter(
                        context,
                        key,
                        sharedLockId,
                        ttl,
                    );

                    await adapter.releaseWriter(context, key, sharedLockId);

                    const sharedLockData = await adapter.getState(context, key);

                    expect(sharedLockData).toBeNull();
                });
                test("Should return unactive reader and active writer when writer lock exists and is uenxpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const sharedLockId = "1";
                    await adapter.acquireWriter(
                        context,
                        key,
                        sharedLockId,
                        ttl,
                    );

                    const state = await adapter.getState(context, key);

                    expect(state).toEqual({
                        reader: null,
                        writer: {
                            owner: sharedLockId,
                            expiration: ttl,
                        },
                    } satisfies ISharedLockAdapterState);
                });
                test("Should return unactive reader and active writer when writer lock exists and is unexpired", async () => {
                    const key = "a";
                    const sharedLockId = "1";

                    const ttl = TimeSpan.fromMinutes(5);
                    let expiration: Date;
                    try {
                        vi.useFakeTimers();
                        expiration = ttl.toEndDate();
                        await adapter.acquireWriter(
                            context,
                            key,
                            sharedLockId,
                            ttl,
                        );
                    } finally {
                        vi.useRealTimers();
                    }

                    const state = await adapter.getState(context, key);

                    expect(state).toEqual({
                        reader: null,
                        writer: {
                            owner: sharedLockId,
                            expiration,
                        },
                    } satisfies ISharedLockAdapterState);
                });
                test("Should return active reader and unactive writer when acquired as reader first", async () => {
                    const ttl = null;

                    const keyA = "a";
                    const lockId = "1";
                    const limit = 4;
                    await adapter.acquireReader({
                        context,
                        key: keyA,
                        lockId,
                        limit,
                        ttl,
                    });

                    const keyB = "a";
                    const sharedLockId = "2";
                    await adapter.acquireWriter(
                        context,
                        keyB,
                        sharedLockId,
                        ttl,
                    );

                    const state = await adapter.getState(context, keyB);

                    expect({
                        ...state,
                        reader: {
                            ...state?.reader,
                            acquiredSlots: Object.fromEntries(
                                state?.reader?.acquiredSlots ?? [],
                            ),
                        },
                    }).toEqual({
                        writer: null,
                        reader: {
                            limit,
                            acquiredSlots: {
                                [lockId]: ttl,
                            },
                        },
                    });
                });
            });
            describe("Reader state:", () => {
                test("Should return null when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const lockId = "b";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId,
                        ttl,
                    });
                    await delayWithBuffer(ttl);

                    const result = await adapter.getState(context, key);

                    expect(result).toBeNull();
                });
                test("Should return null when all shared-lock-slots are released with forceReleaseAllReaders method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const lockId1 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId1,
                        ttl: ttl1,
                    });

                    const ttl2 = null;
                    const lockId2 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId2,
                        ttl: ttl2,
                    });

                    await adapter.forceReleaseAllReaders(context, key);

                    const result = await adapter.getState(context, key);

                    expect(result).toBeNull();
                });
                test("Should return null when all shared-lock-slots are released with forceRelease method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const lockId1 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId1,
                        ttl: ttl1,
                    });

                    const ttl2 = null;
                    const lockId2 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId2,
                        ttl: ttl2,
                    });

                    await adapter.forceRelease(context, key);

                    const result = await adapter.getState(context, key);

                    expect(result).toBeNull();
                });
                test("Should return null when all shared-lock-slots are released with releaseReader method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const lockId1 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId1,
                        ttl: ttl1,
                    });

                    const ttl2 = null;
                    const lockId2 = "1";
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId2,
                        ttl: ttl2,
                    });

                    await adapter.releaseReader(context, key, lockId1);
                    await adapter.releaseReader(context, key, lockId2);

                    const result = await adapter.getState(context, key);

                    expect(result).toBeNull();
                });
                test("Should return limit when key exists", async () => {
                    const key = "a";
                    const limit = 3;
                    const lockId = "1";
                    const ttl = null;

                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId,
                        ttl,
                    });

                    const state = await adapter.getState(context, key);

                    expect(state?.reader?.limit).toBe(limit);
                });
                test("Should return shared-lock-slot count when key exists", async () => {
                    const key = "a";
                    const limit = 3;

                    const lockId1 = "1";
                    const ttl1 = null;
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId1,
                        ttl: ttl1,
                    });

                    const lockId2 = "2";
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId: lockId2,
                        ttl: ttl2,
                    });

                    const state = await adapter.getState(context, key);

                    expect(state?.reader?.acquiredSlots.size).toBe(2);
                });
                test("Should return shared-lock-slot when key exists, shared-lock-slot exists and shared-lock-slot is unexpired", async () => {
                    const key = "a";
                    const limit = 3;

                    const lockId = "a";
                    const ttl = null;
                    await adapter.acquireReader({
                        context,
                        key,
                        limit,
                        lockId,
                        ttl,
                    });

                    const state = await adapter.getState(context, key);

                    expect({
                        ...state,
                        reader: {
                            ...state?.reader,
                            acquiredSlots: Object.fromEntries(
                                state?.reader?.acquiredSlots ?? [],
                            ),
                        },
                    }).toEqual({
                        writer: null,
                        reader: {
                            limit,
                            acquiredSlots: {
                                [lockId]: ttl,
                            },
                        },
                    });
                });
                test("Should return shared-lock-slot when key exists, shared-lock-slot exists and shared-lock-slot is unexpireable", async () => {
                    const key = "a";
                    const limit = 3;

                    const lockId = "a";
                    const ttl = TimeSpan.fromMinutes(5);
                    let expiration: Date;
                    try {
                        vi.useFakeTimers();
                        expiration = ttl.toEndDate();
                        await adapter.acquireReader({
                            context,
                            key,
                            limit,
                            lockId,
                            ttl,
                        });
                    } finally {
                        vi.useRealTimers();
                    }

                    const state = await adapter.getState(context, key);

                    expect({
                        ...state,
                        reader: {
                            ...state?.reader,
                            acquiredSlots: Object.fromEntries(
                                state?.reader?.acquiredSlots ?? [],
                            ),
                        },
                    }).toEqual({
                        writer: null,
                        reader: {
                            limit,
                            acquiredSlots: {
                                [lockId]: expiration,
                            },
                        },
                    });
                });
                test("Should return unactive reader and active writer when acquired as reader first", async () => {
                    const ttl = null;

                    const keyB = "a";
                    const sharedLockId = "2";
                    await adapter.acquireWriter(
                        context,
                        keyB,
                        sharedLockId,
                        ttl,
                    );

                    const keyA = "a";
                    const lockId = "1";
                    const limit = 4;
                    await adapter.acquireReader({
                        context,
                        key: keyA,
                        lockId,
                        limit,
                        ttl,
                    });

                    const state = await adapter.getState(context, keyB);

                    expect(state).toEqual({
                        writer: {
                            owner: sharedLockId,
                            expiration: ttl,
                        },
                        reader: null,
                    } satisfies ISharedLockAdapterState);
                });
            });
        });
    });
}
