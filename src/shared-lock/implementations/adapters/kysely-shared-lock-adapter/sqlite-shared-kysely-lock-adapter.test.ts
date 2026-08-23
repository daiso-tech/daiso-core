import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselySharedLockAdapter } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselySharedLockTables } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module.js";

describe("sqlite class: KyselySharedLockAdapter", () => {
    let database: Database;
    let kysely: Kysely<KyselySharedLockTables>;

    beforeEach(() => {
        database = new Sqlite(":memory:");
        kysely = new Kysely({
            dialect: new SqliteDialect({
                database,
            }),
        });
    });
    afterEach(() => {
        database.close();
    });
    sharedLockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
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
            });
            await adapter.init();

            await kysely
                .insertInto("writerLockEntry")
                .values({
                    key: "a",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await kysely
                .insertInto("writerLockEntry")
                .values({
                    key: "b",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await kysely
                .insertInto("writerLockEntry")
                .values({
                    key: "c",
                    owner: "owner",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await kysely
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await kysely
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await kysely
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
        test("Should remove all expired reader semaphores", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();

            const limit = 3;
            const key1 = "1";
            const key2 = "2";

            await kysely
                .insertInto("readerSemaphoreEntry")
                .values({ key: key1, limit })
                .execute();
            await kysely
                .insertInto("readerSemaphoreEntry")
                .values({ key: key2, limit })
                .execute();

            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key1, id: "1", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key1, id: "2", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key1, id: "3", expiration: Date.now() - 1000 })
                .execute();

            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key2, id: "4", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key2, id: "5", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlotEntry")
                .values({ key: key2, id: "6", expiration: Date.now() - 1000 })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await kysely
                    .selectFrom("readerSemaphoreEntry")
                    .where("readerSemaphoreEntry.key", "=", key1)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();

            expect(
                await kysely
                    .selectFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key1)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await kysely
                    .selectFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key2)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await kysely
                    .selectFrom("readerSemaphoreEntry")
                    .where("readerSemaphoreEntry.key", "=", key2)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
        });
    });
    describe("method: init", () => {
        test("Should create writerLockEntry table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLockEntry",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "owner",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "bigint",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphoreEntry table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreEntry",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "limit",
                            dataType: "INTEGER",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphoreSlotEntry table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlotEntry",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "id",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "bigint",
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
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove writer lock table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLockEntry",
                }),
            );
        });
        test("Should remove readerSemaphoreEntry table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreEntry",
                }),
            );
        });
        test("Should remove readerSemaphoreSlotEntry table", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlotEntry",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySharedLockAdapter({
                kysely,
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
