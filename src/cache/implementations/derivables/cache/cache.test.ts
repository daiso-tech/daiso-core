import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { MemoryCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { cacheTestSuite } from "@/cache/implementations/test-utilities/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { LockFactory } from "@/lock/implementations/derivables/_module.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { ValidationError } from "@/utilities/_module.js";

describe("class: Cache", () => {
    cacheTestSuite({
        createCache: () =>
            new Cache({
                namespace: new Namespace("cache"),
                adapter: new MemoryCacheAdapter(),
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                defaultJitter: null,
            }),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("standard schema:", () => {
        let adapter: MemoryCacheAdapter;
        let cache: Cache<string>;
        const namespace = new Namespace("cache");
        beforeEach(() => {
            adapter = new MemoryCacheAdapter();
            cache = new Cache({
                namespace,
                adapter,
                schema: z.string(),
            });
        });
        describe("input validation:", () => {
            test("method: add", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.add("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: addOrFail", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.addOrFail("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: getOrAdd", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.getOrAdd("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: update", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.update("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: updateOrFail", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.updateOrFail("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: put", async () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const invalidInput: string = 0 as any;
                const promise = cache.put("a", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
        });
        describe("output validation:", () => {
            const noOpContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            );
            test("method: get", async () => {
                await adapter.add(
                    noOpContext,
                    namespace.create("a").toString(),
                    1,
                    null,
                );
                const promise = cache.get("a");
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: getOrFail", async () => {
                await adapter.add(
                    noOpContext,
                    namespace.create("a").toString(),
                    1,
                    null,
                );
                const promise = cache.getOrFail("a");
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: getAndRemove", async () => {
                await adapter.add(
                    noOpContext,
                    namespace.create("a").toString(),
                    1,
                    null,
                );
                const promise = cache.getAndRemove("a");
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: getOr", async () => {
                await adapter.add(
                    noOpContext,
                    namespace.create("a").toString(),
                    1,
                    null,
                );
                const promise = cache.getOr("a", "1");
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
            test("method: getOrAdd", async () => {
                await adapter.add(
                    noOpContext,
                    namespace.create("a").toString(),
                    1,
                    null,
                );
                const promise = cache.getOrAdd("a", "1");
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
        });
        describe("Locking:", () => {
            test("should call lockFactory.create().runOrFail() when enableLocking is true", async () => {
                const lockFactory = new LockFactory({
                    adapter: new NoOpLockAdapter(),
                });
                const createSpy = vi.spyOn(lockFactory, "create");
                const runOrFailSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const lockingCache = new Cache<string>({
                    namespace,
                    adapter: new MemoryCacheAdapter(),
                    lockFactory,
                });

                await lockingCache.getOrAdd("a", "value", {
                    enableLocking: true,
                });

                expect(createSpy).toHaveBeenCalledWith("a");
                expect(runOrFailSpy).toHaveBeenCalledOnce();
            });

            test("should not call lockFactory.create().runOrFail() when enableLocking is false", async () => {
                const lockFactory = new LockFactory({
                    adapter: new NoOpLockAdapter(),
                });
                const createSpy = vi.spyOn(lockFactory, "create");
                const runOrFailSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const lockingCache = new Cache<string>({
                    namespace,
                    adapter: new MemoryCacheAdapter(),
                    lockFactory,
                });

                await lockingCache.getOrAdd("a", "value", {
                    enableLocking: false,
                });

                expect(createSpy).not.toHaveBeenCalled();
                expect(runOrFailSpy).not.toHaveBeenCalled();
            });
        });
    });
});
