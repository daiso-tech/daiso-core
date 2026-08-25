import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withListenerTracking } from "@/event-bus/implementations/plugins/with-listener-tracking/with-listener-tracking.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

describe("function: withListenerTracking", () => {
    let adapter: IEventBusAdapter;
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        adapter = new MemoryEventBusAdapter();
    });

    test("Should track and resolve listeners when user plugin does not wrap listeners", async () => {
        const passthroughPlugin: PluginFn<IEventBusAdapter> = (
            _adapter,
            _enhance,
        ) => {
            // No-op plugin that does not wrap anything
        };

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();
        const payload = { value: 42 };

        await enhancedAdapter.addListener("test.event", listener);
        await enhancedAdapter.dispatch("test.event", payload);
        expect(listener).toHaveBeenCalledExactlyOnceWith(payload);

        await enhancedAdapter.removeListener("test.event", listener);
        await enhancedAdapter.dispatch("test.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    test("Should pass through removeListener unchanged for a listener that was never added", async () => {
        const passthroughPlugin: PluginFn<IEventBusAdapter> = (
            _adapter,
            _enhance,
        ) => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();

        await enhancedAdapter.removeListener("ghost.event", listener);

        await enhancedAdapter.dispatch("ghost.event", {});
        expect(listener).not.toHaveBeenCalled();
    });
    test("Should independently track multiple distinct listeners for the same event", async () => {
        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listenerA = vi.fn();
        const listenerB = vi.fn();
        const payload = { data: true };

        await enhancedAdapter.addListener("shared.event", listenerA);
        await enhancedAdapter.addListener("shared.event", listenerB);

        await enhancedAdapter.dispatch("shared.event", payload);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("shared.event", listenerA);

        await enhancedAdapter.dispatch("shared.event", payload);
        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledTimes(2);
    });
    test("Should allow the same listener to be reused across multiple events", async () => {
        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();

        await enhancedAdapter.addListener("event.alpha", listener);
        await enhancedAdapter.addListener("event.beta", listener);

        await enhancedAdapter.dispatch("event.alpha", {
            key: "alpha",
        });
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.removeListener("event.alpha", listener);
        await enhancedAdapter.dispatch("event.alpha", {
            key: "alpha",
        });
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.dispatch("event.beta", { key: "beta" });
        expect(listener).toHaveBeenCalledTimes(2);
    });
    test("Should chain multiple withListenerTracking calls correctly", async () => {
        const enhancedAdapter = withPlugin(adapter, [
            withListenerTracking(() => {}),
            withListenerTracking(() => {}),
        ]);

        const listener = vi.fn();
        const payload = { value: true };

        await enhancedAdapter.addListener("chain.event", listener);
        await enhancedAdapter.dispatch("chain.event", payload);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("chain.event", listener);
        await enhancedAdapter.dispatch("chain.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    test("Should chain multiple withListenerTracking calls with multiple distinct listeners", async () => {
        const enhancedAdapter = withPlugin(adapter, [
            withListenerTracking(() => {}),
            withListenerTracking(() => {}),
        ]);

        const listenerA = vi.fn();
        const listenerB = vi.fn();

        await enhancedAdapter.addListener("multi.listener", listenerA);
        await enhancedAdapter.addListener("multi.listener", listenerB);

        await enhancedAdapter.dispatch("multi.listener", { n: 1 });
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("multi.listener", listenerA);

        await enhancedAdapter.dispatch("multi.listener", { n: 2 });
        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledTimes(2);
    });
    test("Should be safe to call removeListener multiple times on the same listener", async () => {
        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();
        const payload = { id: 1 };

        await enhancedAdapter.addListener("test.event", listener);
        await enhancedAdapter.dispatch("test.event", payload);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("test.event", listener);
        await enhancedAdapter.removeListener("test.event", listener);

        await enhancedAdapter.dispatch("test.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
