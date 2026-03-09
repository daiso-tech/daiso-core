import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { type ISemaphore } from "@/semaphore/contracts/_module.js";
import {
    MemorySemaphoreAdapter,
    KyselySemaphoreAdapter,
} from "@/semaphore/implementations/adapters/_module.js";
import { SemaphoreProvider } from "@/semaphore/implementations/derivables/_module.js";
import { semaphoreProviderTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";

describe("class: SemaphoreProvider", () => {
    semaphoreProviderTestSuite({
        createSemaphoreProvider: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const semaphoreProvider = new SemaphoreProvider({
                serde,
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                adapter: new MemorySemaphoreAdapter(),
                namespace: new Namespace("semaphore"),
            });
            return {
                semaphoreProvider,
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
            const limit = 1;

            const lockProvider1 = new SemaphoreProvider({
                adapter: new MemorySemaphoreAdapter(),
                namespace: new Namespace("@lock-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/semaphore-1"),
                }),
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl, limit });
            await lock1.acquire();

            const lockProvider2 = new SemaphoreProvider({
                adapter: new MemorySemaphoreAdapter(),
                namespace: new Namespace("@lock-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/semaphore-2"),
                }),
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl, limit });
            const deserializedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(lock2),
            );
            const result = await deserializedSemaphore2.acquire();
            expect(result).toBe(true);
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/semaphore");
            const key = "a";
            const ttl = null;
            const limit = 1;

            const adapter1 = new MemorySemaphoreAdapter();
            const lockProvider1 = new SemaphoreProvider({
                adapter: adapter1,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl, limit });
            await lock1.acquire();

            const adapter2 = new KyselySemaphoreAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database: new Sqlite(":memory:"),
                    }),
                }),
                shouldRemoveExpiredKeys: false,
            });
            await adapter2.init();
            const lockProvider2 = new SemaphoreProvider({
                adapter: adapter2,
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl, limit });
            const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const lockNamespace = new Namespace("@lock");
            const eventNamespace = new Namespace("@event-bus/semaphore");
            const key = "a";
            const ttl = null;
            const limit = 1;

            const lockProvider1 = new SemaphoreProvider({
                adapter: new MemorySemaphoreAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl, limit });
            await lock1.acquire();

            const lockProvider2 = new SemaphoreProvider({
                adapter: new MemorySemaphoreAdapter(),
                namespace: lockNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl, limit });
            const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
    });
});
