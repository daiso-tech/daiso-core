import { afterEach, describe, expect, test, vi } from "vitest";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheJitter } from "@/cache/implementations/plugins/with-cache-jitter/with-cache-jitter.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheJitter", () => {
    const noOpContext = new NoOpContext();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should apply jitter to TTL", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({
                    defaultJitter: 0.2,
                    _mathRandom: mathRandom,
                }),
            );

            const ttl = TimeSpan.fromMinutes(1);
            const expectedMs = (1 - 0.2 * 0.5) * ttl.toMilliseconds();

            await enhanced.add("myKey", "value", ttl, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >(
                "myKey",
                "value",
                TimeSpan.fromMilliseconds(expectedMs),
                noOpContext,
            );
        });
        test("Should not apply jitter when TTL is null", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ _mathRandom: mathRandom }),
            );

            await enhanced.add("myKey", "value", null, noOpContext);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["add"]>>(
                ...["myKey", "value", null, noOpContext],
            );
        });
        test("Should use default jitter of 0.2 when not specified", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ _mathRandom: mathRandom }),
            );

            const ttl = TimeSpan.fromMinutes(1);
            const expectedMs = (1 - 0.2 * 0.5) * ttl.toMilliseconds();

            await enhanced.add("myKey", "value", ttl, noOpContext);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["add"]>>(
                "myKey",
                "value",
                TimeSpan.fromMilliseconds(expectedMs),
                noOpContext,
            );
        });
    });
    describe("method: put", () => {
        test("Should apply jitter to TTL", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");
            const mathRandom = vi.fn().mockReturnValue(0.3);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({
                    defaultJitter: 0.5,
                    _mathRandom: mathRandom,
                }),
            );

            const ttl = TimeSpan.fromMinutes(1);
            const expectedMs = (1 - 0.5 * 0.3) * ttl.toMilliseconds();

            await enhanced.put("myKey", "value", ttl, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >(
                "myKey",
                "value",
                TimeSpan.fromMilliseconds(expectedMs),
                noOpContext,
            );
        });
        test("Should not apply jitter when TTL is null", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");
            const mathRandom = vi.fn().mockReturnValue(0.5);

            const enhanced = withPlugin(
                adapter,
                withCacheJitter({ _mathRandom: mathRandom }),
            );

            await enhanced.put("myKey", "value", null, noOpContext);

            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["put"]>>(
                "myKey",
                "value",
                null,
                noOpContext,
            );
        });
    });
});
