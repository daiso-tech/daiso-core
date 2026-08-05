import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { RedisCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/_module.js";
import { consecutiveBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

const timeout = TimeSpan.fromMinutes(2);
describe("consecutive-breaker class: RedisCircuitBreakerAdapter", () => {
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

    consecutiveBreakerTestSuite({
        createAdapter: () => {
            const adapter = new RedisCircuitBreakerAdapter({
                database: client,
                backoffPolicy:
                    consecutiveBreakerTestSuite.backoffPolicySettings,
                circuitBreakerPolicy:
                    consecutiveBreakerTestSuite.circuitBreakerPolicySettings,
            });
            return adapter;
        },
        beforeEach,
        describe,
        expect,
        test,
    });
});
