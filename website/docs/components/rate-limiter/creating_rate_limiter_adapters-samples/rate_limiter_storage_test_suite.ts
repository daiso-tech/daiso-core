// filename: MyRateLimiterStorageAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { rateLimiterBreakerStorageTestSuite } from "eridu-tech/rate-limiter/test-utilities";
import { MemoryRateLimiterStorageAdapter } from "./MemoryRateLimiterStorageAdapter.js";

describe("class: MyRateLimiterStorageAdapter", () => {
    rateLimiterBreakerStorageTestSuite({
        createAdapter: () => new MemoryRateLimiterStorageAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
