import {
    RedisContainer,
    type StartedRedisContainer,
} from "@testcontainers/redis";
import { Redis } from "ioredis";
import { describe, test, beforeEach, expect, afterEach } from "vitest";

import { RedisPubSubEventBusAdapter } from "@/event-bus/implementations/adapters/redis-pub-sub-event-bus-adapter/redis-pub-sub-event-bus-adapter.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: RedisPubSubEventBusAdapter", () => {
    let client: Redis;
    let startedContainer: StartedRedisContainer;
    beforeEach(async () => {
        startedContainer = await new RedisContainer("redis:7.2").start();
        client = new Redis(startedContainer.getConnectionUrl());
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.quit();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    const serde = new Serde(new SuperJsonSerdeAdapter());
    eventBusAdapterTestSuite({
        createAdapter: () =>
            new RedisPubSubEventBusAdapter({
                client,
                serde,
            }),
        test,
        beforeEach,
        expect,
        describe,
    });
});
