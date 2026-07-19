import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { withLockPrefix } from "@/lock/implementations/plugins/with-lock-prefix/lock-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withLockPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix keys for acquire", async () => {
        const adapter = new NoOpLockAdapter();
        const spy = vi.spyOn(adapter, "acquire");

        const enhanced = withPlugin(adapter, withLockPrefix(prefix));

        await enhanced.acquire(
            context,
            "myKey",
            "lockId",
            TimeSpan.fromSeconds(30),
        );

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}myKey`,
            "lockId",
            TimeSpan.fromSeconds(30),
        );
    });

    test("Should prefix keys for forceRelease", async () => {
        const adapter = new NoOpLockAdapter();
        const spy = vi.spyOn(adapter, "forceRelease");

        const enhanced = withPlugin(adapter, withLockPrefix(prefix));

        await enhanced.forceRelease(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getState", async () => {
        const adapter = new NoOpLockAdapter();
        const spy = vi.spyOn(adapter, "getState");

        const enhanced = withPlugin(adapter, withLockPrefix(prefix));

        await enhanced.getState(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for refresh", async () => {
        const adapter = new NoOpLockAdapter();
        const spy = vi.spyOn(adapter, "refresh");

        const enhanced = withPlugin(adapter, withLockPrefix(prefix));

        await enhanced.refresh(
            context,
            "myKey",
            "lockId",
            TimeSpan.fromSeconds(30),
        );

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}myKey`,
            "lockId",
            TimeSpan.fromSeconds(30),
        );
    });

    test("Should prefix keys for release", async () => {
        const adapter = new NoOpLockAdapter();
        const spy = vi.spyOn(adapter, "release");

        const enhanced = withPlugin(adapter, withLockPrefix(prefix));

        await enhanced.release(context, "myKey", "lockId");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, "lockId");
    });
});
