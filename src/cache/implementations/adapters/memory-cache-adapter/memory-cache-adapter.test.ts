import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { MemoryCacheEntryData } from "@/cache/implementations/adapters/memory-cache-adapter/_module.js";

describe("class: MemoryCacheAdapter", () => {
    cacheAdapterTestSuite({
        createAdapter: () => new MemoryCacheAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired cache entries", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.add(
                "expired",
                "1",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired cache entries", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.add(
                "unexpired",
                "2",
                TimeSpan.fromMinutes(5).toEndDate(),
            );

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable cache entries", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.add("unexpireable", "3", null);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any cache entries when none are expired", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.add("unexpireable", "1", null);
            await adapter.add(
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
        test("Should do nothing when map is empty", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(0);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, MemoryCacheEntryData>();
            const adapter = new MemoryCacheAdapter(map);

            await adapter.add("a", "1", null);
            await adapter.add(
                "b",
                "2",
                TimeSpan.fromMilliseconds(100).toEndDate(),
            );

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
