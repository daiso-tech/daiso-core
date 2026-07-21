import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheWriteLock } from "@/cache/implementations/plugins/with-cache-write-lock/with-cache-write-lock.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/no-op-lock-adapter.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheWriteLock", () => {
    const context = new Context(new Map());
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    function createLockFactory(): LockFactory {
        return new LockFactory({ adapter: new NoOpLockAdapter() });
    }

    describe("method: add", () => {
        test("Should acquire lock", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            console.log("1.");
            await enhanced.add(
                context,
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
            );
            console.log("2.");

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledOnce();
        });
    });

    describe("method: put", () => {
        test("Should acquire lock", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.put(
                context,
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledOnce();
        });
    });

    describe("method: update", () => {
        test("Should acquire lock", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "update");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.update(context, "myKey", "newValue");

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledOnce();
        });
    });

    describe("method: increment", () => {
        test("Should acquire lock", async () => {
            const adapter = new NoOpCacheAdapter<number>();
            const spy = vi.spyOn(adapter, "increment");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.increment(context, "myKey", 5);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledOnce();
        });
    });

    describe("method: getAndRemove", () => {
        test("Should acquire lock", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "getAndRemove");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.getAndRemove(context, "myKey");

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledOnce();
        });

        test("Should pass through the underlying adapter response", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("storedValue");
            const lockFactory = createLockFactory();

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            const result = await enhanced.getAndRemove(context, "myKey");

            expect(result).toBe("storedValue");
        });
    });

    describe("method: removeMany", () => {
        test("Should acquire lock for each key", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "removeMany");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.removeMany(context, ["key1", "key2", "key3"]);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });
    });

    describe("options", () => {
        test("Should only lock specified methods when onlyMethods is provided", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const getSpy = vi.spyOn(adapter, "get");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({
                    lockFactory,
                    onlyMethods: ["add"],
                }),
            );

            await enhanced.add(
                context,
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
            );
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledTimes(1);

            vi.clearAllMocks();
            await enhanced.get(context, "myKey");
            expect(createSpy).not.toHaveBeenCalled();
            expect(runSpy).not.toHaveBeenCalled();
            expect(getSpy).toHaveBeenCalledOnce();
        });
    });
});
