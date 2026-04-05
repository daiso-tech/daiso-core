import {
    MongoDBContainer,
    type StartedMongoDBContainer,
} from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
    MongodbRateLimiterStorageAdapter,
    type MongodbRateLimiterDocument,
} from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbRateLimiterStorageAdapter", () => {
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
                (collection) => collection.name === "rateLimiter",
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

            await adapter.transaction(async (trx) => {
                await trx.upsert(key, state, ttl);
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

            await adapter.transaction(async (trx) => {
                await trx.upsert(key, state, expiration);
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
