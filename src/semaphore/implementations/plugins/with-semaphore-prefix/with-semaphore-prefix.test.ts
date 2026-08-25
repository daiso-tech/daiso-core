import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { withSemaphorePrefix } from "@/semaphore/implementations/plugins/with-semaphore-prefix/with-semaphore-prefix.js";

import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";

describe("function: withSemaphorePrefix", () => {
    const context = new NoOpContext();
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
                context,
                key: "myKey",
                slotId: "slot1",
                limit: 5,
                ttl: currentDate,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["acquire"]>
            >({
                context,
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

            await enhanced.forceReleaseAll("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["forceReleaseAll"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.refresh("myKey", "slot1", currentDate, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["refresh"]>
            >(`${prefix}myKey`, "slot1", currentDate, context);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.release("myKey", "slot1", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISemaphoreAdapter["release"]>
            >(`${prefix}myKey`, "slot1", context);
        });
    });
});
