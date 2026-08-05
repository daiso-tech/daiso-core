import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { withRateLimiterPrefix } from "@/rate-limiter/implementations/plugins/with-rate-limiter-prefix/with-rate-limiter-prefix.js";

import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module.js";

describe("function: withRateLimiterPrefix", () => {
    const context = new NoOpContext();
    const adapter = new NoOpRateLimiterAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IRateLimiterAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: reset", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "reset");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.reset("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IRateLimiterAdapter["reset"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: updateState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "updateState");

            const enhanced = withPlugin(adapter, withRateLimiterPrefix(prefix));

            await enhanced.updateState("myKey", 10, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IRateLimiterAdapter["updateState"]>
            >(`${prefix}myKey`, 10, context);
        });
    });
});
