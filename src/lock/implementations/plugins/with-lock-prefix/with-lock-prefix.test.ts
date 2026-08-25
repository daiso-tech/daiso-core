import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { withLockPrefix } from "@/lock/implementations/plugins/with-lock-prefix/with-lock-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { ILockAdapter } from "@/lock/contracts/_module.js";

describe("function: withLockPrefix", () => {
    const context = new NoOpContext();
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

            await enhanced.acquire("myKey", "lockId", currentDate, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["acquire"]>
            >(`${prefix}myKey`, "lockId", currentDate, context);
        });
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.forceRelease("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["forceRelease"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.refresh("myKey", "lockId", currentDate, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["refresh"]>
            >(`${prefix}myKey`, "lockId", currentDate, context);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.release("myKey", "lockId", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["release"]>
            >(`${prefix}myKey`, "lockId", context);
        });
    });
});
