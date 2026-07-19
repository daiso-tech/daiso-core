import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/_module.js";
import { withCircuitBreakerPrefix } from "@/circuit-breaker/implementations/plugins/with-circuit-breaker-prefix/circuit-breaker-prefix.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withCircuitBreakerPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix keys for getState", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "getState");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.getState(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for isolate", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "isolate");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.isolate(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for reset", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "reset");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.reset(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for trackFailure", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "trackFailure");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.trackFailure(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for trackSuccess", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "trackSuccess");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.trackSuccess(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for updateState", async () => {
        const adapter = new NoOpCircuitBreakerAdapter();
        const spy = vi.spyOn(adapter, "updateState");

        const enhanced = withPlugin(adapter, withCircuitBreakerPrefix(prefix));

        await enhanced.updateState(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });
});
