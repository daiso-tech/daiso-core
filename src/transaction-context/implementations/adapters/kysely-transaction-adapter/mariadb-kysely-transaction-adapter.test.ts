import { MariaDbContainer } from "@testcontainers/mariadb";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";

import type { StartedMariaDbContainer } from "@testcontainers/mariadb";
import type { Pool } from "mysql2";

type Database = {
    person: {
        id: number;
        name: string;
    };
};

const timeout = TimeSpan.fromMinutes(2);
describe("mariadb class: KyselyTransactionAdapter", () => {
    let container: StartedMariaDbContainer;
    let database: Pool;
    let kysely: Kysely<Database>;

    beforeEach(async () => {
        container = await new MariaDbContainer("mariadb:10.11").start();
        database = createPool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getUserPassword(),
            connectionLimit: 10,
        });
        kysely = new Kysely({
            dialect: new MysqlDialect({
                pool: database,
            }),
        });
        await kysely.schema
            .createTable("person")
            .addColumn("id", "integer", (column) => column.primaryKey())
            .addColumn("name", "varchar(255)", (column) => column.notNull())
            .execute();
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
        test("Should enforce a read only access mode", async () => {
            const adapter = new KyselyTransactionAdapter({
                database: kysely,
                accessMode: "read only",
                isolationLevel: "read committed",
            });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;
            if (transactionClient === null) {
                throw new Error("Expected a transaction client.");
            }

            const promise = transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();

            await expect(promise).rejects.toThrow();
            await transaction.abort();
        });
    });
});
