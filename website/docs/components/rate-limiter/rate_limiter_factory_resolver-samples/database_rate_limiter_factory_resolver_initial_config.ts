import { DatabaseRateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storate-adapter";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storate-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const serde = new Serde(new SuperJsonSerdeAdapter());
const rateLimiterFactoryResolver = new DatabaseRateLimiterFactoryResolver({
    serde,
    adapters: {
        memory: new MemoryRateLimiterStorageAdapter(),
        sqlite: new KyselyRateLimiterStorageAdapter({
            kysely: new Kysely({
                dialect: new SqliteDialect({
                    database: new Sqlite("local.db"),
                }),
            }),
            serde,
        }),
    },
    defaultAdapter: "memory",
});

// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

// Will apply rate-limiter logic using the KyselyRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
