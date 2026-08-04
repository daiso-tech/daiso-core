import { beforeEach, describe, expect, test, vi } from "vitest";

import { type ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module.js";
import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/_module.js";
import { withCircuitBreakerPrefix } from "@/circuit-breaker/implementations/plugins/with-circuit-breaker-prefix/with-circuit-breaker-prefix.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withCircuitBreakerPrefix", () => {
    const context = new NoOpContext();
    const adapter = new NoOpCircuitBreakerAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: isolate", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "isolate");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.isolate("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["isolate"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: reset", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "reset");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.reset("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["reset"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: trackFailure", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "trackFailure");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.trackFailure("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["trackFailure"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: trackSuccess", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "trackSuccess");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.trackSuccess("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["trackSuccess"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: updateState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "updateState");

            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerPrefix(prefix),
            );

            await enhanced.updateState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICircuitBreakerAdapter["updateState"]>
            >(`${prefix}myKey`, context);
        });
    });
});
