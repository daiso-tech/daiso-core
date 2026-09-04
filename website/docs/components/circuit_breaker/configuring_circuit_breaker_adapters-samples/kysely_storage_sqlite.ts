import { TimeSpan } from "eridu-tech/time-span";
import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselyCircuitBreakerStorageAdapter =
    new KyselyCircuitBreakerStorageAdapter({
        kysely,
        serde,
    });

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
