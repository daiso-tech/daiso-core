import { TimeSpan } from "eridu-tech/time-span";
import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const serde = new Serde(new SuperJsonSerdeAdapter());
const kyselyCacheAdapter = new KyselyCacheAdapter({
    kysely,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCacheAdapter.init();
