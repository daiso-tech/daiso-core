import { beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { ISemaphoreAdapterState } from "@/semaphore/contracts/_module.js";

describe("class: MemorySemaphoreAdapter", () => {
    semaphoreAdapterTestSuite({
        createAdapter: () => new MemorySemaphoreAdapter(new Map()),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "expired",
                slotId: "1",
                limit: 4,
                ttl: TimeSpan.fromMilliseconds(100),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "unexpired",
                slotId: "1",
                limit: 4,
                ttl: TimeSpan.fromMinutes(5),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "unexpireable",
                slotId: "1",
                limit: 4,
                ttl: null,
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any semaphore data when none slots are expired", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "unexpireable",
                slotId: "1",
                limit: 4,
                ttl: null,
            });
            await adapter.acquire({
                context: noOpContext,
                key: "unexpired",
                slotId: "1",
                limit: 4,
                ttl: TimeSpan.fromMinutes(5),
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("unexpireable")).toBe(true);
            expect(map.has("unexpired")).toBe(true);
        });
        test("Should remove expired slots and keep entry when unexpired slots remain", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "a",
                slotId: "expired",
                limit: 4,
                ttl: TimeSpan.fromMilliseconds(100),
            });
            await adapter.acquire({
                context: noOpContext,
                key: "a",
                slotId: "unexpireable",
                limit: 4,
                ttl: null,
            });

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            const entry = map.get("a");
            expect(entry?.acquiredSlots.has("expired")).toBe(false);
            expect(entry?.acquiredSlots.has("unexpireable")).toBe(true);
        });
        test("Should do nothing when map is empty", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(0);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.acquire({
                context: noOpContext,
                key: "a",
                slotId: "1",
                limit: 4,
                ttl: null,
            });
            await adapter.acquire({
                context: noOpContext,
                key: "b",
                slotId: "1",
                limit: 4,
                ttl: null,
            });

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
