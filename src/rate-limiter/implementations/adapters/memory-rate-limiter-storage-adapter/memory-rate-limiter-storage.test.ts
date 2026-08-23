import { beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { MemoryRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { delay } from "@/utilities/_module.js";

import type { MemoryRateLimiterData } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-storage-adapter/_module.js";

describe("class: MemoryRateLimiterStorageAdapter", () => {
    rateLimiterStorageAdapterTestSuite({
        createAdapter: () => new MemoryRateLimiterStorageAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired rate limiters", async () => {
            const map = new Map<string, MemoryRateLimiterData>();
            const adapter = new MemoryRateLimiterStorageAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.transaction(async (trx) => {
                await trx.upsert(
                    "expired",
                    1,
                    TimeSpan.fromMilliseconds(100).toEndDate(),
                    noOpContext,
                );
            }, noOpContext);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired rate limiters", async () => {
            const map = new Map<string, MemoryRateLimiterData>();
            const adapter = new MemoryRateLimiterStorageAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.transaction(async (trx) => {
                await trx.upsert(
                    "unexpired",
                    2,
                    TimeSpan.fromMinutes(5).toEndDate(),
                    noOpContext,
                );
            }, noOpContext);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should not remove any rate limiters when none are expired", async () => {
            const map = new Map<string, MemoryRateLimiterData>();
            const adapter = new MemoryRateLimiterStorageAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );

            await adapter.transaction(async (trx) => {
                await trx.upsert(
                    "a",
                    1,
                    TimeSpan.fromMinutes(5).toEndDate(),
                    noOpContext,
                );
                await trx.upsert(
                    "b",
                    2,
                    TimeSpan.fromMinutes(5).toEndDate(),
                    noOpContext,
                );
            }, noOpContext);

            await delay(TimeSpan.fromMilliseconds(200));

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("a")).toBe(true);
            expect(map.has("b")).toBe(true);
        });
    });
    describe("method: deInit", () => {
        test("Should clear rate limiter data", async () => {
            const map = new Map<string, MemoryRateLimiterData>();
            const adapter = new MemoryRateLimiterStorageAdapter(map);
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );
            await adapter.transaction(async (trx) => {
                await trx.upsert(
                    "a",
                    1,
                    TimeSpan.fromSeconds(2).toEndDate(),
                    noOpContext,
                );
                await trx.upsert(
                    "b",
                    2,
                    TimeSpan.fromSeconds(2).toEndDate(),
                    noOpContext,
                );
                await trx.upsert(
                    "c",
                    3,
                    TimeSpan.fromSeconds(2).toEndDate(),
                    noOpContext,
                );
            }, noOpContext);
            await adapter.deInit();

            expect(map.size).toBe(0);
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MemoryRateLimiterStorageAdapter();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MemoryRateLimiterStorageAdapter();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
