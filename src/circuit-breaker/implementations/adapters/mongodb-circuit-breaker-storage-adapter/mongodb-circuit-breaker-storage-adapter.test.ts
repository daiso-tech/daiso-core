import { type StartedMongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { describe, test, expect, beforeEach, afterEach } from "vitest";

import { MongodbCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-storage-adapter/mongodb-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { startMongoReplicaSet } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbCircuitBreakerStorageAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;
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

    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                database: client.db("database"),
                collectionName: "circuitBreakers",
                client,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        beforeEach,
        describe,
        test,
        expect,
    });
    describe("method: init", () => {
        test("Should not throw error when called multiple times", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                database: client.db(databaseName),
                collectionName,
                client,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                database: client.db(databaseName),
                collectionName,
                client,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db(databaseName)
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection_) => collection_.name === "circuitBreakers",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                database: client.db(databaseName),
                collectionName,
                client,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                database: client.db(databaseName),
                collectionName,
                client,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
