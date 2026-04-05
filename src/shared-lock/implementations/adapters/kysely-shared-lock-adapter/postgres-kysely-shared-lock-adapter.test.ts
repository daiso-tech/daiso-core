import {
    type StartedPostgreSqlContainer,
    PostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
    Kysely,
    PostgresDialect,
    type ColumnMetadata,
    type TableMetadata,
} from "kysely";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    KyselySharedLockAdapter,
    type KyselySharedLockTables,
} from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module.js";
import { databaseSharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselySharedLockAdapter", () => {
    let database: Pool;
    let container: StartedPostgreSqlContainer;
    let kysely: Kysely<KyselySharedLockTables>;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

    beforeEach(async () => {
        container = await new PostgreSqlContainer("postgres:17.5").start();
        database = new Pool({
            database: container.getDatabase(),
            host: container.getHost(),
            user: container.getUsername(),
            port: container.getPort(),
            password: container.getPassword(),
            max: 10,
        });
        kysely = new Kysely({
            dialect: new PostgresDialect({
                pool: database,
            }),
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await database.end();
        await container.stop();
    }, timeout.toMilliseconds());
    databaseSharedLockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            return adapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove all expired writer locks", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            await adapter.transaction(noOpContext, async (trx) => {
                await trx.writer.upsert(
                    noOpContext,
                    "a",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.writer.upsert(
                    noOpContext,
                    "b",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.writer.upsert(
                    noOpContext,
                    "c",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toEndDate(),
                );
            });

            await adapter.removeAllExpired();

            expect(
                await adapter.transaction(noOpContext, async (trx) => {
                    return trx.writer.find(noOpContext, "a");
                }),
            ).toBeNull();
            expect(
                await adapter.transaction(noOpContext, async (trx) => {
                    return trx.writer.find(noOpContext, "b");
                }),
            ).toBeNull();
            expect(
                await adapter.transaction(noOpContext, async (trx) => {
                    return trx.writer.find(noOpContext, "c");
                }),
            ).not.toBeNull();
        });
        test("Should remove all expired reader semaphores", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const limit = 3;
            const expiration = TimeSpan.fromMinutes(2).toStartDate();
            const key1 = "1";
            const key2 = "1";
            const slotId1 = "1";
            const slotId2 = "2";
            const slotId3 = "3";

            await adapter.transaction(noOpContext, async (trx) => {
                await trx.reader.upsertSemaphore(noOpContext, key1, limit);
                await trx.reader.upsertSlot(
                    noOpContext,
                    key1,
                    slotId1,
                    expiration,
                );
                await trx.reader.upsertSlot(
                    noOpContext,
                    key1,
                    slotId2,
                    expiration,
                );
                await trx.reader.upsertSlot(
                    noOpContext,
                    key1,
                    slotId3,
                    expiration,
                );

                await trx.reader.upsertSemaphore(noOpContext, key2, limit);
                await trx.reader.upsertSlot(
                    noOpContext,
                    key2,
                    slotId1,
                    expiration,
                );
                await trx.reader.upsertSlot(
                    noOpContext,
                    key2,
                    slotId2,
                    expiration,
                );
                await trx.reader.upsertSlot(
                    noOpContext,
                    key2,
                    slotId3,
                    expiration,
                );
            });

            await adapter.removeAllExpired();

            const result1 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.reader.findSemaphore(noOpContext, key1);
                },
            );
            expect(result1).toBeNull();

            const result2 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.reader.findSlots(noOpContext, key1);
                },
            );
            expect(result2).toEqual([]);
            expect(result2.length).toBe(0);

            const result3 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.reader.findSlots(noOpContext, key2);
                },
            );
            expect(result3).toEqual([]);
            expect(result3.length).toBe(0);

            const result4 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.reader.findSemaphore(noOpContext, key2);
                },
            );
            expect(result4).toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create writerLock table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLock",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "owner",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "int8",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphore table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphore",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "limit",
                            dataType: "int4",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphoreSlot table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlot",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "id",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "int8",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not setInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call setInterval when shouldRemoveExpiredKeys is true", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: true,
            });
            await adapter.init();

            expect(intervalFn).toHaveBeenCalledTimes(1);
            await adapter.deInit();
        });
    });
    describe("method: deInit", () => {
        test("Should remove writer lock table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLock",
                }),
            );
        });
        test("Should remove readerSemaphore table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphore",
                }),
            );
        });
        test("Should remove readerSemaphoreSlot table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlot",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not clearInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call clearInterval when shouldRemoveExpiredKeys is true", async () => {
            vi.useFakeTimers();
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselySharedLockAdapter({
                kysely,
                shouldRemoveExpiredKeys: true,
            });
            await adapter.init();
            await adapter.deInit();

            expect(intervalFn).toHaveBeenCalledTimes(1);
            await adapter.deInit();
        });
    });
});
