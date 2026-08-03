import { afterEach, describe, expect, test, vi } from "vitest";

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/with-event-bus-prefix/with-event-bus-prefix.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withEventBusPrefix", () => {
    const noOpContext = new NoOpContext();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("method: dispatch", () => {
        test("Should prefix event name", async () => {
            const adapter = new NoOpEventBusAdapter();
            const spy = vi.spyOn(adapter, "dispatch");

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.dispatch(
                "user.created",
                { userId: "123" },
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                `${prefix}user.created`,
                {
                    userId: "123",
                },
                noOpContext,
            );
        });
    });
    describe("method: addListener", () => {
        test("Should prefix event name", async () => {
            const adapter = new NoOpEventBusAdapter();
            const spy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.addListener("user.created", listener, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["addListener"]>
            >(`${prefix}user.created`, listener, noOpContext);
        });
    });
    describe("method: removeListener", () => {
        test("Should prefix event name", async () => {
            const adapter = new NoOpEventBusAdapter();
            const spy = vi.spyOn(adapter, "removeListener");
            const listener = vi.fn();

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.removeListener(
                "user.created",
                listener,
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >(`${prefix}user.created`, listener, noOpContext);
        });
    });
});
