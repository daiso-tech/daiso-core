import Sqlite, { type Database } from "better-sqlite3";
import {
    Kysely,
    SqliteDialect,
    type ColumnMetadata,
    type TableMetadata,
} from "kysely";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    KyselyRateLimiterStorageAdapter,
    type KyselyRateLimiterStorageTables,
} from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("sqlite class: KyselyRateLimiterStorageAdapter", () => {
    let database: Database;
    let kysely: Kysely<KyselyRateLimiterStorageTables>;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

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
    rateLimiterStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
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
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await adapter.transaction(noOpContext, async (trx) => {
                await trx.upsert(
                    noOpContext,
                    "a",
                    "state",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.upsert(
                    noOpContext,
                    "b",
                    "state",
                    TimeSpan.fromMilliseconds(50).toStartDate(),
                );
                await trx.upsert(
                    noOpContext,
                    "c",
                    "state",
                    TimeSpan.fromMilliseconds(50).toEndDate(),
                );
            });

            await adapter.removeAllExpired();

            expect(await adapter.find(noOpContext, "a")).toBeNull();
            expect(await adapter.find(noOpContext, "b")).toBeNull();
            expect(await adapter.find(noOpContext, "c")).not.toBeNull();
        });
    });
    describe("method: init", () => {
        test("Should create rateLimiter table", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
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
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not setInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call setInterval when shouldRemoveExpiredKeys is true", async () => {
            const intervalFn = vi.spyOn(globalThis, "setInterval");

            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: true,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            expect(intervalFn).toHaveBeenCalledTimes(1);
            await adapter.deInit();
        });
    });
    describe("method: deInit", () => {
        test("Should remove rateLimiter table", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "rateLimiter",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
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
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should call not clearInterval when shouldRemoveExpiredKeys is false", async () => {
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: false,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            expect(intervalFn).not.toHaveBeenCalledTimes(1);
        });
        test("Should call clearInterval when shouldRemoveExpiredKeys is true", async () => {
            vi.useFakeTimers();
            const intervalFn = vi.spyOn(globalThis, "clearInterval");

            const adapter = new KyselyRateLimiterStorageAdapter({
                kysely,
                shouldRemoveExpiredKeys: true,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            expect(intervalFn).toHaveBeenCalledTimes(1);
            await adapter.deInit();
        });
    });
});
