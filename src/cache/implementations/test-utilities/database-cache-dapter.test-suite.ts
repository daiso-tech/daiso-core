/**
 * @module Cache
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import {
    type ICacheData,
    type ICacheDataExpiration,
    type IDatabaseCacheAdapter,
} from "@/cache/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 */
export type DatabaseCacheAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IDatabaseCacheAdapter>;
};

/**
 * The `databaseCacheAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IDatabaseCacheAdapter | `IDatabaseCacheAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import Sqlite, { type Database } from "better-sqlite3";
 * import { databaseCacheAdapterTestSuite } from "@daiso-tech/core/cache/test-utilities";
 * import { KyselyCacheAdapter, type KyselyCacheAdapterTables } from "@daiso-tech/core/cache/kysely-cache-adapter";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { Kysely, SqliteDialect } from "kysely";
 *
 * describe("class: KyselyCacheAdapter", () => {
 *   let database: Database;
 *   let kysely: Kysely<KyselyCacheAdapterTables>;
 *
 *   beforeEach(() => {
 *       database = new Sqlite(":memory:");
 *       kysely = new Kysely({
 *          dialect: new SqliteDialect({
 *              database,
 *          }),
 *       });
 *   });
 *   afterEach(() => {
 *       database.close();
 *   });
 *   databaseCacheAdapterTestSuite({
 *       createAdapter: async () => {
 *           const adapter = new KyselyCacheAdapter({
 *               kysely,
 *               shouldRemoveExpiredKeys: false,
 *               serde: new Serde(new SuperJsonSerdeAdapter()),
 *           });
 *           await adapter.init();
 *           return adapter;
 *       },
 *       test,
 *       beforeEach,
 *       expect,
 *       describe,
 *    });
 * });
 * ```
 */
