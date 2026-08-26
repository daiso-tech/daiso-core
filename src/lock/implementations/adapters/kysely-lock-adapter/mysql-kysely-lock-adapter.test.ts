import { MySqlContainer } from "@testcontainers/mysql";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselyLockAdapter } from "@/lock/implementations/adapters/kysely-lock-adapter/_module.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselyLockTables } from "@/lock/implementations/adapters/kysely-lock-adapter/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mysql class: KyselyLockAdapter", () => {
    let database: Pool;
    let container: StartedMySqlContainer;
    let kysely: Kysely<KyselyLockTables>;

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
    lockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyLockAdapter({
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
            const adapter = new KyselyLockAdapter({
                kysely,
            });
            await adapter.init();

            await adapter.acquire(
                "a",
                "owner",
                TimeSpan.fromMilliseconds(-1).toEndDate(),
            );
            await adapter.acquire(
                "b",
                "owner",
                TimeSpan.fromMilliseconds(-1).toEndDate(),
            );
            await adapter.acquire(
                "c",
                "owner",
                TimeSpan.fromMinutes(5).toEndDate(),
            );

            await adapter.removeAllExpired();

            expect(await adapter.getState("a")).toBeNull();
            expect(await adapter.getState("b")).toBeNull();
            expect(await adapter.getState("c")).not.toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create lock table", async () => {
            const adapter = new KyselyLockAdapter({
                kysely,
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "lock",
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
                            dataType: "bigint",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyLockAdapter({
                kysely,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove lock table", async () => {
            const adapter = new KyselyLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "lock",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyLockAdapter({
                kysely,
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyLockAdapter({
                kysely,
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
