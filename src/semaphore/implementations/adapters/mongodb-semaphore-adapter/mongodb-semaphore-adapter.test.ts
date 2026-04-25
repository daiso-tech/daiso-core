import {
    type StartedMongoDBContainer,
    MongoDBContainer,
} from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    MongodbSemaphoreAdapter,
    type MongodbSemaphoreDocument,
} from "@/semaphore/implementations/adapters/mongodb-semaphore-adapter/mongodb-semaphore-adapter.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbSemaphoreAdapter", () => {
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
    semaphoreAdapterTestSuite({
        createAdapter: async () => {
            const semaphoreAdapter = new MongodbSemaphoreAdapter({
                database: client.db("database"),
            });
            await semaphoreAdapter.init();
            return semaphoreAdapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: init", () => {
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbSemaphoreAdapter({
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
            const adapter = new MongodbSemaphoreAdapter({
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
                (collection_) => collection_.name === "locks",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbSemaphoreAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbSemaphoreAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Expiration tests:", () => {
        const noOpContext = new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        );
        test("Should set expiration to null when slot is unexpireable", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const slotId = "1";
            const ttl = null;
            const limit = 3;

            await adapter.acquire({
                context: noOpContext,
                key,
                ttl,
                slotId,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreDocument>),
            );
        });
        test("Should set expiration of the first acquired slot when slot is unexpired", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId = "1";
            const ttl = TimeSpan.fromMinutes(4);
            const expiration = ttl.toEndDate();
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl,
                slotId,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration,
                } satisfies Partial<MongodbSemaphoreDocument>),
            );
        });
        test("Should set expiration to null when first slot is unexpireable and seconds slot is unexpired", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = null;
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreDocument>),
            );
        });
        test("Should set expiration to null when first slot is unexpired and seconds slot is unexpireable", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = null;
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreDocument>),
            );
        });
        test("Should set expiration to longest expiration when first slot is unexpired and seconds slot is unexpired and has longest expiration", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(10);
            const expiration2 = ttl2.toEndDate();
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc?.expiration?.getTime()).toBeLessThan(
                expiration2.getTime() + 25,
            );
            expect(doc?.expiration?.getTime()).toBeGreaterThan(
                expiration2.getTime() - 25,
            );
        });
        test("Should set expiration to longest expiration when first slot is unexpired and has longest expiration and seconds slot is unexpired", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            const expiration1 = ttl1.toEndDate();
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc?.expiration?.getTime()).toBeLessThan(
                expiration1.getTime() + 25,
            );
            expect(doc?.expiration?.getTime()).toBeGreaterThan(
                expiration1.getTime() - 25,
            );
        });
        test("Should set expiration to less than current date when each slot is individually removed", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbSemaphoreDocument>(collectionName);
            const adapter = new MongodbSemaphoreAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                context: noOpContext,
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            await adapter.release(noOpContext, key, slotId1);
            await adapter.release(noOpContext, key, slotId2);

            const doc = await collection.findOne({ key });

            expect(doc?.expiration?.getTime()).toBeLessThan(Date.now());
        });
    });
});
