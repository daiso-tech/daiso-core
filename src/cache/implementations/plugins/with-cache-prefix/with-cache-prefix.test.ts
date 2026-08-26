import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCachePrefix } from "@/cache/implementations/plugins/with-cache-prefix/with-cache-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";

describe("function: withCachePrefix", () => {
    const adapter = new NoOpCacheAdapter();
    const prefix = "test-prefix:";
    const currentDate = new Date();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "add");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.add("myKey", "value", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >(`${prefix}myKey`, "value", currentDate);
        });
    });
    describe("method: get", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "get");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.get("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["get"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: getAndRemove", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "getAndRemove");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.getAndRemove("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getAndRemove"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: increment", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "increment");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.increment("myKey", 5);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["increment"]>
            >(`${prefix}myKey`, 5);
        });
    });
    describe("method: put", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "put");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.put("myKey", "value", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >(`${prefix}myKey`, "value", currentDate);
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeByPrefix("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["removeByPrefix"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"]);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`]);
        });
    });
    describe("method: update", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "update");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.update("myKey", "newValue");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["update"]>
            >(`${prefix}myKey`, "newValue");
        });
    });
    describe("method: getOrAdd", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.getOrAdd("myKey", "value", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getOrAdd"]>
            >(`${prefix}myKey`, "value", currentDate);
        });
    });
});
