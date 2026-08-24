import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheJitter } from "@/cache/implementations/plugins/with-cache-jitter/with-cache-jitter.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";

describe("function: withCacheJitter", () => {
    const context = new NoOpContext();
    const adapter = new NoOpCacheAdapter<string>();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should apply jitter to TTL", async () => {
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({
                    defaultJitter: 0.2,
                    internalMathRandom: mathRandom,
                }),
            );

            const ttl = TimeSpan.fromMinutes(1).toEndDate();
            const expectedMs = (1 - 0.2 * 0.5) * ttl.getTime();

            await enhanced.add("myKey", "value", ttl, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >("myKey", "value", new Date(expectedMs), context);
        });
        test("Should not apply jitter when TTL is null", async () => {
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ internalMathRandom: mathRandom }),
            );

            await enhanced.add("myKey", "value", null, context);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["add"]>>(
                "myKey",
                "value",
                null,
                context,
            );
            expect(mathRandom).not.toHaveBeenCalled();
        });
        test("Should use default jitter of 0.2 when not specified", async () => {
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ internalMathRandom: mathRandom }),
            );

            const ttl = TimeSpan.fromMinutes(1).toEndDate();
            const expectedMs = (1 - 0.2 * 0.5) * ttl.getTime();

            await enhanced.add("myKey", "value", ttl, context);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["add"]>>(
                "myKey",
                "value",
                new Date(expectedMs),
                context,
            );
        });
    });
    describe("method: put", () => {
        test("Should apply jitter to TTL", async () => {
            const spy = vi.spyOn(adapter, "put");
            const mathRandom = vi.fn().mockReturnValue(0.3);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({
                    defaultJitter: 0.5,
                    internalMathRandom: mathRandom,
                }),
            );

            const ttl = TimeSpan.fromMinutes(1).toEndDate();
            const expectedMs = (1 - 0.5 * 0.3) * ttl.getTime();

            await enhanced.put("myKey", "value", ttl, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >("myKey", "value", new Date(expectedMs), context);
        });
        test("Should not apply jitter when TTL is null", async () => {
            const spy = vi.spyOn(adapter, "put");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ internalMathRandom: mathRandom }),
            );

            await enhanced.put("myKey", "value", null, context);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["put"]>>(
                "myKey",
                "value",
                null,
                context,
            );
            expect(mathRandom).not.toHaveBeenCalled();
        });
    });
    describe("method: getOrAdd", () => {
        test("Should apply jitter to TTL", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({
                    defaultJitter: 0.2,
                    internalMathRandom: mathRandom,
                }),
            );

            const ttl = TimeSpan.fromMinutes(1).toEndDate();
            const expectedMs = (1 - 0.2 * 0.5) * ttl.getTime();

            await enhanced.getOrAdd("myKey", "value", ttl, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getOrAdd"]>
            >("myKey", "value", new Date(expectedMs), context);
        });
        test("Should not apply jitter when TTL is null", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ internalMathRandom: mathRandom }),
            );

            await enhanced.getOrAdd("myKey", "value", null, context);

            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["getOrAdd"]>
            >("myKey", "value", null, context);
            expect(mathRandom).not.toHaveBeenCalled();
        });
    });
});
