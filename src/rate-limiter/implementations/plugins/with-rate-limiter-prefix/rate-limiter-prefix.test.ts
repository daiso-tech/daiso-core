import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { withRateLimiterPrefix } from "@/rate-limiter/implementations/plugins/with-rate-limiter-prefix/rate-limiter-prefix.js";

describe("function: withRateLimiterPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix keys for getState", async () => {
        const adapter = new NoOpRateLimiterAdapter();
        const spy = vi.spyOn(adapter, "getState");

        const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

        await enhanced.getState(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for reset", async () => {
        const adapter = new NoOpRateLimiterAdapter();
        const spy = vi.spyOn(adapter, "reset");

        const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

        await enhanced.reset(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for updateState", async () => {
        const adapter = new NoOpRateLimiterAdapter();
        const spy = vi.spyOn(adapter, "updateState");

        const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

        await enhanced.updateState(context, "myKey", 10);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, 10);
    });
});
