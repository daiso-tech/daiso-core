import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { type ILockAdapter } from "@/lock/contracts/lock-adapter.contract.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { withLockPrefix } from "@/lock/implementations/plugins/with-lock-prefix/with-lock-prefix.js";
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

    describe("method: acquire", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "acquire");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.acquire(
                "myKey",
                "lockId",
                TimeSpan.fromSeconds(30),
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ILockAdapter["acquire"]>
            >(`${prefix}myKey`, "lockId", TimeSpan.fromSeconds(30), context);
        });
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.forceRelease("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ILockAdapter["forceRelease"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.getState("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ILockAdapter["getState"]>
            >(`${prefix}myKey`, context);
        });
    });

    describe("method: refresh", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "refresh");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.refresh(
                "myKey",
                "lockId",
                TimeSpan.fromSeconds(30),
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ILockAdapter["refresh"]>
            >(`${prefix}myKey`, "lockId", TimeSpan.fromSeconds(30), context);
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.release("myKey", "lockId", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ILockAdapter["release"]>
            >(`${prefix}myKey`, "lockId", context);
        });
    });
});
