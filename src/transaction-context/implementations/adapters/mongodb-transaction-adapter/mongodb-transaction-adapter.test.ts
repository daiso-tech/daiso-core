import { MongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TimeSpan } from "@/time-span/implementations/_module.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/mongodb-transaction-adapter.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";
import type { TransactionOptions } from "mongodb";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbTransactionAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;

    beforeEach(async () => {
        startedContainer = await new MongoDBContainer("mongo:5.0.0").start();
        client = new MongoClient(startedContainer.getConnectionString(), {
            directConnection: true,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.close();
        await startedContainer.stop();
    }, timeout.toMilliseconds());

    describe("getter: client", () => {
        test("Should return the configured database", () => {
            const database = client.db("database");
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
            });

            expect(adapter.client).toBe(database);
        });
    });
    describe("method: start", () => {
        test("Should start a transaction on a new session", async () => {
            const database = client.db("database");
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }

            expect(session.inTransaction()).toBe(true);
            await transaction.abort();
        });
        test("Should persist the changes when the transaction is committed", async () => {
            const database = client.db("database");
            const collection = database.collection<{
                _id: string;
                value: string;
            }>("collection");
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }

            await collection.insertOne(
                { _id: "committed", value: "value" },
                { session },
            );
            await transaction.commit();

            await expect(
                collection.findOne({ _id: "committed" }),
            ).resolves.toEqual({ _id: "committed", value: "value" });
        });
        test("Should discard the changes when the transaction is aborted", async () => {
            const database = client.db("database");
            const collection = database.collection<{
                _id: string;
                value: string;
            }>("collection");
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }

            await collection.insertOne(
                { _id: "aborted", value: "value" },
                { session },
            );
            await transaction.abort();

            await expect(
                collection.findOne({ _id: "aborted" }),
            ).resolves.toBeNull();
        });
        test("Should start a transaction when session, transaction and timeout settings are provided", async () => {
            const adapter = new MongodbTransactionAdapter({
                client,
                database: client.db("database"),
                commitTimeout: TimeSpan.fromSeconds(30),
                abortTimeout: TimeSpan.fromSeconds(30),
                startSessionSettings: {},
                startTransactionSettings: {},
                endSessionSettings: {},
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }

            expect(session.inTransaction()).toBe(true);
            await transaction.abort();
        });
        test("Should forward the session, transaction, commit timeout and end-session settings to the underlying MongoDB client", async () => {
            const database = client.db("database");
            const startSessionSettings = { causalConsistency: false };
            const startTransactionSettings: TransactionOptions = {
                readConcern: { level: "local" },
            };
            const endSessionSettings = {};
            const commitTimeout = TimeSpan.fromSeconds(30);

            const originalStartSession = client.startSession.bind(client);
            const startTransactionCalls: Array<unknown> = [];
            const startSessionSpy = vi
                .spyOn(client, "startSession")
                .mockImplementation((options) => {
                    const session = originalStartSession(options);
                    const originalStartTransaction =
                        session.startTransaction.bind(session);
                    vi.spyOn(session, "startTransaction").mockImplementation(
                        (transactionOptions) => {
                            startTransactionCalls.push(transactionOptions);
                            originalStartTransaction(transactionOptions);
                        },
                    );
                    return session;
                });
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
                commitTimeout,
                startSessionSettings,
                startTransactionSettings,
                endSessionSettings,
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }
            const commitTransactionSpy = vi.spyOn(session, "commitTransaction");
            const endSessionSpy = vi.spyOn(session, "endSession");

            await transaction.commit();

            expect(startSessionSpy).toHaveBeenCalledWith(startSessionSettings);
            expect(startTransactionCalls).toEqual([startTransactionSettings]);
            expect(commitTransactionSpy).toHaveBeenCalledWith({
                timeoutMS: commitTimeout.toMilliseconds(),
            });
            expect(endSessionSpy).toHaveBeenCalledWith(endSessionSettings);
        });
        test("Should forward the abort timeout and end-session settings to the underlying MongoDB client", async () => {
            const database = client.db("database");
            const endSessionSettings = {};
            const abortTimeout = TimeSpan.fromSeconds(15);
            const adapter = new MongodbTransactionAdapter({
                client,
                database,
                abortTimeout,
                endSessionSettings,
            });

            const transaction = await adapter.start();
            const session = transaction.client;
            if (session === null) {
                throw new Error("Expected a transaction session.");
            }
            const abortTransactionSpy = vi.spyOn(session, "abortTransaction");
            const endSessionSpy = vi.spyOn(session, "endSession");

            await transaction.abort();

            expect(abortTransactionSpy).toHaveBeenCalledWith({
                timeoutMS: abortTimeout.toMilliseconds(),
            });
            expect(endSessionSpy).toHaveBeenCalledWith(endSessionSettings);
        });
    });
});
