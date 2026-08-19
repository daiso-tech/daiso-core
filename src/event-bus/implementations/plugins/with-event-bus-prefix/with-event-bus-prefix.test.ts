import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/with-event-bus-prefix/with-event-bus-prefix.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module.js";

describe("function: withEventBusPrefix", () => {
    const context = new NoOpContext();
    const adapter = new NoOpEventBusAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: dispatch", () => {
        test("Should prefix event name", async () => {
            const spy = vi.spyOn(adapter, "dispatch");

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.dispatch("user.created", { userId: "123" }, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                `${prefix}user.created`,
                {
                    userId: "123",
                },
                context,
            );
        });
    });
    describe("method: addListener", () => {
        test("Should prefix event name", async () => {
            const spy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.addListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["addListener"]>
            >(`${prefix}user.created`, listener, context);
        });
    });
    describe("method: removeListener", () => {
        test("Should prefix event name", async () => {
            const spy = vi.spyOn(adapter, "removeListener");
            const listener = vi.fn();

            const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

            await enhanced.removeListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >(`${prefix}user.created`, listener, context);
        });
    });
});
