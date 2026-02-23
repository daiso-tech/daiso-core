import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
    MemoryFileStorageAdapter,
    type MemoryFile,
} from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/file-storage-adapter.test-suite.js";

describe("class: MemoryFileStorageAdapter", () => {
    let map = new Map<string, MemoryFile>();
    let adapter: MemoryFileStorageAdapter;
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
});
