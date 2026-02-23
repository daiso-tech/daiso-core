import { mkdtemp, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { FsFileStorageAdapter } from "@/file-storage/implementations/adapters/fs-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/file-storage-adapter.test-suite.js";

describe("class: FsFileStorageAdapter", () => {
    let adapter: FsFileStorageAdapter;
    let folderPath: string;
    beforeEach(async () => {
        folderPath = await mkdtemp(join(tmpdir(), "daiso-tech-core-tests"));
        adapter = new FsFileStorageAdapter({
            location: folderPath,
        });
    });
    afterEach(async () => {
        await rmdir(folderPath);
    });
    fileStorageAdapterTestSuite({
        createAdapter: () => adapter,
        test,
        beforeEach,
        expect,
        describe,
    });
});