export function databaseCacheAdapterTestSuite(
    settings: DatabaseCacheAdapterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: IDatabaseCacheAdapter<string>;
    beforeEach(async () => {
        adapter = (await createAdapter()) as IDatabaseCacheAdapter<string>;
    });
    const KEY = "a";
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

    describe("IDatabaseCacheAdapter tests:", () => {
        describe("method: find", () => {
            test("Should return null when key does not exists", async () => {
                const data = await adapter.find(noOpContext, KEY);

                expect(data).toBeNull();
            });
            test("Should return value when key exists", async () => {
                const value = "1";

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value,
                    expiration: null,
                } satisfies ICacheData<string>);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key does not exists", async () => {
                const data = await adapter.transaction(
                    noOpContext,
                    async (trx) => {
                        return await trx.find(noOpContext, KEY);
                    },
                );

                expect(data).toBeNull();
            });
            test("Should return value when key exists", async () => {
                const value = "1";

                const storedValue = await adapter.transaction(
                    noOpContext,
                    async (trx) => {
                        await trx.upsert(noOpContext, KEY, value);
                        return await trx.find(noOpContext, KEY);
                    },
                );

                expect(storedValue).toEqual({
                    value,
                    expiration: null,
                } satisfies ICacheData<string>);
            });
        });
        describe("method: transaction upsert", () => {
            test("Should add without expiration when key doesnt exists and expiration is null", async () => {
                const value = "a-1";
                const expiration = null;

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value, expiration);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value,
                    expiration,
                } satisfies ICacheData<string>);
            });
            test("Should add without expiration when key doesnt exists and expiration is an Date", async () => {
                const value = "a-1";
                const currentDate = new Date("2025-01-07");
                const expiration =
                    TimeSpan.fromSeconds(10).toEndDate(currentDate);

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value, expiration);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value,
                    expiration,
                } satisfies ICacheData<string>);
            });
            test("Should add without expiration when key doesnt exists and expiration is undefined", async () => {
                const value = "a-1";

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value,
                    expiration: null,
                } satisfies ICacheData<string>);
            });
            test("Should update only value when key exists and expiration is undefined", async () => {
                const value = "a-1";
                const currentDate = new Date("2026-01-17");
                const expiration =
                    TimeSpan.fromSeconds(6).toEndDate(currentDate);

                const newValue = "2";
                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value, expiration);
                    await trx.upsert(noOpContext, KEY, newValue);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value: newValue,
                    expiration,
                } satisfies ICacheData<string>);
            });
            test("Should update value and expiration when key exists and expiration is null", async () => {
                const value = "a-1";
                const expiration = TimeSpan.fromSeconds(6).toEndDate(
                    new Date("2026-01-17"),
                );

                const newValue = "2";
                const newExpiration = null;

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value, expiration);
                    await trx.upsert(noOpContext, KEY, newValue, newExpiration);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value: newValue,
                    expiration: newExpiration,
                } satisfies ICacheData<string>);
            });
            test("Should update value and expiration when key exists and expiration is an Date", async () => {
                const value = "a-1";
                const expiration = TimeSpan.fromSeconds(6).toEndDate(
                    new Date("2026-01-17"),
                );

                const newValue = "2";
                const newExpiration = TimeSpan.fromSeconds(6).toEndDate(
                    new Date("2027-01-17"),
                );
                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, KEY, value, expiration);
                    await trx.upsert(noOpContext, KEY, newValue, newExpiration);
                });

                const storedValue = await adapter.find(noOpContext, KEY);

                expect(storedValue).toEqual({
                    value: newValue,
                    expiration: newExpiration,
                } satisfies ICacheData<string>);
            });
        });
        describe("method: removeMany", () => {
            test("Should return empty array when given empty array as keys", async () => {
                const data = await adapter.removeMany(noOpContext, [KEY]);

                expect(data).toEqual([]);
            });
            test("Should return array of ICacheDataExpiration when keys exists", async () => {
                const currentDate = new Date("2026-01-17");

                const key1 = "a";
                const value1 = "1";
                const expiration1 =
                    TimeSpan.fromSeconds(3).toEndDate(currentDate);

                const key2 = "b";
                const value2 = "2";
                const expiration2 = null;

                const noneExistingKey = "c";

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, key1, value1, expiration1);
                    await trx.upsert(noOpContext, key2, value2, expiration2);
                });

                const data = await adapter.removeMany(noOpContext, [
                    key1,
                    noneExistingKey,
                    key2,
                ]);

                expect(data).toEqual(
                    expect.arrayContaining([
                        {
                            expiration: expiration1,
                        } satisfies ICacheDataExpiration,
                        {
                            expiration: expiration2,
                        } satisfies ICacheDataExpiration,
                    ]),
                );
            });
            test("Should remove keys", async () => {
                const currentDate = new Date("2026-01-17");

                const key1 = "a";
                const value1 = "1";
                const expiration1 =
                    TimeSpan.fromSeconds(3).toEndDate(currentDate);

                const key2 = "b";
                const value2 = "2";
                const expiration2 = null;

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, key1, value1, expiration1);
                    await trx.upsert(noOpContext, key2, value2, expiration2);
                });

                await adapter.removeMany(noOpContext, [key1, key2]);

                const storedKey1 = await adapter.find(noOpContext, key1);
                const storedKey2 = await adapter.find(noOpContext, key2);

                expect(storedKey1).toBeNull();
                expect(storedKey2).toBeNull();
            });
        });
        describe("method: removeAll", () => {
            test("Should remove all keys", async () => {
                const currentDate = new Date("2026-01-17");

                const key1 = "a";
                const value1 = "1";
                const expiration1 =
                    TimeSpan.fromSeconds(3).toEndDate(currentDate);

                const key2 = "b";
                const value2 = "2";
                const expiration2 =
                    TimeSpan.fromSeconds(6).toEndDate(currentDate);

                const key3 = "c";
                const value3 = "3";
                const expiration3 = null;

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, key1, value1, expiration1);
                    await trx.upsert(noOpContext, key2, value2, expiration2);
                    await trx.upsert(noOpContext, key3, value3, expiration3);
                });

                await adapter.removeAll(noOpContext);

                const storedValue1 = await adapter.find(noOpContext, key1);
                const storedValue2 = await adapter.find(noOpContext, key2);
                const storedValue3 = await adapter.find(noOpContext, key3);

                expect(storedValue1).toBeNull();
                expect(storedValue2).toBeNull();
                expect(storedValue3).toBeNull();
            });
        });
        describe("method: removeByKeyPrefix", () => {
            test("Should remove all keys that match prefix", async () => {
                const keyA1 = "a/1";
                const keyA2 = "a/2";
                const keyB1 = "b/1";
                const keyB2 = "b/2";

                const valueA1 = "a-1";
                const valueA2 = "a-2";
                const valueB1 = "b-1";
                const valueB2 = "b-2";

                await adapter.transaction(noOpContext, async (trx) => {
                    await trx.upsert(noOpContext, keyA1, valueA1);
                    await trx.upsert(noOpContext, keyA2, valueA2);
                    await trx.upsert(noOpContext, keyB1, valueB1);
                    await trx.upsert(noOpContext, keyB2, valueB2);
                });
                await adapter.removeByKeyPrefix(noOpContext, "a/");

                const storedValueA1 = await adapter.find(noOpContext, keyA1);
                const storedValueA2 = await adapter.find(noOpContext, keyA2);
                const storedValueB1 = await adapter.find(noOpContext, keyB1);
                const storedValueB2 = await adapter.find(noOpContext, keyB2);

                expect(storedValueA1).toBeNull();
                expect(storedValueA2).toBeNull();
                expect(storedValueB1).toEqual({
                    value: valueB1,
                    expiration: null,
                } satisfies ICacheData<string>);
                expect(storedValueB2).toEqual({
                    value: valueB2,
                    expiration: null,
                } satisfies ICacheData<string>);
            });
        });
    });
}
