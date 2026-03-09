import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type ILock } from "@/lock/contracts/lock.contract.js";
import {
    KyselyLockAdapter,
    MemoryLockAdapter,
} from "@/lock/implementations/adapters/_module.js";
import { LockProvider } from "@/lock/implementations/derivables/_module.js";
import { lockProviderTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";

describe("class: LockProvider", () => {
    lockProviderTestSuite({
        createLockProvider: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockProvider = new LockProvider({
                serde,
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                adapter: new MemoryLockAdapter(),
                namespace: new Namespace("lock"),
            });
            return {
                lockProvider,
                serde,
            };
        },
        beforeEach,
        describe,
        expect,
        test,
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different namespaces", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const ttl = null;

            const lockProvider1 = new LockProvider({
                adapter: new MemoryLockAdapter(),
                namespace: new Namespace("@lock-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/lock-1"),
                }),
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl });
            await lock1.acquire();

            const lockProvider2 = new LockProvider({
                adapter: new MemoryLockAdapter(),
                namespace: new Namespace("@lock-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/lock-2"),
                }),
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl });
            const deserializedLock2 = serde.deserialize<ILock>(
                serde.serialize(lock2),
            );
            const result = await deserializedLock2.acquire();
            expect(result).toBe(true);
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/lock");
            const key = "a";
            const ttl = null;

            const adapter1 = new MemoryLockAdapter();
            const lockProvider1 = new LockProvider({
                adapter: adapter1,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl });
            await lock1.acquire();

            const adapter2 = new KyselyLockAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database: new Sqlite(":memory:"),
                    }),
                }),
                shouldRemoveExpiredKeys: false,
            });
            await adapter2.init();
            const lockProvider2 = new LockProvider({
                adapter: adapter2,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl });
            const deserializeLock2 = serde.deserialize<ILock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquire();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/lock");
            const key = "a";
            const ttl = null;

            const lockProvider1 = new LockProvider({
                adapter: new MemoryLockAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl });
            await lock1.acquire();

            const lockProvider2 = new LockProvider({
                adapter: new MemoryLockAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl });
            const deserializeLock2 = serde.deserialize<ILock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquire();

            expect(result).toBe(true);
        });
    });
});
