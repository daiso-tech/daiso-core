/**
 * @module Semaphore
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
    type IDatabaseSemaphoreAdapter,
    type ISemaphoreData,
    type ISemaphoreSlotData,
    type ISemaphoreSlotExpirationData,
} from "@/semaphore/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 */
export type DatabaseSemaphoreAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IDatabaseSemaphoreAdapter>;

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
 * The `databaseSemaphoreAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IDatabaseSemaphoreAdapter | `IDatabaseSemaphoreAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { databaseSemaphoreAdapterTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
 * import { kyselySemaphoreAdapter, type KyselySemaphoreTables } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
 * import { Kysely, SqliteDialect } from "kysely";
 * import Sqlite, { type Database } from "better-sqlite3";
 *
 * describe("class: kyselySemaphoreAdapter", () => {
 *     let database: Database;
 *     let kysely: Kysely<KyselySemaphoreTables>;
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
 *     databaseSemaphoreAdapterTestSuite({
 *         createAdapter: async () => {
 *             const semaphoreAdapter = new kyselySemaphoreAdapter({
 *                 kysely,
 *                 shouldRemoveExpiredKeys: false,
 *             });
 *             await semaphoreAdapter.init();
 *             return semaphoreAdapter;
 *         },
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function databaseSemaphoreAdapterTestSuite(
    settings: DatabaseSemaphoreAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: IDatabaseSemaphoreAdapter;

    describe("IDatabaseSemaphoreAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });
        describe("method: transaction findSemaphore", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSemaphore(
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
                    await trx.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSemaphore(context, key);
                    },
                );

                expect(result).toEqual({ limit } satisfies ISemaphoreData);
            });
        });
        describe("method: transaction findSlots", () => {
            test("Should return empty array when key doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSlots(context, noneExistingKey);
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSlots(context, key);
                    },
                );

                expect(result).toEqual([]);
            });
            test("Should not return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration1);
                });
                const slotId2 = "2";
                const expiration2 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId2, expiration2);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSlots(context, key);
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
                ] as Array<ISemaphoreSlotData>);
            });
        });
        describe("method: transaction upsertSemaphore", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const limit = 2;

                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSemaphore(context, key);
                    },
                );
                expect(result).toEqual({ limit } satisfies ISemaphoreData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const newLimit = 4;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, newLimit);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSemaphore(context, key);
                    },
                );
                expect(result).toEqual({
                    limit: newLimit,
                } satisfies ISemaphoreData);
            });
        });
        describe("method: transaction upsertSlot", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId = "a";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId);
                });
                expect(slot).toEqual({
                    expiration,
                    id: slotId,
                } satisfies ISemaphoreSlotData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration1);
                });

                const slotId2 = "2";
                const expiration2 = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId2, expiration2);
                });

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId2);
                });
                expect(slot).toEqual({
                    expiration: expiration2,
                    id: slotId2,
                } satisfies ISemaphoreSlotData);
            });
        });
        describe("method: removeSlot", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const noneExistingKey = "c";
                const result = await adapter.removeSlot(
                    context,
                    noneExistingKey,
                    slotId,
                );

                expect(result).toBeNull();
            });
            test("Should return null when slotId doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const noneExistingSlotId = "c";
                const result = await adapter.removeSlot(
                    context,
                    key,
                    noneExistingSlotId,
                );

                expect(result).toBeNull();
            });
            test("Should return expiration as null when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const result = await adapter.removeSlot(context, key, slotId);

                expect(result).toEqual({
                    expiration,
                } satisfies ISemaphoreSlotExpirationData);
            });
            test("Should return expiration as date when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const result = await adapter.removeSlot(context, key, slotId);

                expect(result).toEqual({
                    expiration,
                } satisfies ISemaphoreSlotExpirationData);
            });
            test("Should remove slot when key and slotId exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                await adapter.removeSlot(context, key, slotId);

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
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
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const noneExistingSlotId = "c";
                await adapter.removeSlot(context, key, noneExistingSlotId);

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId);
                });
                expect(slot).toEqual({
                    id: slotId,
                    expiration,
                } satisfies ISemaphoreSlotData);
            });
        });
        describe("method: removeAllSlots", () => {
            test("Should return empty array when key doesnt exists", async () => {
                const key = "a";
                const slotId = "b";
                const limit = 2;
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId, expiration);
                });

                const noneExistingKey = "c";
                const result = await adapter.removeAllSlots(
                    context,
                    noneExistingKey,
                );

                expect(result).toEqual([]);
            });
            test("Should return empty array when key exists and has no slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const result = await adapter.removeAllSlots(context, key);

                expect(result).toEqual([]);
            });
            test("Should return array with 2 items when key exists and has slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "b";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration1);
                });
                const slotId2 = "c";
                const expiration2 = TimeSpan.fromMilliseconds(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId2, expiration2);
                });

                const result = await adapter.removeAllSlots(context, key);

                expect(result).to.have.deep.members([
                    {
                        expiration: expiration1,
                    },
                    {
                        expiration: expiration2,
                    },
                ] as Array<ISemaphoreSlotExpirationData>);
            });
            test("Should remove all items when key exists and has slots", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });
                const slotId1 = "b";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration1);
                });
                const slotId2 = "c";
                const expiration2 = TimeSpan.fromMilliseconds(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId2, expiration2);
                });

                await adapter.removeAllSlots(context, key);

                const slots = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.findSlots(context, key);
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
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingKey = "b";
                const result1 = await adapter.updateExpiration(
                    context,
                    noneExistingKey,
                    slotId1,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot doesnt exists", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingSlotId = "b";
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    noneExistingSlotId,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot is expired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when slot is unexpireable", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return number greater than 0 when slot is unexpired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50);
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(
                        context,
                        key,
                        slotId1,
                        expiration.toEndDate(),
                    );
                });

                const newExpiration = TimeSpan.fromMilliseconds(100);
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration.toEndDate(),
                );

                expect(result1).toBeGreaterThan(0);
            });
            test("Should not update expiration when slot is expired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration,
                );

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration,
                } satisfies ISemaphoreSlotData);
            });
            test("Should not update expiration when slot is unexpireable", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration,
                );

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration,
                } satisfies ISemaphoreSlotData);
            });
            test("Should update expiration when slot is unexpired", async () => {
                const key = "a";
                const limit = 2;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSemaphore(context, key, limit);
                });

                const slotId1 = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsertSlot(context, key, slotId1, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    slotId1,
                    newExpiration,
                );

                const slot = await adapter.transaction(context, async (trx) => {
                    const slots = await trx.findSlots(context, key);
                    return slots.find((slot_) => slot_.id === slotId1);
                });
                expect(slot).toEqual({
                    id: slotId1,
                    expiration: newExpiration,
                } satisfies ISemaphoreSlotData);
            });
        });
    });
}
