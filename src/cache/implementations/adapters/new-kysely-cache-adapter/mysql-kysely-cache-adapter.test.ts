import { MySqlContainer } from "@testcontainers/mysql";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselyCacheAdapter } from "@/cache/implementations/adapters/new-kysely-cache-adapter/_module.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";
import type { Pool } from "mysql2";

const timeout = TimeSpan.fromMinutes(2);
describe("new mysql class: KyselyCacheAdapter", () => {
    let database: Pool;
    let container: StartedMySqlContainer;
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
    cacheAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyCacheAdapter({
                kysely: new Kysely({
                    dialect: new MysqlDialect({
                        pool: database,
                    }),
                }),
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
});
