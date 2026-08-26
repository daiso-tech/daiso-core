import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageLock } from "@/file-storage/implementations/plugins/with-file-storage-lock/with-file-storage-lock.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/no-op-lock-adapter.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withFileStorageLock", () => {
    const lockFactory = new LockFactory({ adapter: new NoOpLockAdapter() });
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("read methods", () => {
        describe("method: getPublicUrl", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getPublicUrl");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getPublicUrl("myKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });

            test("Should pass through the underlying adapter response", async () => {
                vi.spyOn(adapter, "getPublicUrl").mockResolvedValue(
                    "https://example.com/file",
                );

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                const result = await enhanced.getPublicUrl("myKey");

                expect(result).toBe("https://example.com/file");
            });
        });

        describe("method: exists", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "exists");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.exists("myKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getStream", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getStream");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getStream("myKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getBytes", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getBytes");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getBytes("myKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getMetaData", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getMetaData");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getMetaData("myKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getSignedDownloadUrl", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getSignedDownloadUrl");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getSignedDownloadUrl("myKey", {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: getSignedUploadUrl", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "getSignedUploadUrl");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.getSignedUploadUrl("myKey", {
                    expirationInSeconds: 3600,
                    contentType: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("mutation methods", () => {
        describe("method: add", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "add");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.add("myKey", {
                    data: new Uint8Array(),
                    fileSizeInBytes: 0,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: addStream", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "addStream");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.addStream("myKey", {
                    data: (async function* () {})(),
                    fileSizeInBytes: null,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: update", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "update");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.update("myKey", {
                    data: new Uint8Array(),
                    fileSizeInBytes: 0,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: updateStream", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "updateStream");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.updateStream("myKey", {
                    data: (async function* () {})(),
                    fileSizeInBytes: null,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: put", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "put");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.put("myKey", {
                    data: new Uint8Array(),
                    fileSizeInBytes: 0,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: putStream", () => {
            test("Should acquire lock", async () => {
                const spy = vi.spyOn(adapter, "putStream");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.putStream("myKey", {
                    data: (async function* () {})(),
                    fileSizeInBytes: null,
                    contentType: "application/octet-stream",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                });

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("myKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("copy/move methods", () => {
        describe("method: copy", () => {
            test("Should acquire lock on source key", async () => {
                const spy = vi.spyOn(adapter, "copy");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.copy("sourceKey", "destKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: copyAndReplace", () => {
            test("Should acquire lock on source key", async () => {
                const spy = vi.spyOn(adapter, "copyAndReplace");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.copyAndReplace("sourceKey", "destKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: move", () => {
            test("Should acquire lock on source key", async () => {
                const spy = vi.spyOn(adapter, "move");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.move("sourceKey", "destKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });

        describe("method: moveAndReplace", () => {
            test("Should acquire lock on source key", async () => {
                const spy = vi.spyOn(adapter, "moveAndReplace");
                const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
                const createSpy = vi.spyOn(lockFactory, "create");

                const enhanced = withPlugin(
                    adapter,
                    withFileStorageLock({ lockFactory }),
                );

                await enhanced.moveAndReplace("sourceKey", "destKey");

                expect(spy).toHaveBeenCalledOnce();
                expect(createSpy).toHaveBeenCalledWith("sourceKey");
                expect(runSpy).toHaveBeenCalledOnce();
            });
        });
    });

    describe("method: removeMany", () => {
        test("Should acquire lock for each key", async () => {
            const spy = vi.spyOn(adapter, "removeMany");
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
            );

            await enhanced.removeMany(["key1", "key2", "key3"]);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });

        test("Should deduplicate keys when acquiring locks", async () => {
            const spy = vi.spyOn(adapter, "removeMany");
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
            );

            await enhanced.removeMany(["key1", "key2", "key1", "key3"]);

            expect(spy).toHaveBeenCalledOnce();
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(createSpy).toHaveBeenCalledWith("key1");
            expect(createSpy).toHaveBeenCalledWith("key2");
            expect(createSpy).toHaveBeenCalledWith("key3");
            expect(runSpy).toHaveBeenCalledTimes(3);
        });

        test("Should pass through the underlying adapter response", async () => {
            vi.spyOn(adapter, "removeMany").mockResolvedValue(true);

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({ lockFactory }),
            );

            const result = await enhanced.removeMany(["key1", "key2"]);

            expect(result).toBe(true);
        });
    });

    describe("options", () => {
        test("Should only lock specified methods when onlyMethods is provided", async () => {
            const existsSpy = vi.spyOn(adapter, "exists");
            const runSpy = vi.spyOn(Lock.prototype, "runOrFail");
            const createSpy = vi.spyOn(lockFactory, "create");

            const enhanced = withPlugin(
                adapter,
                withFileStorageLock({
                    lockFactory,
                    onlyMethods: ["exists"],
                }),
            );

            await enhanced.exists("myKey");
            expect(createSpy).toHaveBeenCalledWith("myKey");
            expect(runSpy).toHaveBeenCalledTimes(1);

            vi.restoreAllMocks();
            vi.clearAllMocks();
            await enhanced.getBytes("myKey");
            expect(createSpy).not.toHaveBeenCalled();
            expect(runSpy).not.toHaveBeenCalled();
            expect(existsSpy).not.toHaveBeenCalled();
        });
    });
});
