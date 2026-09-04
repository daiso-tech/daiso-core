import { DatabaseCircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storate-adapter";
import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storate-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const serde = new Serde(new SuperJsonSerdeAdapter());
const circuitBreakerFactoryResolver = new DatabaseCircuitBreakerFactoryResolver(
    {
        serde,
        adapters: {
            memory: new MemoryCircuitBreakerStorageAdapter(),
            sqlite: new KyselyCircuitBreakerStorageAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database: new Sqlite("local.db"),
                    }),
                }),
                serde,
            }),
        },
        defaultAdapter: "memory",
    },
);

// Will apply circuit-breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });

// Will apply circuit-breaker logic using the KyselyCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
