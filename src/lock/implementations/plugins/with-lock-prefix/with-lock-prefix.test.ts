import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { withLockPrefix } from "@/lock/implementations/plugins/with-lock-prefix/with-lock-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { ILockAdapter } from "@/lock/contracts/_module.js";

describe("function: withLockPrefix", () => {
    const adapter = new NoOpLockAdapter();
    const prefix = "test-prefix:";
    const currentDate = new Date();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: acquire", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "acquire");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.acquire("myKey", "lockId", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["acquire"]>
            >(`${prefix}myKey`, "lockId", currentDate);
        });
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.forceRelease("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["forceRelease"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.getState("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["getState"]>
            >(`${prefix}myKey`);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.refresh("myKey", "lockId", currentDate);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["refresh"]>
            >(`${prefix}myKey`, "lockId", currentDate);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.release("myKey", "lockId");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["release"]>
            >(`${prefix}myKey`, "lockId");
        });
    });
});
