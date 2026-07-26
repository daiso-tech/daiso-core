import { afterEach, describe, expect, test, vi } from "vitest";

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withListenerTracking } from "@/event-bus/implementations/plugins/with-listener-tracking/with-listener-tracking.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withListenerTracking", () => {
    const noOpContext = new NoOpContext();
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

        await enhancedAdapter.addListener("test.event", listener, noOpContext);
        await enhancedAdapter.dispatch("test.event", payload, noOpContext);
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(payload);

        await enhancedAdapter.removeListener(
            "test.event",
            listener,
            noOpContext,
        );
        await enhancedAdapter.dispatch("test.event", payload, noOpContext);
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

        await enhancedAdapter.removeListener(
            "ghost.event",
            listener,
            noOpContext,
        );

        await enhancedAdapter.dispatch("ghost.event", {}, noOpContext);
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

        await enhancedAdapter.addListener(
            "shared.event",
            listenerA,
            noOpContext,
        );
        await enhancedAdapter.addListener(
            "shared.event",
            listenerB,
            noOpContext,
        );

        await enhancedAdapter.dispatch("shared.event", payload, noOpContext);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "shared.event",
            listenerA,
            noOpContext,
        );

        await enhancedAdapter.dispatch("shared.event", payload, noOpContext);
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

        await enhancedAdapter.addListener("event.alpha", listener, noOpContext);
        await enhancedAdapter.addListener("event.beta", listener, noOpContext);

        await enhancedAdapter.dispatch(
            "event.alpha",
            {
                key: "alpha",
            },
            noOpContext,
        );
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.removeListener(
            "event.alpha",
            listener,
            noOpContext,
        );
        await enhancedAdapter.dispatch(
            "event.alpha",
            {
                key: "alpha",
            },
            noOpContext,
        );
        expect(listener).toHaveBeenCalledTimes(1);

        await enhancedAdapter.dispatch(
            "event.beta",
            { key: "beta" },
            noOpContext,
        );
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

        await enhancedAdapter.addListener("chain.event", listener, noOpContext);
        await enhancedAdapter.dispatch("chain.event", payload, noOpContext);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "chain.event",
            listener,
            noOpContext,
        );
        await enhancedAdapter.dispatch("chain.event", payload, noOpContext);
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

        await enhancedAdapter.addListener(
            "multi.listener",
            listenerA,
            noOpContext,
        );
        await enhancedAdapter.addListener(
            "multi.listener",
            listenerB,
            noOpContext,
        );

        await enhancedAdapter.dispatch("multi.listener", { n: 1 }, noOpContext);
        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "multi.listener",
            listenerA,
            noOpContext,
        );

        await enhancedAdapter.dispatch("multi.listener", { n: 2 }, noOpContext);
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

        await enhancedAdapter.addListener("test.event", listener, noOpContext);
        await enhancedAdapter.dispatch("test.event", payload, noOpContext);
        expect(listener).toHaveBeenCalledOnce();

        await enhancedAdapter.removeListener(
            "test.event",
            listener,
            noOpContext,
        );
        await enhancedAdapter.removeListener(
            "test.event",
            listener,
            noOpContext,
        );

        await enhancedAdapter.dispatch("test.event", payload, noOpContext);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
