import { describe, test, expect, beforeEach } from "vitest";

import { MemoryCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-storage-adapter/memory-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";

describe("class: MemoryCircuitBreakerStorageAdapter", () => {
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );
            const map = new Map<string, unknown>();
            const adapter = new MemoryCircuitBreakerStorageAdapter(map);
            await adapter.transaction(async (trx) => {
                await trx.upsert("a", "1", noOpContext);
                await trx.upsert("b", "1", noOpContext);
            }, noOpContext);
            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
    circuitBreakerStorageAdapterTestSuite({
        createAdapter: () => {
            return new MemoryCircuitBreakerStorageAdapter();
        },
        beforeEach,
        describe,
        test,
        expect,
    });
});
