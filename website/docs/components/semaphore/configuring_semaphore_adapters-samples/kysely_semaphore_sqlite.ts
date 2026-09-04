import { TimeSpan } from "eridu-tech/time-span";
import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
