import {
    DummyDriver,
    Kysely,
    SqliteAdapter,
    SqliteIntrospector,
    SqliteQueryCompiler,
} from "kysely";
import { MongoClient } from "mongodb";
import { describe, expect, test } from "vitest";

import { isTransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/is-transaction-context.js";
import { callInvocable } from "@/utilities/_module.js";

import type {
    ITransactionContext,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module.js";
import type { AsyncLazy } from "@/utilities/_module.js";

describe("function: isTransactionContext", () => {
    test("Should return false for a Kysely instance", () => {
        const kysely = new Kysely({
            dialect: {
                createAdapter: () => new SqliteAdapter(),
                createDriver: () => new DummyDriver(),
                createIntrospector: (database) =>
                    new SqliteIntrospector(database),
                createQueryCompiler: () => new SqliteQueryCompiler(),
            },
        });

        expect(isTransactionContext(kysely)).toBe(false);
    });
    test("Should return false for a MongoDB database instance", () => {
        const client = new MongoClient("mongodb://localhost:27017");
        const database = client.db("database");

        expect(isTransactionContext(database)).toBe(false);
    });
    test("Should return true for an ITransactionContext instance", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        const transactionContext: ITransactionContext<{}, {}> = {
            client: {},
            isInTransaction: false,
            transaction: null,
            current: {},
            getTransactionOrFail: () => ({}),
            run: async <TValue>(
                _propagation: TransactionPropagation,
                asyncInvocable: AsyncLazy<TValue>,
            ): Promise<TValue> => {
                return callInvocable(asyncInvocable);
            },
        };

        expect(isTransactionContext(transactionContext)).toBe(true);
    });
});
