import { afterEach, describe, expect, test, vi } from "vitest";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCachePrefix } from "@/cache/implementations/plugins/with-cache-prefix/with-cache-prefix.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCachePrefix", () => {
    const noOpContext = new NoOpContext();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.add(
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["add"]>>(
                `${prefix}myKey`,
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );
        });
    });
    describe("method: get", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "get");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.get("myKey", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["get"]>>(
                `${prefix}myKey`,
                noOpContext,
            );
        });
    });
    describe("method: getAndRemove", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "getAndRemove");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.getAndRemove("myKey", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["getAndRemove"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: increment", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<number>();
            const spy = vi.spyOn(adapter, "increment");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.increment("myKey", 5, noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["increment"]>
            >(`${prefix}myKey`, 5, noOpContext);
        });
    });
    describe("method: put", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.put(
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<Parameters<ICacheAdapter["put"]>>(
                `${prefix}myKey`,
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );
        });
    });
    describe("method: removeByKeyPrefix", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "removeByKeyPrefix");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeByKeyPrefix("myKey", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["removeByKeyPrefix"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"], noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`], noOpContext);
        });
    });
    describe("method: update", () => {
        test("Should prefix keys", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "update");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.update("myKey", "newValue", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ICacheAdapter["update"]>
            >(`${prefix}myKey`, "newValue", noOpContext);
        });
    });
});
