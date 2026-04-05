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
    KyselySemaphoreAdapter,
    type KyselySemaphoreTables,
} from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import { databaseSemaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselySemaphoreAdapter", () => {
    let database: Pool;
    let container: StartedPostgreSqlContainer;
    let kysely: Kysely<KyselySemaphoreTables>;
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
    databaseSemaphoreAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySemaphoreAdapter({
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
        test("Should remove all expired keys", async () => {
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );
            const adapter = new KyselySemaphoreAdapter({
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
                await trx.upsertSemaphore(noOpContext, key1, limit);
                await trx.upsertSlot(noOpContext, key1, slotId1, expiration);
                await trx.upsertSlot(noOpContext, key1, slotId2, expiration);
                await trx.upsertSlot(noOpContext, key1, slotId3, expiration);

                await trx.upsertSemaphore(noOpContext, key2, limit);
                await trx.upsertSlot(noOpContext, key2, slotId1, expiration);
                await trx.upsertSlot(noOpContext, key2, slotId2, expiration);
                await trx.upsertSlot(noOpContext, key2, slotId3, expiration);
            });

            await adapter.removeAllExpired();

            const result1 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.findSemaphore(noOpContext, key1);
                },
            );
            expect(result1).toBeNull();

            const result2 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.findSlots(noOpContext, key1);
                },
            );
            expect(result2).toEqual([]);
            expect(result2.length).toBe(0);

            const result3 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.findSlots(noOpContext, key2);
                },
            );
            expect(result3).toEqual([]);
            expect(result3.length).toBe(0);

            const result4 = await adapter.transaction(
                noOpContext,
                async (trx) => {
                    return await trx.findSemaphore(noOpContext, key2);
                },
            );
            expect(result4).toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create semaphore table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphore",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining({
                            name: "limit",
                            dataType: "int4",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create semaphoreSlot table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphoreSlot",
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
                        expect.objectContaining({
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
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not setInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call setInterval when shouldRemoveExpiredKeys is true", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: true,
            });
            await adapter.init();

            expect(intervalFn).toHaveBeenCalledTimes(1);
            await adapter.deInit();
        });
    });
    describe("method: deInit", () => {
        test("Should remove semaphore table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphore",
                }),
            );
        });
        test("Should remove semaphoreSlot table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphoreSlot",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not clearInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselySemaphoreAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
            });
            await adapter.init();
            await adapter.deInit();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call clearInterval when shouldRemoveExpiredKeys is true", async () => {
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselySemaphoreAdapter({
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
