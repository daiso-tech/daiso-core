import { beforeEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { withSemaphorePrefix } from "@/semaphore/implementations/plugins/with-semaphore-prefix/with-semaphore-prefix.js";

import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";

describe("function: withSemaphorePrefix", () => {
    const adapter = new NoOpSemaphoreAdapter();
    const prefix = "test-prefix:";
    const currentDate = new Date();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: acquire", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquire");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.acquire({
                key: "myKey",
                slotId: "slot1",
                limit: 5,
                ttl: currentDate,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["acquire"]>
            >({
                key: `${prefix}myKey`,
                slotId: "slot1",
                limit: 5,
                ttl: currentDate,
            });
        });
    });

    describe("method: forceReleaseAll", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceReleaseAll");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.forceReleaseAll("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["forceReleaseAll"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.getState("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["getState"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.refresh("myKey", "slot1", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["refresh"]>
            >(`${prefix}myKey`, "slot1", currentDate);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.release("myKey", "slot1");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["release"]>
            >(`${prefix}myKey`, "slot1");
        });
    });
});
