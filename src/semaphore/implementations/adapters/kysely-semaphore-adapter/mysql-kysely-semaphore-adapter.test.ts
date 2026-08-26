/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MySqlContainer } from "@testcontainers/mysql";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mysql class: KyselySemaphoreAdapter", () => {
    let database: Pool;
    let container: StartedMySqlContainer;
    let kysely: Kysely<KyselySemaphoreTables>;
    beforeEach(async () => {
        container = await new MySqlContainer("mysql:9.3.0").start();
        database = createPool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getUserPassword(),
            connectionLimit: 10,
        });
        kysely = new Kysely({
            dialect: new MysqlDialect({
                pool: database,
            }),
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await new Promise<void>((resolve, reject) => {
            database.end((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
        await container.stop();
    }, timeout.toMilliseconds());
    semaphoreAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySemaphoreAdapter({
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
        test("Should remove all expired keys", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
            });
            await adapter.init();

            const limit = 3;
            const expiredTtl = TimeSpan.fromMilliseconds(-1);
            const key1 = "1";
            const key2 = "2";

            await adapter.acquire({
                key: key1,
                slotId: "1",
                limit,
                ttl: expiredTtl.toEndDate(),
            });
            await adapter.acquire({
                key: key1,
                slotId: "2",
                limit,
                ttl: expiredTtl.toEndDate(),
            });
            await adapter.acquire({
                key: key1,
                slotId: "3",
                limit,
                ttl: expiredTtl.toEndDate(),
            });

            await adapter.acquire({
                key: key2,
                slotId: "1",
                limit,
                ttl: expiredTtl.toEndDate(),
            });
            await adapter.acquire({
                key: key2,
                slotId: "2",
                limit,
                ttl: expiredTtl.toEndDate(),
            });
            await adapter.acquire({
                key: key2,
                slotId: "3",
                limit,
                ttl: expiredTtl.toEndDate(),
            });

            await adapter.removeAllExpired();

            expect(await adapter.getState(key1)).toBeNull();
            expect(await adapter.getState(key2)).toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create semaphore table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphore",
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining({
                            name: "limit",
                            dataType: "int",
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
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphoreSlot",
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
                            dataType: "bigint",
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
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove semaphore table", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
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
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySemaphoreAdapter({
                kysely,
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
