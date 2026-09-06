import { MariaDbContainer } from "@testcontainers/mariadb";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselyRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMariaDbContainer } from "@testcontainers/mariadb";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselyRateLimiterStorageTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-storage-adapter/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mariadb class: KyselyRateLimiterStorageAdapter", () => {
    let database: Pool;
    let container: StartedMariaDbContainer;
    let kysely: Kysely<KyselyRateLimiterStorageTables>;

    beforeEach(async () => {
        container = await new MariaDbContainer("mariadb:10.11").start();
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
    rateLimiterStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
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
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await adapter.transaction(async (trx) => {
                await trx.upsert(
                    "a",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.upsert(
                    "b",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.upsert(
                    "c",
                    "owner",
                    TimeSpan.fromMilliseconds(50).toEndDate(),
                );
            });

            await adapter.removeAllExpired();

            expect(await adapter.find("a")).toBeNull();
            expect(await adapter.find("b")).toBeNull();
            expect(await adapter.find("c")).not.toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create rateLimiter table", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "rateLimiter",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "state",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "bigint",
                            isNullable: true,
                            // MariaDB reports the implicit `NULL` default of a nullable
                            // column as the literal string `'NULL'`, which Kysely's
                            // `MysqlIntrospector` reads as `hasDefaultValue: true`.
                            hasDefaultValue: true,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove rateLimiter table", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "rate-limiter",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
