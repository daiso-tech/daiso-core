import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageLock } from "@/file-storage/implementations/plugins/with-file-storage-lock/with-file-storage-lock.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/no-op-lock-adapter.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withFileStorageLock", () => {
    const noOpContext = new NoOpContext();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });

    function createLockFactory(): LockFactory {
        return new LockFactory({ adapter: new NoOpLockAdapter() });
    }

    describe("read methods", () => {
        describe("method: getPublicUrl", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getPublicUrl");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getPublicUrl("myKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });

            test("Should pass through the underlying adapter response", async () => {
                const adapter = new NoOpFileStorageAdapter();
                vi.spyOn(adapter, "getPublicUrl").mockResolvedValue(
                    "https://example.com/file",
                );
                const lockFactory = createLockFactory();

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                const result = await enhanced.getPublicUrl(
                    "myKey",
                    noOpContext,
                );

                expect(result).toBe("https://example.com/file");
            });
        });

        describe("method: exists", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "exists");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.exists("myKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getStream", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getStream");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getStream("myKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getBytes", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getBytes");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getBytes("myKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getMetaData", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getMetaData");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getMetaData("myKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getSignedDownloadUrl", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getSignedDownloadUrl");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getSignedDownloadUrl(
                    "myKey",
                    {
                        expirationInSeconds: 3600,
                        contentType: null,
                        contentDisposition: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getSignedUploadUrl", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "getSignedUploadUrl");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getSignedUploadUrl(
                    "myKey",
                    {
                        expirationInSeconds: 3600,
                        contentType: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("mutation methods", () => {
        describe("method: add", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "add");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.add(
                    "myKey",
                    {
                        data: new Uint8Array(),
                        fileSizeInBytes: 0,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: addStream", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "addStream");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.addStream(
                    "myKey",
                    {
                        data: (async function* () {})() as unknown as ReadableStream,
                        fileSizeInBytes: null,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: update", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "update");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.update(
                    "myKey",
                    {
                        data: new Uint8Array(),
                        fileSizeInBytes: 0,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: updateStream", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "updateStream");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.updateStream(
                    "myKey",
                    {
                        data: (async function* () {})() as unknown as ReadableStream,
                        fileSizeInBytes: null,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: put", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "put");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.put(
                    "myKey",
                    {
                        data: new Uint8Array(),
                        fileSizeInBytes: 0,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: putStream", () => {
            test("Should acquire lock", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "putStream");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.putStream(
                    "myKey",
                    {
                        data: (async function* () {})() as unknown as ReadableStream,
                        fileSizeInBytes: null,
                        contentType: "application/octet-stream",
                        contentLanguage: null,
                        contentEncoding: null,
                        contentDisposition: null,
                        cacheControl: null,
                    },
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("copy/move methods", () => {
        describe("method: copy", () => {
            test("Should acquire lock on source key", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "copy");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.copy("sourceKey", "destKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: copyAndReplace", () => {
            test("Should acquire lock on source key", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "copyAndReplace");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.copyAndReplace(
                    "sourceKey",
                    "destKey",
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: move", () => {
            test("Should acquire lock on source key", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "move");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.move("sourceKey", "destKey", noOpContext);

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: moveAndReplace", () => {
            test("Should acquire lock on source key", async () => {
                const adapter = new NoOpFileStorageAdapter();
                const spy = vi.spyOn(adapter, "moveAndReplace");
                const lockFactory = createLockFactory();
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.moveAndReplace(
                    "sourceKey",
                    "destKey",
                    noOpContext,
                );

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("method: removeMany", () => {
        test("Should acquire lock for each key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeMany");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
            );

            await enhanced.removeMany(["key1", "key2", "key3"], noOpContext);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });

        test("Should deduplicate keys when acquiring locks", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeMany");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
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
            const adapter = new NoOpFileStorageAdapter();
            vi.spyOn(adapter, "removeMany").mockResolvedValue(true);
            const lockFactory = createLockFactory();

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
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
            const adapter = new NoOpFileStorageAdapter();
            const existsSpy = vi.spyOn(adapter, "exists");
            const lockFactory = createLockFactory();
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({
                    lockFactory,
                    onlyMethods: ["exists"],
                }),
            );

            await enhanced.exists("myKey", noOpContext);
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledTimes(1);

            vi.clearAllMocks();
            await enhanced.getBytes("myKey", noOpContext);
            expect(createSpy).not.toHaveBeenCalled();
            expect(runSpy).not.toHaveBeenCalled();
            expect(existsSpy).not.toHaveBeenCalled();
        });
    });
});
