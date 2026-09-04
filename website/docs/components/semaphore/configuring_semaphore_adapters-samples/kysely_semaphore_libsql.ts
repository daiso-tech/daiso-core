import { TimeSpan } from "eridu-tech/time-span";
import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
