import {
    RedisContainer,
    type StartedRedisContainer,
} from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { RedisRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/redis-rate-limiter-adapter.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("sliding-window-limiter class: RedisRateLimiterAdapter", () => {
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

    slidingWindowLimiterTestSuite({
        createAdapter: () => {
            const adapter = new RedisRateLimiterAdapter({
                database: client,
                backoffPolicy:
                    slidingWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
            return adapter;
        },
        beforeEach,
        describe,
        expect,
        test,
    });
});
