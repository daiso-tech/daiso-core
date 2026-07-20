import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { withSharedLockPrefix } from "@/shared-lock/implementations/plugins/with-shared-lock-prefix/with-shared-lock-prefix.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withSharedLockPrefix", () => {
    const context = new Context(new Map());
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should prefix keys for forceRelease", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "forceRelease");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.forceRelease(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getState", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "getState");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.getState(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for acquireWriter", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "acquireWriter");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.acquireWriter(
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

    test("Should prefix keys for forceReleaseWriter", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "forceReleaseWriter");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.forceReleaseWriter(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for refreshWriter", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "refreshWriter");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.refreshWriter(
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

    test("Should prefix keys for releaseWriter", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "releaseWriter");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.releaseWriter(context, "myKey", "lockId");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, "lockId");
    });

    test("Should prefix keys for acquireReader", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "acquireReader");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.acquireReader({
            context,
            key: "myKey",
            lockId: "lock1",
            limit: 5,
            ttl: TimeSpan.fromSeconds(30),
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith({
            context,
            key: `${prefix}myKey`,
            lockId: "lock1",
            limit: 5,
            ttl: TimeSpan.fromSeconds(30),
        });
    });

    test("Should prefix keys for forceReleaseAllReaders", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "forceReleaseAllReaders");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.forceReleaseAllReaders(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for refreshReader", async () => {
        const adapter = new NoOpSharedLockAdapter();
        const spy = vi.spyOn(adapter, "refreshReader");

        const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

        await enhanced.refreshReader(
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
});
