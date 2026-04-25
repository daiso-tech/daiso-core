import { type StartedMongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    MongodbRateLimiterStorageAdapter,
    type MongodbRateLimiterDocument,
} from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { startMongoReplicaSet } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbRateLimiterStorageAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

    beforeEach(async () => {
        const { container, uri } = await startMongoReplicaSet();
        startedContainer = container;
        client = new MongoClient(uri, {
            directConnection: true,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.close();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    rateLimiterStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
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
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db("database")
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection_) => collection_.name === "rateLimiter",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Expiration tests:", () => {
        test("Should set expiration field to null when given no expiration", async () => {
            const database = client.db("database");
            const collectionName = "rateLimiter";
            const collection =
                database.collection<MongodbRateLimiterDocument>(collectionName);
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const key = "a";
            const state = "1";
            const ttl = TimeSpan.fromSeconds(1).toEndDate();

            await adapter.transaction(noOpContext, async (trx) => {
                await trx.upsert(noOpContext, key, state, ttl);
            });

            const doc = await collection.findOne({
                key,
            });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: ttl,
                } satisfies Partial<MongodbRateLimiterDocument>),
            );
        });
        test("Should set expiration field to Date when given expiration", async () => {
            const database = client.db("database");
            const collectionName = "rateLimiter";
            const collection =
                database.collection<MongodbRateLimiterDocument>(collectionName);
            const adapter = new MongodbRateLimiterStorageAdapter({
                client,
                database: client.db("database"),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const key = "a";
            const state = "1";
            const ttl = TimeSpan.fromMinutes(5);
            const expiration = ttl.toEndDate();

            await adapter.transaction(noOpContext, async (trx) => {
                await trx.upsert(noOpContext, key, state, expiration);
            });

            const doc = await collection.findOne({
                key,
            });
            expect(doc?.expiration.getTime()).toBeLessThan(
                expiration.getTime() + 25,
            );
            expect(doc?.expiration.getTime()).toBeGreaterThan(
                expiration.getTime() - 25,
            );
        });
    });
});
