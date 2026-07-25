import { afterEach, describe, expect, test, vi } from "vitest";

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withListenerTracking } from "@/event-bus/implementations/plugins/with-listener-tracking/with-listener-tracking.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withListenerTracking", () => {
    const context = new Context(new Map());
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should track and resolve listeners when user plugin does not wrap listeners", async () => {
        const adapter = new MemoryEventBusAdapter();

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

        await enhancedAdapter.addListener(context, "test.event", listener);
        await enhancedAdapter.dispatch(context, "test.event", payload);
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(payload);

        await enhancedAdapter.removeListener(context, "test.event", listener);
        await enhancedAdapter.dispatch(context, "test.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    test("Should pass through removeListener unchanged for a listener that was never added", async () => {
        const adapter = new MemoryEventBusAdapter();

        const passthroughPlugin: PluginFn<IEventBusAdapter> = (
            _adapter,
            _enhance,
        ) => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();

        await enhancedAdapter.removeListener(context, "ghost.event", listener);

        await enhancedAdapter.dispatch(context, "ghost.event", {});
        expect(listener).not.toHaveBeenCalled();
    });
    test("Should independently track multiple distinct listeners for the same event", async () => {
        const adapter = new MemoryEventBusAdapter();

        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listenerA = vi.fn();
        const listenerB = vi.fn();
        const payload = { data: true };

        await enhancedAdapter.addListener(context, "shared.event", listenerA);
        await enhancedAdapter.addListener(context, "shared.event", listenerB);

        await enhancedAdapter.dispatch(context, "shared.event", payload);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            context,
            "shared.event",
            listenerA,
        );

        await enhancedAdapter.dispatch(context, "shared.event", payload);
        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledTimes(2);
    });
    test("Should allow the same listener to be reused across multiple events", async () => {
        const adapter = new MemoryEventBusAdapter();

        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();

        await enhancedAdapter.addListener(context, "event.alpha", listener);
        await enhancedAdapter.addListener(context, "event.beta", listener);

        await enhancedAdapter.dispatch(context, "event.alpha", {
            key: "alpha",
        });
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.removeListener(context, "event.alpha", listener);
        await enhancedAdapter.dispatch(context, "event.alpha", {
            key: "alpha",
        });
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.dispatch(context, "event.beta", { key: "beta" });
        expect(listener).toHaveBeenCalledTimes(2);
    });
    test("Should chain multiple withListenerTracking calls correctly", async () => {
        const adapter = new MemoryEventBusAdapter();

        const enhancedAdapter = withPlugin(adapter, [
            withListenerTracking(() => {}),
            withListenerTracking(() => {}),
        ]);

        const listener = vi.fn();
        const payload = { value: true };

        await enhancedAdapter.addListener(context, "chain.event", listener);
        await enhancedAdapter.dispatch(context, "chain.event", payload);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(context, "chain.event", listener);
        await enhancedAdapter.dispatch(context, "chain.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    test("Should chain multiple withListenerTracking calls with multiple distinct listeners", async () => {
        const adapter = new MemoryEventBusAdapter();

        const enhancedAdapter = withPlugin(adapter, [
            withListenerTracking(() => {}),
            withListenerTracking(() => {}),
        ]);

        const listenerA = vi.fn();
        const listenerB = vi.fn();

        await enhancedAdapter.addListener(context, "multi.listener", listenerA);
        await enhancedAdapter.addListener(context, "multi.listener", listenerB);

        await enhancedAdapter.dispatch(context, "multi.listener", { n: 1 });
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            context,
            "multi.listener",
            listenerA,
        );

        await enhancedAdapter.dispatch(context, "multi.listener", { n: 2 });
        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledTimes(2);
    });
    test("Should be safe to call removeListener multiple times on the same listener", async () => {
        const adapter = new MemoryEventBusAdapter();

        const passthroughPlugin: PluginFn<IEventBusAdapter> = () => {};

        const enhancedAdapter = withPlugin(
            adapter,
            withListenerTracking(passthroughPlugin),
        );

        const listener = vi.fn();
        const payload = { id: 1 };

        await enhancedAdapter.addListener(context, "test.event", listener);
        await enhancedAdapter.dispatch(context, "test.event", payload);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(context, "test.event", listener);
        await enhancedAdapter.removeListener(context, "test.event", listener);

        await enhancedAdapter.dispatch(context, "test.event", payload);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
