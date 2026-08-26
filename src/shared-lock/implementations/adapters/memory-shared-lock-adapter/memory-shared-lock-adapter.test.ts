import { beforeEach, describe, expect, test } from "vitest";

import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { MemorySharedLockData } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module.js";

describe("class: MemorySharedLockAdapter", () => {
    sharedLockAdapterTestSuite({
        createAdapter: () => new MemorySharedLockAdapter(new Map()),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireWriter(
                "expired",
                "1",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireWriter(
                "unexpired",
                "3",
                TimeSpan.fromMinutes(5).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireWriter("unexpireable", "2", null);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should remove expired reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireReader({
                key: "expired",
                lockId: "1",
                limit: 4,
                ttl: TimeSpan.fromMilliseconds(100).toEndDate(),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireReader({
                key: "unexpired",
                lockId: "2",
                limit: 4,
                ttl: TimeSpan.fromMinutes(5).toEndDate(),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireReader({
                key: "unexpireable",
                lockId: "3",
                limit: 4,
                ttl: null,
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any shared locks when none are expired", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireWriter("writer-unexpireable", "1", null);
            await adapter.acquireReader({
                key: "reader-unexpired",
                lockId: "1",
                limit: 4,
                ttl: TimeSpan.fromMinutes(5).toEndDate(),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("writer-unexpireable")).toBe(true);
            expect(map.has("reader-unexpired")).toBe(true);
        });
        test("Should remove expired reader slots and keep entry when unexpired slots remain", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireReader({
                key: "a",
                lockId: "expired",
                limit: 4,
                ttl: TimeSpan.fromMilliseconds(100).toEndDate(),
            });
            await adapter.acquireReader({
                key: "a",
                lockId: "unexpireable",
                limit: 4,
                ttl: null,
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            const entry = map.get("a");
            expect(entry?.readerSemaphore?.slots.has("expired")).toBe(false);
            expect(entry?.readerSemaphore?.slots.has("unexpireable")).toBe(
                true,
            );
        });
        test("Should do nothing when map is empty", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(0);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.acquireWriter("a", "1", null);
            await adapter.acquireWriter(
                "a",
                "2",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );
            await adapter.acquireWriter("b", "1", null);
            await adapter.acquireWriter(
                "b",
                "2",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await adapter.acquireReader({
                key: "c",
                lockId: "1",
                ttl: null,
                limit: 4,
            });
            await adapter.acquireReader({
                key: "d",
                lockId: "1",
                ttl: TimeSpan.fromMilliseconds(100).toEndDate(),
                limit: 4,
            });

            await adapter.acquireReader({
                key: "c",
                lockId: "1",
                ttl: null,
                limit: 4,
            });
            await adapter.acquireReader({
                key: "d",
                lockId: "1",
                ttl: TimeSpan.fromMilliseconds(100).toEndDate(),
                limit: 4,
            });

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
