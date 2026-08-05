import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCachePrefix } from "@/cache/implementations/plugins/with-cache-prefix/with-cache-prefix.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";

describe("function: withCachePrefix", () => {
    const context = new NoOpContext();
    const adapter = new NoOpCacheAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "add");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.add(
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >(`${prefix}myKey`, "value", TimeSpan.fromMinutes(5), context);
        });
    });
    describe("method: get", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "get");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.get("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["get"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: getAndRemove", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "getAndRemove");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.getAndRemove("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getAndRemove"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: increment", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "increment");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.increment("myKey", 5, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["increment"]>
            >(`${prefix}myKey`, 5, context);
        });
    });
    describe("method: put", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "put");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.put(
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >(`${prefix}myKey`, "value", TimeSpan.fromMinutes(5), context);
        });
    });
    describe("method: removeByKeyPrefix", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "removeByKeyPrefix");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeByKeyPrefix("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["removeByKeyPrefix"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"], context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`], context);
        });
    });
    describe("method: update", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "update");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.update("myKey", "newValue", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["update"]>
            >(`${prefix}myKey`, "newValue", context);
        });
    });
    describe("method: getOrAdd", () => {
        test("Should prefix keys", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");

            const enhanced = withPlugin(adapter, withCachePrefix(prefix));

            await enhanced.getOrAdd(
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getOrAdd"]>
            >(`${prefix}myKey`, "value", TimeSpan.fromMinutes(5), context);
        });
    });
});
