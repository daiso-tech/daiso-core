import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { type ISharedLock } from "@/shared-lock/contracts/_module.js";
import {
    KyselySharedLockAdapter,
    MemorySharedLockAdapter,
} from "@/shared-lock/implementations/adapters/_module.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module.js";
import { sharedLockFactoryTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";

describe("class: SharedLockFactory", () => {
    sharedLockFactoryTestSuite({
        createSharedLockFactory: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const sharedLockFactory = new SharedLockFactory({
                serde,
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                adapter: new MemorySharedLockAdapter(),
                namespace: new Namespace("shared-lock"),
            });
            return { sharedLockFactory, serde };
        },
        beforeEach,
        describe,
        expect,
        test,
        retry: 10,
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different namespaces", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLockFactory1 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                namespace: new Namespace("@lock-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/lock-1"),
                }),
                serde,
            });
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });
            await lock1.acquireWriter();

            const sharedLockFactory2 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                namespace: new Namespace("@lock-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/lock-2"),
                }),
                serde,
            });

            const lock2 = sharedLockFactory2.create(key, { ttl, limit });
            const deserializedLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(lock2),
            );
            const result = await deserializedLock2.acquireWriter();
            expect(result).toBe(true);
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/lock");
            const key = "a";
            const ttl = null;
            const limit = 4;

            const adapter1 = new MemorySharedLockAdapter();
            const sharedLockFactory1 = new SharedLockFactory({
                adapter: adapter1,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });
            await lock1.acquireWriter();

            const adapter2 = new KyselySharedLockAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database: new Sqlite(":memory:"),
                    }),
                }),
                shouldRemoveExpiredKeys: false,
            });
            await adapter2.init();
            const sharedLockFactory2 = new SharedLockFactory({
                adapter: adapter2,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });

            const lock2 = sharedLockFactory2.create(key, { ttl, limit });
            const deserializeLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/lock");
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLockFactory1 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });
            await lock1.acquireWriter();

            const sharedLockFactory2 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = sharedLockFactory2.create(key, { ttl, limit });
            const deserializeLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
    });
});
