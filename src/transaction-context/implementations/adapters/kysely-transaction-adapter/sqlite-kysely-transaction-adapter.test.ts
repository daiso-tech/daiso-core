import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";

import type { Database as SqliteDatabase } from "better-sqlite3";

type Database = {
    person: {
        id: number;
        name: string;
    };
};

describe("sqlite class: KyselyTransactionAdapter", () => {
    let database: SqliteDatabase;
    let kysely: Kysely<Database>;

    beforeEach(async () => {
        database = new Sqlite(":memory:");
        kysely = new Kysely({
            dialect: new SqliteDialect({
                database,
            }),
        });
        await kysely.schema
            .createTable("person")
            .addColumn("id", "integer", (column) => column.primaryKey())
            .addColumn("name", "varchar(255)", (column) => column.notNull())
            .execute();
    });
    afterEach(() => {
        database.close();
    });

    describe("getter: client", () => {
        test("Should return the configured Kysely client", () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });

            expect(adapter.client).toBe(kysely);
        });
    });
    describe("method: start", () => {
        test("Should persist the changes when the transaction is committed", async () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;
            if (transactionClient === null) {
                throw new Error("Expected a transaction client.");
            }

            await transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();
            await transaction.commit();

            const persons = await kysely
                .selectFrom("person")
                .selectAll()
                .execute();

            expect(persons).toEqual([{ id: 1, name: "eridu" }]);
        });
        test("Should discard the changes when the transaction is aborted", async () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;
            if (transactionClient === null) {
                throw new Error("Expected a transaction client.");
            }

            await transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();
            await transaction.abort();

            const persons = await kysely
                .selectFrom("person")
                .selectAll()
                .execute();

            expect(persons).toEqual([]);
        });
    });
});
