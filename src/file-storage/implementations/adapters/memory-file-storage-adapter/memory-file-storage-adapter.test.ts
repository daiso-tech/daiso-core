import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type WritableFileAdapterContent } from "@/file-storage/contracts/file-storage-adapter.contract.js";
import {
    MemoryFileStorageAdapter,
    type MemoryFile,
} from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module.js";

describe("class: MemoryFileStorageAdapter", () => {
    let map = new Map<string, MemoryFile>();
    let adapter: MemoryFileStorageAdapter;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());
    beforeEach(() => {
        map = new Map();
        adapter = new MemoryFileStorageAdapter(map);
    });
    afterEach(async () => {
        await adapter.deInit();
    });
    fileStorageAdapterTestSuite({
        createAdapter: () => adapter,
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "text/plain";
            const content: WritableFileAdapterContent = {
                data,
                fileSizeInBytes: data.byteLength,
                contentType,
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await adapter.add(noOpContext, "a", content);
            await adapter.add(noOpContext, "a", content);
            await adapter.add(noOpContext, "b", content);
            await adapter.add(noOpContext, "b", content);

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
