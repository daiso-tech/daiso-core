import { beforeEach, describe, expect, test } from "vitest";

import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { ILockAdapterState } from "@/lock/contracts/_module.js";

describe("class: MemoryLockAdapter", () => {
    lockAdapterTestSuite({
        createAdapter: () => new MemoryLockAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired locks", async () => {
            const map = new Map<string, ILockAdapterState>();
            const adapter = new MemoryLockAdapter(map);

            await adapter.acquire(
                "expired",
                "1",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired locks", async () => {
            const map = new Map<string, ILockAdapterState>();
            const adapter = new MemoryLockAdapter(map);

            await adapter.acquire(
                "unexpired",
                "3",
                TimeSpan.fromMinutes(5).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable locks", async () => {
            const map = new Map<string, ILockAdapterState>();
            const adapter = new MemoryLockAdapter(map);

            await adapter.acquire("unexpireable", "2", null);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any locks when none are expired", async () => {
            const map = new Map<string, ILockAdapterState>();
            const adapter = new MemoryLockAdapter(map);

            await adapter.acquire("unexpireable", "1", null);
            await adapter.acquire(
                "unexpired",
                "2",
                TimeSpan.fromMinutes(5).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("unexpireable")).toBe(true);
            expect(map.has("unexpired")).toBe(true);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, ILockAdapterState>();
            const adapter = new MemoryLockAdapter(map);

            await adapter.acquire("a", "1", null);
            await adapter.acquire(
                "a",
                "2",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );
            await adapter.acquire("b", "1", null);
            await adapter.acquire(
                "b",
                "2",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
