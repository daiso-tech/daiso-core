import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { withSharedLockPrefix } from "@/shared-lock/implementations/plugins/with-shared-lock-prefix/with-shared-lock-prefix.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module.js";

describe("function: withSharedLockPrefix", () => {
    const context = new NoOpContext();
    const adapter = new NoOpSharedLockAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceRelease("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceRelease"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: acquireWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquireWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.acquireWriter(
                "myKey",
                "lockId",
                TimeSpan.fromSeconds(30),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["acquireWriter"]>
            >(`${prefix}myKey`, "lockId", TimeSpan.fromSeconds(30), context);
        });
    });

    describe("method: forceReleaseWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceReleaseWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceReleaseWriter("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceReleaseWriter"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: refreshWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refreshWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.refreshWriter(
                "myKey",
                "lockId",
                TimeSpan.fromSeconds(30),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["refreshWriter"]>
            >(`${prefix}myKey`, "lockId", TimeSpan.fromSeconds(30), context);
        });
    });

    describe("method: releaseWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "releaseWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.releaseWriter("myKey", "lockId", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["releaseWriter"]>
            >(`${prefix}myKey`, "lockId", context);
        });
    });

    describe("method: acquireReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquireReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.acquireReader({
                context,
                key: "myKey",
                lockId: "lock1",
                limit: 5,
                ttl: TimeSpan.fromSeconds(30),
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["acquireReader"]>
            >({
                context,
                key: `${prefix}myKey`,
                lockId: "lock1",
                limit: 5,
                ttl: TimeSpan.fromSeconds(30),
            });
        });
    });

    describe("method: forceReleaseAllReaders", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceReleaseAllReaders");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceReleaseAllReaders("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceReleaseAllReaders"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: refreshReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refreshReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.refreshReader(
                "myKey",
                "lockId",
                TimeSpan.fromSeconds(30),
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["refreshReader"]>
            >(`${prefix}myKey`, "lockId", TimeSpan.fromSeconds(30), context);
        });
    });

    describe("method: releaseReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "releaseReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.releaseReader("myKey", "lockId", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["releaseReader"]>
            >(`${prefix}myKey`, "lockId", context);
        });
    });
});
