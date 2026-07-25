import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/with-event-bus-prefix/with-event-bus-prefix.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withEventBusPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix event name for dispatch", async () => {
        const adapter = new NoOpEventBusAdapter();
        const spy = vi.spyOn(adapter, "dispatch");

        const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

        await enhanced.dispatch(context, "user.created", { userId: "123" });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}user.created`, {
            userId: "123",
        });
    });
    test("Should prefix event name for addListener", async () => {
        const adapter = new NoOpEventBusAdapter();
        const spy = vi.spyOn(adapter, "addListener");
        const listener = vi.fn();

        const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

        await enhanced.addListener(context, "user.created", listener);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}user.created`,
            listener,
        );
    });
    test("Should prefix event name for removeListener", async () => {
        const adapter = new NoOpEventBusAdapter();
        const spy = vi.spyOn(adapter, "removeListener");
        const listener = vi.fn();

        const enhanced = withPlugin(adapter, withEventBusPrefix(prefix));

        await enhanced.removeListener(context, "user.created", listener);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}user.created`,
            listener,
        );
    });
});
