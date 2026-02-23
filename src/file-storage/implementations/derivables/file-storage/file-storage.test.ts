import { beforeEach, describe, expect, test } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module.js";
import { FileStorage } from "@/file-storage/implementations/derivables/file-storage/file-storage.js";
import { fileStorageTestSuite } from "@/file-storage/implementations/test-utilities/file-storage.test-suite.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";

describe("class: FileStorage", () => {
    fileStorageTestSuite({
        createFileStorage: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const fileStorage = new FileStorage({
                serde,
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                adapter: new MemoryFileStorageAdapter(),
                namespace: new Namespace("file-storag"),
            });
            return {
                fileStorage,
                serde,
            };
        },
        beforeEach,
        describe,
        expect,
        test,
    });
    describe("method: getPublicUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: getSignedUploadUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: getSignedDownloadUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: getSignedDownloadUrlOrFail", () => {
        test.todo("Write tests!!!");
    });
    describe("Serde tests:", () => {
        test.todo("Should differentiate between different namespaces");
        test.todo(
            "Should differentiate between different adapters and the same namespace",
        );
        test.todo(
            "Should differentiate between different serdeTransformerNames",
        );
    });
});
