import { beforeEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { withSharedLockPrefix } from "@/shared-lock/implementations/plugins/with-shared-lock-prefix/with-shared-lock-prefix.js";

import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module.js";

describe("function: withSharedLockPrefix", () => {
    const adapter = new NoOpSharedLockAdapter();
    const prefix = "test-prefix:";
    const currentDate = new Date();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceRelease("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceRelease"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.getState("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["getState"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: acquireWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquireWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.acquireWriter("myKey", "lockId", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["acquireWriter"]>
            >(`${prefix}myKey`, "lockId", currentDate);
        });
    });

    describe("method: forceReleaseWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceReleaseWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceReleaseWriter("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceReleaseWriter"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: refreshWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refreshWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.refreshWriter("myKey", "lockId", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["refreshWriter"]>
            >(`${prefix}myKey`, "lockId", currentDate);
        });
    });

    describe("method: releaseWriter", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "releaseWriter");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.releaseWriter("myKey", "lockId");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["releaseWriter"]>
            >(`${prefix}myKey`, "lockId");
        });
    });

    describe("method: acquireReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquireReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.acquireReader({
                key: "myKey",
                lockId: "lock1",
                limit: 5,
                ttl: currentDate,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["acquireReader"]>
            >({
                key: `${prefix}myKey`,
                lockId: "lock1",
                limit: 5,
                ttl: currentDate,
            });
        });
    });

    describe("method: forceReleaseAllReaders", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceReleaseAllReaders");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.forceReleaseAllReaders("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["forceReleaseAllReaders"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: refreshReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refreshReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.refreshReader("myKey", "lockId", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["refreshReader"]>
            >(`${prefix}myKey`, "lockId", currentDate);
        });
    });

    describe("method: releaseReader", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "releaseReader");

            const enhanced = withPlugin(adapter, withSharedLockPrefix(prefix));

            await enhanced.releaseReader("myKey", "lockId");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISharedLockAdapter["releaseReader"]>
            >(`${prefix}myKey`, "lockId");
        });
    });
});
