import Sqlite, { type Database } from "better-sqlite3";
import {
    Kysely,
    SqliteDialect,
    type ColumnMetadata,
    type TableMetadata,
} from "kysely";
import { describe, test, expect, beforeEach, afterEach } from "vitest";

import {
    KyselyCircuitBreakerStorageAdapter,
    type KyselyCircuitBreakerStorageTables,
} from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-storage-adapter/kysely-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";

describe("sqlite class: KyselyCircuitBreakerStorageAdapter", () => {
    let database: Database;
    let kysely: Kysely<KyselyCircuitBreakerStorageTables>;

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

    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        beforeEach,
        describe,
        test,
        expect,
    });
    describe("method: init", () => {
        test("Should create lock table", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "circuitBreaker",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "state",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove circuit breaker table", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "circuitBreaker",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                kysely,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
