import {
    type StartedMongoDBContainer,
    MongoDBContainer,
} from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    MongodbLockAdapter,
    type MongodbLockDocument,
} from "@/lock/implementations/adapters/mongodb-lock-adapter/mongodb-lock-adapter.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbLockAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

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
    lockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            return adapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: init", () => {
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db("database")
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection) => collection.name === "locks",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Expiration tests:", () => {
        test("Should set expiration field to null when given no expiration", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbLockDocument>(collectionName);
            const adapter = new MongodbLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = null;

            await adapter.acquire(noOpContext, key, lockId, ttl);

            const doc = await collection.findOne({
                key,
            });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbLockDocument>),
            );
        });
        test("Should set expiration field to Date when given expiration", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbLockDocument>(collectionName);
            const adapter = new MongodbLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = TimeSpan.fromMinutes(5);
            const expiration = ttl.toEndDate();

            await adapter.acquire(noOpContext, key, lockId, ttl);

            const doc = await collection.findOne({
                key,
            });
            expect(doc?.expiration?.getTime()).toBeLessThan(
                expiration.getTime() + 25,
            );
            expect(doc?.expiration?.getTime()).toBeGreaterThan(
                expiration.getTime() - 25,
            );
        });
    });
});
