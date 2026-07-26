import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheWriteLock } from "@/cache/implementations/plugins/with-cache-write-lock/with-cache-write-lock.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/no-op-lock-adapter.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheWriteLock", () => {
    const noOpContext = new NoOpContext();
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
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
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
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
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

            await enhanced.update("myKey", "newValue", noOpContext);

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

            await enhanced.increment("myKey", 5, noOpContext);

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

            await enhanced.getAndRemove("myKey", noOpContext);

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

            const result = await enhanced.getAndRemove("myKey", noOpContext);

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

            await enhanced.removeMany(["key1", "key2", "key3"], noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });

        test("Should deduplicate keys when acquiring locks", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "removeMany");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            await enhanced.removeMany(
                ["key1", "key2", "key1", "key3"],
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });

        test("Should pass through the underlying adapter response", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "removeMany").mockResolvedValue(true);
            const lockFactory = createLockFactory();

            const enhanced = withPlugin(
                adapter,
                withCacheWriteLock({ lockFactory }),
            );

            const result = await enhanced.removeMany(
                ["key1", "key2"],
                noOpContext,
            );

            expect(result).toBe(true);
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
                "myKey",
                "value",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledTimes(1);

            vi.clearAllMocks();
            await enhanced.get("myKey", noOpContext);
            expect(createSpy).not.toHaveBeenCalled();
            expect(runSpy).not.toHaveBeenCalled();
            expect(getSpy).toHaveBeenCalledOnce();
        });
    });
});
