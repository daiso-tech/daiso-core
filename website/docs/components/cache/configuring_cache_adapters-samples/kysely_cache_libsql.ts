import { TimeSpan } from "eridu-tech/time-span";
import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
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
