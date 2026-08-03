import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { type ILockAdapter } from "@/lock/contracts/_module.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { withLockPrefix } from "@/lock/implementations/plugins/with-lock-prefix/with-lock-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withLockPrefix", () => {
    const noOpContext = new NoOpContext();
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
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["acquire"]>
            >(
                `${prefix}myKey`,
                "lockId",
                TimeSpan.fromSeconds(30),
                noOpContext,
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "forceRelease");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.forceRelease("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["forceRelease"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });

    describe("method: getState", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "getState");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.getState("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["getState"]>
            >(`${prefix}myKey`, noOpContext);
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
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["refresh"]>
            >(
                `${prefix}myKey`,
                "lockId",
                TimeSpan.fromSeconds(30),
                noOpContext,
            );
        });
    });

    describe("method: release", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpLockAdapter();
            const spy = vi.spyOn(adapter, "release");

            const enhanced = withPlugin(adapter, withLockPrefix(prefix));

            await enhanced.release("myKey", "lockId", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ILockAdapter["release"]>
            >(`${prefix}myKey`, "lockId", noOpContext);
        });
    });
});
