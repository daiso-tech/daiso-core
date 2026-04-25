/**
 * @module SharedLock
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type IDatabaseSharedLockAdapter,
    type IReaderSemaphoreData,
    type IReaderSemaphoreSlotData,
    type IReaderSemaphoreSlotExpirationData,
    type IWriterLockData,
    type IWriterLockExpirationData,
} from "@/shared-lock/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 */
export type DatabaseSharedLockAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IDatabaseSharedLockAdapter>;

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
 * The `databaseSharedLockAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IDatabaseSharedLockAdapter | `IDatabaseSharedLockAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { databaseSharedLockAdapterTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
 * import { KyselySharedLockAdapter, type KyselySharedLockTables } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
 * import { Kysely, SqliteDialect } from "kysely";
 * import Sqlite, { type Database } from "better-sqlite3";
 *
 * describe("class: KyselySharedLockAdapter", () => {
 *     let database: Database;
 *     let kysely: Kysely<KyselySharedLockTables>;
 *
 *     beforeEach(() => {
 *         database = new Sqlite(":memory:");
 *         kysely = new Kysely({
 *            dialect: new SqliteDialect({
 *                database,
 *            }),
 *         });
 *     });
 *     afterEach(() => {
 *         database.close();
 *     });
 *     databaseSharedLockAdapterTestSuite({
 *         createAdapter: async () => {
 *             const sharedLockAdapter = new KyselySharedLockAdapter({
 *                 kysely,
 *                 shouldRemoveExpiredKeys: false,
 *             });
 *             await sharedLockAdapter.init();
 *             return sharedLockAdapter;
 *         },
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function databaseSharedLockAdapterTestSuite(
    settings: DatabaseSharedLockAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;

    describe("IDatabaseSharedLockAdapter tests:", () => {
        let adapter: IDatabaseSharedLockAdapter;
        beforeEach_(async () => {
            adapter = await createAdapter();
        });
        describe("method: transaction writer.find", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, noneExistingKey);
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return IWriterLockData when key exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMinutes(2).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );

                expect(result).toEqual({
                    owner,
                    expiration,
                } satisfies IWriterLockData);
            });
        });
        describe("method: transaction writer.upsert", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies IWriterLockData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";

                const owner1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner1, expiration1);
                });

                const owner2 = "2";
                const expiration2 = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner2, expiration2);
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    expiration: expiration2,
                    owner: owner2,
                } satisfies IWriterLockData);
            });
        });
        describe("method: transaction writer.remove", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "c";
                const lockExpirationData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.remove(
                            context,
                            noneExistingKey,
                        );
                    },
                );

                expect(lockExpirationData).toBeNull();
            });
            test("Should return expiration as null when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const lockExpirationData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.remove(context, key);
                    },
                );

                expect(lockExpirationData).toEqual({
                    expiration,
                } satisfies IWriterLockExpirationData);
            });
            test("Should return expiration as date when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const lockExpirationData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.remove(context, key);
                    },
                );

                expect(lockExpirationData).toEqual({
                    expiration,
                } satisfies IWriterLockExpirationData);
            });
            test("Should remove lock when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                await adapter.transaction(context, async (trx) => {
                    return await trx.writer.remove(context, key);
                });

                const lockExpirationData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockExpirationData).toBeNull();
            });
        });
        describe("method: transaction writer.removeIfOwner", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "c";
                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.removeIfOwner(
                            context,
                            noneExistingKey,
                            owner,
                        );
                    },
                );

                expect(lockData).toBeNull();
            });
            test("Should return null when owner doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExistingOwner = "c";
                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.removeIfOwner(
                            context,
                            key,
                            noneExistingOwner,
                        );
                    },
                );

                expect(lockData).toBeNull();
            });
            test("Should return expiration as null when key and owner exists and is unexpireable", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.removeIfOwner(
                            context,
                            key,
                            owner,
                        );
                    },
                );

                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies IWriterLockData);
            });
            test("Should return expiration as date when key and owner exists and is unexpireable", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.removeIfOwner(
                            context,
                            key,
                            owner,
                        );
                    },
                );

                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies IWriterLockData);
            });
            test("Should remove lock when key and owner exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.removeIfOwner(context, key, owner);
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toBeNull();
            });
            test("Should not remove lock when key exists and owner does not exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExsitingOwner = "c";
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.removeIfOwner(
                        context,
                        key,
                        noneExsitingOwner,
                    );
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies IWriterLockData);
            });
        });
        describe("method: transaction writer.updateExpiration", () => {
            test("Should return 0 when semaphore key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingKey = "b";
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.updateExpiration(
                            context,
                            noneExistingKey,
                            owner,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when owner doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingOwner = "b";
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.updateExpiration(
                            context,
                            key,
                            noneExistingOwner,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when lock is expired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.updateExpiration(
                            context,
                            key,
                            owner,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when lock is unexpireable", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.updateExpiration(
                            context,
                            key,
                            owner,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return number greater than 0 when lock is unexpired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50);

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(
                        context,
                        key,
                        owner,
                        expiration.toEndDate(),
                    );
                });

                const newExpiration = TimeSpan.fromMilliseconds(100);
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.updateExpiration(
                            context,
                            key,
                            owner,
                            newExpiration.toEndDate(),
                        );
                    },
                );

                expect(result1).toBeGreaterThan(0);
            });
            test("Should not update expiration when lock is expired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.updateExpiration(
                        context,
                        key,
                        owner,
                        newExpiration,
                    );
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    owner,
                    expiration,
                } satisfies IWriterLockData);
            });
            test("Should not update expiration when lock is unexpireable", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.updateExpiration(
                        context,
                        key,
                        owner,
                        newExpiration,
                    );
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    owner,
                    expiration,
                } satisfies IWriterLockData);
            });
            test("Should update expiration when lock is unexpired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.updateExpiration(
                        context,
                        key,
                        owner,
                        newExpiration,
                    );
                });

                const lockData = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );
                expect(lockData).toEqual({
                    owner,
                    expiration: newExpiration,
                } satisfies IWriterLockData);
            });
        });
        describe("method: transaction writer.find", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, noneExistingKey);
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return IWriterLockData when key exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMinutes(2).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.writer.upsert(context, key, owner, expiration);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.writer.find(context, key);
                    },
                );

                expect(result).toEqual({
                    owner,
                    expiration,
                } satisfies IWriterLockData);
            });
        });
        describe("method: transaction reader.findSemaphore", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSemaphore(
                            context,
                            noneExistingKey,
                        );
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return ISemaphoreData when key exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSemaphore(context, key);
                    },
                );

                expect(result).toEqual({
                    limit,
                } satisfies IReaderSemaphoreData);
            });
        });
        describe("method: transaction reader.findSlots", () => {
            test("Should return empty array when key doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSlots(
                            context,
                            noneExistingKey,
                        );
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSlots(context, key);
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should not return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration1,
                    );
                });
                const slotId2 = "2";
                const expiration2 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId2,
                        expiration2,
                    );
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSlots(context, key);
                    },
                );

                expect(result).to.have.deep.members([
                    {
                        id: slotId1,
                        expiration: expiration1,
                    },
                    {
                        id: slotId2,
                        expiration: expiration2,
                    },
                ] as Array<IReaderSemaphoreSlotData>);
            });
        });
        describe("method: transaction reader.upsertSemaphore", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const limit = 2;

                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSemaphore(context, key);
                    },
                );
                expect(result).toEqual({
                    limit,
                } satisfies IReaderSemaphoreData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const newLimit = 4;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, newLimit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSemaphore(context, key);
                    },
                );
                expect(result).toEqual({
                    limit: newLimit,
                } satisfies IReaderSemaphoreData);
            });
        });
        describe("method: transaction reader.upsertSlot", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId = "a";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId);
                });
                expect(slot).toEqual({
                    expiration,
                    id: slotId,
                } satisfies IReaderSemaphoreSlotData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration1,
                    );
                });

                const slotId2 = "2";
                const expiration2 = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId2,
                        expiration2,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId2);
                });
                expect(slot).toEqual({
                    expiration: expiration2,
                    id: slotId2,
                } satisfies IReaderSemaphoreSlotData);
            });
        });
        describe("method: removeSlot", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const noneExistingKey = "c";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.removeSlot(
                            context,
                            noneExistingKey,
                            slotId,
                        );
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return null when slotId doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const noneExistingSlotId = "c";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.removeSlot(
                            context,
                            key,
                            noneExistingSlotId,
                        );
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return expiration as null when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.removeSlot(
                            context,
                            key,
                            slotId,
                        );
                    },
                );

                expect(result).toEqual({
                    expiration,
                } satisfies IReaderSemaphoreSlotExpirationData);
            });
            test("Should return expiration as date when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.removeSlot(
                            context,
                            key,
                            slotId,
                        );
                    },
                );

                expect(result).toEqual({
                    expiration,
                } satisfies IReaderSemaphoreSlotExpirationData);
            });
            test("Should remove slot when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                await adapter.transaction(context, async (trx) => {
                    return await trx.reader.removeSlot(context, key, slotId);
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId);
                });
                expect(slot).toBeUndefined();
            });
            test("Should not remove slot when key exists and slotId does not exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const noneExistingSlotId = "c";
                await adapter.transaction(context, async (trx) => {
                    return await trx.reader.removeSlot(
                        context,
                        key,
                        noneExistingSlotId,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId);
                });
                expect(slot).toEqual({
                    id: slotId,
                    expiration,
                } satisfies IReaderSemaphoreSlotData);
            });
        });
        describe("method: removeAllSlots", () => {
            test("Should return empty array when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId,
                        expiration,
                    );
                });

                const noneExistingKey = "c";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.removeAllSlots(
                            context,
                            noneExistingKey,
                        );
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.removeAllSlots(context, key);
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should return array with 2 items when key exists and has slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "b";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration1,
                    );
                });
                const slotId2 = "c";
                const expiration2 = TimeSpan.fromMilliseconds(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId2,
                        expiration2,
                    );
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.removeAllSlots(context, key);
                    },
                );

                expect(result).to.have.deep.members([
                    {
                        expiration: expiration1,
                    },
                    {
                        expiration: expiration2,
                    },
                ] as Array<IReaderSemaphoreSlotExpirationData>);
            });
            test("Should remove all items when key exists and has slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "b";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration1,
                    );
                });
                const slotId2 = "c";
                const expiration2 = TimeSpan.fromMilliseconds(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId2,
                        expiration2,
                    );
                });

                await adapter.transaction(context, async (trx) => {
                    return trx.reader.removeAllSlots(context, key);
                });

                const slots = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.reader.findSlots(context, key);
                    },
                );
                expect(slots).toEqual([]);
            });
        });
        describe("method: updateExpiration", () => {
            test("Should return 0 when semaphore key doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingKey = "b";
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.updateExpiration(
                            context,
                            noneExistingKey,
                            slotId1,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingSlotId = "b";
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.updateExpiration(
                            context,
                            key,
                            noneExistingSlotId,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot is expired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.updateExpiration(
                            context,
                            key,
                            slotId1,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot is unexpireable", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.updateExpiration(
                            context,
                            key,
                            slotId1,
                            newExpiration,
                        );
                    },
                );

                expect(result1).toBe(0);
            });
            test("Should return number greater than 0 when slot is unexpired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50);
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration.toEndDate(),
                    );
                });

                const newExpiration = TimeSpan.fromMilliseconds(100);
                const result1 = await adapter.transaction(
                    context,
                    async (trx) => {
                        return trx.reader.updateExpiration(
                            context,
                            key,
                            slotId1,
                            newExpiration.toEndDate(),
                        );
                    },
                );

                expect(result1).toBeGreaterThan(0);
            });
            test("Should not update expiration when slot is expired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    return await trx.reader.updateExpiration(
                        context,
                        key,
                        slotId1,
                        newExpiration,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration,
                } satisfies IReaderSemaphoreSlotData);
            });
            test("Should not update expiration when slot is unexpireable", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    return await trx.reader.updateExpiration(
                        context,
                        key,
                        slotId1,
                        newExpiration,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration,
                } satisfies IReaderSemaphoreSlotData);
            });
            test("Should update expiration when slot is unexpired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.reader.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration,
                    );
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    return await trx.reader.updateExpiration(
                        context,
                        key,
                        slotId1,
                        newExpiration,
                    );
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.reader.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration: newExpiration,
                } satisfies IReaderSemaphoreSlotData);
            });
        });
    });
}
