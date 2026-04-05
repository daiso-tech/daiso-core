import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    MemoryLockAdapter,
    type MemoryLockData,
} from "@/lock/implementations/adapters/memory-lock-adapter/_module.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("class: MemoryLockAdapter", () => {
    let map = new Map<string, MemoryLockData>();
    let adapter: MemoryLockAdapter;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());

    beforeEach(() => {
        map = new Map();
        adapter = new MemoryLockAdapter(map);
    });
    afterEach(async () => {
        await adapter.deInit();
    });
    lockAdapterTestSuite({
        createAdapter: () => adapter,
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            await adapter.acquire(noOpContext, "a", "1", null);
            await adapter.acquire(
                noOpContext,
                "a",
                "2",
                TimeSpan.fromMilliseconds(100),
            );
            await adapter.acquire(noOpContext, "b", "1", null);
            await adapter.acquire(
                noOpContext,
                "b",
                "2",
                TimeSpan.fromMilliseconds(100),
            );

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
