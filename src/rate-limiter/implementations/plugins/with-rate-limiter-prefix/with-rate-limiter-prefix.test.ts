import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { withRateLimiterPrefix } from "@/rate-limiter/implementations/plugins/with-rate-limiter-prefix/with-rate-limiter-prefix.js";

describe("plugin: withRateLimiterPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.getState(context, "myKey");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
        });
    });

    describe("method: reset", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const spy = vi.spyOn(adapter, "reset");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.reset(context, "myKey");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
        });
    });

    describe("method: updateState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const spy = vi.spyOn(adapter, "updateState");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.updateState(context, "myKey", 10);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, 10);
        });
    });
});
