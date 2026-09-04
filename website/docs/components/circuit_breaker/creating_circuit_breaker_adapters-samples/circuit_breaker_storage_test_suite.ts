// filename: MyCircuitBreakerStorageAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { circuitBreakerStorageTestSuite } from "eridu-tech/circuit-breaker/test-utilities";
import { MemoryCircuitBreakerStorageAdapter } from "./MemoryCircuitBreakerStorageAdapter.js";

describe("class: MyCircuitBreakerStorageAdapter", () => {
    circuitBreakerStorageTestSuite({
        createAdapter: () => new MemoryCircuitBreakerStorageAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
