import Sqlite, { type Database } from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { DatabaseSemaphoreAdapter } from "@/semaphore/implementations/derivables/semaphore-factory/database-semaphore-adapter.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";

describe("class: DatabaseSemaphoreAdapter", () => {
    let database: Database;
    beforeEach(() => {
        database = new Sqlite(":memory:");
    });
    afterEach(() => {
        database.close();
    });
    semaphoreAdapterTestSuite({
        createAdapter: async () => {
            const databaseSemaphoreAdapter = new KyselySemaphoreAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database,
                    }),
                }),
                shouldRemoveExpiredKeys: false,
            });
            await databaseSemaphoreAdapter.init();
            return new DatabaseSemaphoreAdapter(databaseSemaphoreAdapter);
        },
        test,
        beforeEach,
        expect,
        describe,
    });
});
