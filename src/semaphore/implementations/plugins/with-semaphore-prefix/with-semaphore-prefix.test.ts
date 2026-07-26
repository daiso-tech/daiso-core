import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { type ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { withSemaphorePrefix } from "@/semaphore/implementations/plugins/with-semaphore-prefix/with-semaphore-prefix.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withSemaphorePrefix", () => {
    const noOpContext = new NoOpContext();
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
                context: noOpContext,
                key: "myKey",
                slotId: "slot1",
                limit: 5,
                ttl: TimeSpan.fromSeconds(30),
            });

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISemaphoreAdapter["acquire"]>
            >({
                context: noOpContext,
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

            await enhanced.forceReleaseAll("myKey", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISemaphoreAdapter["forceReleaseAll"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.getState("myKey", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISemaphoreAdapter["getState"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.refresh(
                "myKey",
                "slot1",
                TimeSpan.fromSeconds(30),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISemaphoreAdapter["refresh"]>
            >(`${prefix}myKey`, "slot1", TimeSpan.fromSeconds(30), noOpContext);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withSemaphorePrefix(prefix));

            await enhanced.release("myKey", "slot1", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISemaphoreAdapter["release"]>
            >(`${prefix}myKey`, "slot1", noOpContext);
        });
    });
});
