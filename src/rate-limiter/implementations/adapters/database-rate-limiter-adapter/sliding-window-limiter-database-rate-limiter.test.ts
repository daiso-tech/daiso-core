import { beforeEach, describe, expect, test } from "vitest";

import { constantBackoff } from "@/backoff-policies/implementations/_module.js";
import { DatabaseRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/database-rate-limiter-adapter.js";
import { MemoryRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-storage-adapter/memory-rate-limiter-storage-adapter.js";
import { FixedWindowLimiter } from "@/rate-limiter/implementations/policies/_module.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";

describe("sliding-window-limiter class: DatabaseRateLimiterAdapter", () => {
    slidingWindowLimiterTestSuite({
        createAdapter: () => {
            const adapter = new DatabaseRateLimiterAdapter({
                backoffPolicy: constantBackoff(
                    slidingWindowLimiterTestSuite.backoffPolicySettings,
                ),
                adapter: new MemoryRateLimiterStorageAdapter(),
                rateLimiterPolicy: new FixedWindowLimiter(
                    slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
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
