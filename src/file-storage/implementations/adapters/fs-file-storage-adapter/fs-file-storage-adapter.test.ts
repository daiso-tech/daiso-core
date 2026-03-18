import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { type FileAdapterMetadata } from "@/file-storage/contracts/file-storage-adapter.contract.js";
import { FsFileStorageAdapter } from "@/file-storage/implementations/adapters/fs-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module.js";

describe("class: FsFileStorageAdapter", () => {
    let adapter: FsFileStorageAdapter;
    let folderPath: string;
    beforeEach(async () => {
        folderPath = await mkdtemp(
            join(tmpdir(), "fs-file-storage-adapter-tests-"),
        );
        adapter = new FsFileStorageAdapter({
            location: folderPath,
        });
        await adapter.init();
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
        enableGetMetaData: false,
    });
    describe("method: getMetadata", () => {
        test("Should return null when key does not exists", async () => {
            const noneExistingKey = "a";

            const result = await adapter.getMetaData(noneExistingKey);

            expect(result).toBeNull();
        });
        test("Should return content-type application/json when file name contains json extension", async () => {
            const key = "a.json";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "text/plain";
            await adapter.add(key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });
            const result = await adapter.getMetaData(key);

            expect(result).toEqual({
                etag: expect.any(String) as string,
                contentType: "application/json",
                fileSizeInBytes: data.byteLength,
                updatedAt: expect.any(Date) as Date,
            } satisfies FileAdapterMetadata);
        });
        test("Should return content-type text/plain when file name contains txt extension", async () => {
            const key = "a.txt";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/json";
            await adapter.add(key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });
            const result = await adapter.getMetaData(key);

            expect(result).toEqual({
                etag: expect.any(String) as string,
                contentType: "text/plain",
                fileSizeInBytes: data.byteLength,
                updatedAt: expect.any(Date) as Date,
            } satisfies FileAdapterMetadata);
        });
        test("Should return content-type application/octet stream when file name contains unknown extension", async () => {
            const key = "a.unknown";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/json";
            await adapter.add(key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });
            const result = await adapter.getMetaData(key);

            expect(result).toEqual({
                etag: expect.any(String) as string,
                contentType: "application/octet-stream",
                fileSizeInBytes: data.byteLength,
                updatedAt: expect.any(Date) as Date,
            } satisfies FileAdapterMetadata);
        });
    });
    describe("method: init", () => {
        test("Should create the folder", async () => {
            const folderPath = await mkdtemp(
                join(tmpdir(), "fs-file-storage-adapter-tests-"),
            );
            const adapter = new FsFileStorageAdapter({
                location: folderPath,
            });
            await adapter.init();

            expect(existsSync(folderPath)).toBe(true);
        });
        test("Should not throw error when called multiple times", async () => {
            const folderPath = await mkdtemp(
                join(tmpdir(), "fs-file-storage-adapter-tests-"),
            );
            const adapter = new FsFileStorageAdapter({
                location: folderPath,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove the folder", async () => {
            const folderPath = await mkdtemp(
                join(tmpdir(), "fs-file-storage-adapter-tests-"),
            );
            const adapter = new FsFileStorageAdapter({
                location: folderPath,
            });
            await adapter.init();

            await adapter.deInit();

            expect(existsSync(folderPath)).toBe(false);
        });
        test("Should not throw error when called multiple times", async () => {
            const folderPath = await mkdtemp(
                join(tmpdir(), "fs-file-storage-adapter-tests-"),
            );
            const adapter = new FsFileStorageAdapter({
                location: folderPath,
            });
            await adapter.init();

            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
