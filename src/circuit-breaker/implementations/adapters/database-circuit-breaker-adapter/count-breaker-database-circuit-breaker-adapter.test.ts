import { beforeEach, describe, expect, test } from "vitest";

import { constantBackoff } from "@/backoff-policies/implementations/_module.js";
import { DatabaseCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/database-circuit-breaker-adapter.js";
import { MemoryCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-storage-adapter/memory-circuit-breaker-storage-adapter.js";
import { CountBreaker } from "@/circuit-breaker/implementations/policies/_module.js";
import { countBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";

describe("count-breaker class: DatabaseCircuitBreakerAdapter", () => {
    countBreakerTestSuite({
        createAdapter: () => {
            const adapter = new DatabaseCircuitBreakerAdapter({
                backoffPolicy: constantBackoff(
                    countBreakerTestSuite.backoffPolicySettings,
                ),
                adapter: new MemoryCircuitBreakerStorageAdapter(),
                circuitBreakerPolicy: new CountBreaker(
                    countBreakerTestSuite.circuitBreakerPolicySettings,
                ),
            });
            return adapter;
        },
        beforeEach,
        describe,
        expect,
        test,
    });
});
