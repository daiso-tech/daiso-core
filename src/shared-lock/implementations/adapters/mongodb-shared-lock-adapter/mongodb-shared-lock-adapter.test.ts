import {
    type StartedMongoDBContainer,
    MongoDBContainer,
} from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    MongodbSharedLockAdapter,
    type MongodbSharedLockDocument,
} from "@/shared-lock/implementations/adapters/mongodb-shared-lock-adapter/mongodb-shared-lock-adapter.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbSharedLockAdapter", () => {
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
    sharedLockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbSharedLockAdapter({
                database: client.db("database"),
                collectionName: "shared-locks",
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
            const adapter = new MongodbSharedLockAdapter({
                database: client.db("database"),
                collectionName: "shared-locks",
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const adapter = new MongodbSharedLockAdapter({
                database: client.db("database"),
                collectionName: "shared-locks",
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db("database")
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection) => collection.name === "semaphores",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbSharedLockAdapter({
                database: client.db("database"),
                collectionName: "shared-locks",
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbSharedLockAdapter({
                database: client.db("database"),
                collectionName: "shared-locks",
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Writer expiration tests:", () => {
        test("Should set expiration field to null when given no expiration", async () => {
            const database = client.db("database");
            const collectionName = "shared-locks";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = null;

            await adapter.acquireWriter(noOpContext, key, lockId, ttl);

            const doc = await collection.findOne({
                key,
            });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSharedLockDocument>),
            );
        });
        test("Should set expiration field to Date when given expiration", async () => {
            const database = client.db("database");
            const collectionName = "shared-locks";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = TimeSpan.fromMinutes(5);
            const expiration = ttl.toEndDate();

            await adapter.acquireWriter(noOpContext, key, lockId, ttl);

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
    describe("Reader expiration tests:", () => {
        test("Should set expiration to null when slot is unexpireable", async () => {
            const database = client.db("database");
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const lockId = "1";
            const ttl = null;
            const limit = 3;

            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl,
                lockId,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSharedLockDocument>),
            );
        });
        test("Should set expiration of the first acquired slot when slot is unexpired", async () => {
            const database = client.db("database");
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId = "1";
            const ttl = TimeSpan.fromMinutes(4);
            const expiration = ttl.toEndDate();
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl,
                lockId,
                limit,
            });

            const doc = await collection.findOne({ key });
            expect(doc?.expiration?.getTime()).toBeLessThan(
                expiration.getTime() + 25,
            );
            expect(doc?.expiration?.getTime()).toBeGreaterThan(
                expiration.getTime() - 25,
            );
        });
        test("Should set expiration to null when first slot is unexpireable and seconds slot is unexpired", async () => {
            const database = client.db("database");
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId1 = "1";
            const ttl1 = null;
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl1,
                lockId: lockId1,
                limit,
            });

            const lockId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl2,
                lockId: lockId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSharedLockDocument>),
            );
        });
        test("Should set expiration to null when first slot is unexpired and seconds slot is unexpireable", async () => {
            const database = client.db("database");
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl1,
                lockId: lockId1,
                limit,
            });

            const lockId2 = "2";
            const ttl2 = null;
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl2,
                lockId: lockId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSharedLockDocument>),
            );
        });
        test("Should set expiration to longest expiration when first slot is unexpired and seconds slot is unexpired and has longest expiration", async () => {
            const database = client.db("database");
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl1,
                lockId: lockId1,
                limit,
            });

            const lockId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(10);
            const expiration2 = ttl2.toEndDate();
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl2,
                lockId: lockId2,
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
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            const expiration1 = ttl1.toEndDate();
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl1,
                lockId: lockId1,
                limit,
            });

            const lockId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl2,
                lockId: lockId2,
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
            const collectionName = "semaphores";
            const collection =
                database.collection<MongodbSharedLockDocument>(collectionName);
            const adapter = new MongodbSharedLockAdapter({
                database,
                collectionName,
            });

            const key = "a";
            const limit = 3;

            const lockId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl1,
                lockId: lockId1,
                limit,
            });

            const lockId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquireReader({
                context: noOpContext,
                key,
                ttl: ttl2,
                lockId: lockId2,
                limit,
            });

            await adapter.releaseReader(noOpContext, key, lockId1);
            await adapter.releaseReader(noOpContext, key, lockId2);

            const doc = await collection.findOne({ key });
            expect(doc?.expiration?.getTime()).toBeLessThan(Date.now());
        });
    });
});
