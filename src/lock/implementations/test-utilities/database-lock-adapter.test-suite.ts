/**
 * @module Lock
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import { type IContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type IDatabaseLockAdapter,
    type ILockData,
    type ILockExpirationData,
} from "@/lock/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 */
export type DatabaseLockAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IDatabaseLockAdapter>;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IContext;
};

/**
 * The `databaseLockAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IDatabaseLockAdapter | `IDatabaseLockAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { databaseLockAdapterTestSuite } from "@daiso-tech/core/lock/test-utilities";
 * import { kyselyLockAdapter, type KyselyLockTables } from "@daiso-tech/core/lock/kysely-lock-adapter";
 * import { Kysely, SqliteDialect } from "kysely";
 * import Sqlite, { type Database } from "better-sqlite3";
 *
 * describe("class: kyselyLockAdapter", () => {
 *     let database: Database;
 *     let kysely: Kysely<KyselyLockTables>;
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
 *     databaseLockAdapterTestSuite({
 *         createAdapter: async () => {
 *             const lockAdapter = new kyselyLockAdapter({
 *                 kysely,
 *                 shouldRemoveExpiredKeys: false,
 *             });
 *             await lockAdapter.init();
 *             return lockAdapter;
 *         },
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function databaseLockAdapterTestSuite(
    settings: DatabaseLockAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;

    describe("IDatabaseLockAdapter tests:", () => {
        let adapter: IDatabaseLockAdapter;
        beforeEach(async () => {
            adapter = await createAdapter();
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "b";
                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.find(context, noneExistingKey);
                    },
                );

                expect(result).toBeNull();
            });
            test("Should return ILockData when key exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMinutes(2).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const result = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.find(context, key);
                    },
                );

                expect(result).toEqual({
                    owner,
                    expiration,
                } satisfies ILockData);
            });
        });
        describe("method: transaction upsert", () => {
            test("Should insert when key doesnt exists exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies ILockData);
            });
            test("Should update when key exists exists", async () => {
                const key = "a";

                const owner1 = "1";
                const expiration1 = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner1, expiration1);
                });

                const owner2 = "2";
                const expiration2 = TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner2, expiration2);
                });

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    expiration: expiration2,
                    owner: owner2,
                } satisfies ILockData);
            });
        });
        describe("method: remove", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "c";
                const lockExpirationData = await adapter.remove(
                    context,
                    noneExistingKey,
                );

                expect(lockExpirationData).toBeNull();
            });
            test("Should return expiration as null when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const lockExpirationData = await adapter.remove(context, key);

                expect(lockExpirationData).toEqual({
                    expiration,
                } satisfies ILockExpirationData);
            });
            test("Should return expiration as date when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const lockExpirationData = await adapter.remove(context, key);

                expect(lockExpirationData).toEqual({
                    expiration,
                } satisfies ILockExpirationData);
            });
            test("Should remove lock when key exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                await adapter.remove(context, key);

                const lockExpirationData = await adapter.find(context, key);
                expect(lockExpirationData).toBeNull();
            });
        });
        describe("method: removeIfOwner", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "c";
                const lockData = await adapter.removeIfOwner(
                    context,
                    noneExistingKey,
                    owner,
                );

                expect(lockData).toBeNull();
            });
            test("Should return null when owner doesnt exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExistingOwner = "c";
                const lockData = await adapter.removeIfOwner(
                    context,
                    key,
                    noneExistingOwner,
                );

                expect(lockData).toBeNull();
            });
            test("Should return expiration as null when key and owner exists and is unexpireable", async () => {
                const key = "a";
                const owner = "b";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.removeIfOwner(
                    context,
                    key,
                    owner,
                );

                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies ILockData);
            });
            test("Should return expiration as date when key and owner exists and is unexpireable", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const lockData = await adapter.removeIfOwner(
                    context,
                    key,
                    owner,
                );

                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies ILockData);
            });
            test("Should remove lock when key and owner exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                await adapter.removeIfOwner(context, key, owner);

                const lockData = await adapter.find(context, key);
                expect(lockData).toBeNull();
            });
            test("Should not remove lock when key exists and owner does not exists", async () => {
                const key = "a";
                const owner = "b";
                const expiration = TimeSpan.fromMinutes(10).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExsitingOwner = "c";
                await adapter.removeIfOwner(context, key, noneExsitingOwner);

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    expiration,
                    owner,
                } satisfies ILockData);
            });
        });
        describe("method: updateExpiration", () => {
            test("Should return 0 when lock key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingKey = "b";
                const result1 = await adapter.updateExpiration(
                    context,
                    noneExistingKey,
                    owner,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when owner doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const noneExistingOwner = "b";
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    noneExistingOwner,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when lock is expired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return 0 when lock is unexpireable", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration,
                );

                expect(result1).toBe(0);
            });
            test("Should return number greater than 0 when lock is unexpired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50);

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(
                        context,
                        key,
                        owner,
                        expiration.toEndDate(),
                    );
                });

                const newExpiration = TimeSpan.fromMilliseconds(100);
                const result1 = await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration.toEndDate(),
                );

                expect(result1).toBeGreaterThan(0);
            });
            test("Should not update expiration when lock is expired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toStartDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration,
                );

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    owner,
                    expiration,
                } satisfies ILockData);
            });
            test("Should not update expiration when lock is unexpireable", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration,
                );

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    owner,
                    expiration,
                } satisfies ILockData);
            });
            test("Should update expiration when lock is unexpired", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMilliseconds(50).toEndDate();

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const newExpiration =
                    TimeSpan.fromMilliseconds(100).toEndDate();
                await adapter.updateExpiration(
                    context,
                    key,
                    owner,
                    newExpiration,
                );

                const lockData = await adapter.find(context, key);
                expect(lockData).toEqual({
                    owner,
                    expiration: newExpiration,
                } satisfies ILockData);
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = null;
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const noneExistingKey = "b";
                const result = await adapter.find(context, noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return ILockData when key exists", async () => {
                const key = "a";
                const owner = "1";
                const expiration = TimeSpan.fromMinutes(2).toEndDate();
                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, owner, expiration);
                });

                const result = await adapter.find(context, key);

                expect(result).toEqual({
                    owner,
                    expiration,
                } satisfies ILockData);
            });
        });
    });
}
