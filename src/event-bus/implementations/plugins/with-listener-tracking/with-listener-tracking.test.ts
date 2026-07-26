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

        await enhancedAdapter.addListener("test.event", listener, context);
        await enhancedAdapter.dispatch("test.event", payload, context);
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(payload);

        await enhancedAdapter.removeListener("test.event", listener, context);
        await enhancedAdapter.dispatch("test.event", payload, context);
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

        await enhancedAdapter.removeListener("ghost.event", listener, context);

        await enhancedAdapter.dispatch("ghost.event", {}, context);
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

        await enhancedAdapter.addListener("shared.event", listenerA, context);
        await enhancedAdapter.addListener("shared.event", listenerB, context);

        await enhancedAdapter.dispatch("shared.event", payload, context);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "shared.event",
            listenerA,
            context,
        );

        await enhancedAdapter.dispatch("shared.event", payload, context);
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

        await enhancedAdapter.addListener("event.alpha", listener, context);
        await enhancedAdapter.addListener("event.beta", listener, context);

        await enhancedAdapter.dispatch(
            "event.alpha",
            {
                key: "alpha",
            },
            context,
        );
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.removeListener("event.alpha", listener, context);
        await enhancedAdapter.dispatch(
            "event.alpha",
            {
                key: "alpha",
            },
            context,
        );
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.dispatch("event.beta", { key: "beta" }, context);
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

        await enhancedAdapter.addListener("chain.event", listener, context);
        await enhancedAdapter.dispatch("chain.event", payload, context);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("chain.event", listener, context);
        await enhancedAdapter.dispatch("chain.event", payload, context);
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

        await enhancedAdapter.addListener("multi.listener", listenerA, context);
        await enhancedAdapter.addListener("multi.listener", listenerB, context);

        await enhancedAdapter.dispatch("multi.listener", { n: 1 }, context);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "multi.listener",
            listenerA,
            context,
        );

        await enhancedAdapter.dispatch("multi.listener", { n: 2 }, context);
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

        await enhancedAdapter.addListener("test.event", listener, context);
        await enhancedAdapter.dispatch("test.event", payload, context);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener("test.event", listener, context);
        await enhancedAdapter.removeListener("test.event", listener, context);

        await enhancedAdapter.dispatch("test.event", payload, context);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
