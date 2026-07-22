import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { withSemaphorePrefix } from "@/semaphore/implementations/plugins/with-semaphore-prefix/with-semaphore-prefix.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("plugin: withSemaphorePrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("method: acquire", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "acquire");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.acquire({
                context,
                key: "myKey",
                slotId: "slot1",
                limit: 5,
                ttl: TimeSpan.fromSeconds(30),
            });

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith({
                context,
                key: `${prefix}myKey`,
                slotId: "slot1",
                limit: 5,
                ttl: TimeSpan.fromSeconds(30),
            });
        });
    });

    describe("method: forceReleaseAll", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "forceReleaseAll");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.forceReleaseAll(context, "myKey");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.getState(context, "myKey");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.refresh(
                context,
                "myKey",
                "slot1",
                TimeSpan.fromSeconds(30),
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(
                context,
                `${prefix}myKey`,
                "slot1",
                TimeSpan.fromSeconds(30),
            );
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.release(context, "myKey", "slot1");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(
                context,
                `${prefix}myKey`,
                "slot1",
            );
        });
    });
});
