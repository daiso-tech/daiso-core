import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { RedisRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/redis-rate-limiter-adapter.js";
import { fixedWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

const timeout = TimeSpan.fromMinutes(2);
describe("fixed-window-limiter class: RedisRateLimiterAdapter", () => {
    let client: Redis;
    let startedContainer: StartedRedisContainer;
    beforeEach(async () => {
        startedContainer = await new RedisContainer("redis:7.4.2").start();
        client = new Redis(startedContainer.getConnectionUrl());
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.quit();
        await startedContainer.stop();
    }, timeout.toMilliseconds());

    fixedWindowLimiterTestSuite({
        createAdapter: () => {
            const adapter = new RedisRateLimiterAdapter({
                database: client,
                backoffPolicy:
                    fixedWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
            return adapter;
        },
        beforeEach,
        describe,
        expect,
        test,
    });
});
