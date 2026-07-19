import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCachePrefix } from "@/cache/implementations/plugins/with-cache-prefix/cache-prefix.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCachePrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix keys for add", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "add");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.add(context, "myKey", "value", TimeSpan.fromMinutes(5));

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}myKey`,
            "value",
            TimeSpan.fromMinutes(5),
        );
    });

    test("Should prefix keys for get", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "get");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.get(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getAndRemove", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "getAndRemove");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.getAndRemove(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for increment", async () => {
        const adapter = new NoOpCacheAdapter<number>();
        const spy = vi.spyOn(adapter, "increment");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.increment(context, "myKey", 5);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, 5);
    });

    test("Should prefix keys for put", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "put");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.put(context, "myKey", "value", TimeSpan.fromMinutes(5));

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}myKey`,
            "value",
            TimeSpan.fromMinutes(5),
        );
    });

    test("Should prefix keys for removeByKeyPrefix", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "removeByKeyPrefix");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.removeByKeyPrefix(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for removeMany", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "removeMany");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.removeMany(context, ["key1", "key2"]);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, [
            `${prefix}key1`,
            `${prefix}key2`,
        ]);
    });

    test("Should prefix keys for update", async () => {
        const adapter = new NoOpCacheAdapter<string>();
        const spy = vi.spyOn(adapter, "update");

        const enhanced = withPlugin(adapter, withCachePrefix(prefix));

        await enhanced.update(context, "myKey", "newValue");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, "newValue");
    });
});
