/**
 * @module FileStorage
 */

import { createReadStream, createWriteStream } from "node:fs";
import * as fs from "node:fs/promises";
import { join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";

import etag from "etag";
import { lookup } from "mime-types";

import { type ICodec } from "@/codec/contracts/_module.js";
import { Base64Codec } from "@/codec/implementations/base-64-codec/_module.js";
import {
    FILE_WRITE_ENUM,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type IFileStorageAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/fs-file-storage-adapter"`
 * @group Adapters
 */
export type FsFileStorageAdapterSettings = {
    /**
     * @default
     * ```ts
     * new URL('./uploads', import.meta.url)
     * ```
     */
    location?: string;

    /**
     * @default
     * ```ts
     * import { Base64Codec } from "@daiso-tech/core/codec/base-64-codec"
     *
     * new Base64Codec()
     * ```
     */
    codec?: ICodec<string, string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/fs-file-storage-adapter"`
 * @group Adapters
 */
export class FsFileStorageAdapter implements IFileStorageAdapter {
    private readonly codec: ICodec<string, string>;
    private readonly location: string;

    constructor(settings: FsFileStorageAdapterSettings = {}) {
        const {
            codec = new Base64Codec(),
            location = new URL("./uploads", import.meta.url).toString(),
        } = settings;
        this.location = location;
        this.codec = codec;
    }

    private static isFileNotFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "ENOENT"
        );
    }

    private static isFileFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "EEXIST "
        );
    }

    private static async isFileFound(key: string): Promise<boolean> {
        const stat = await fs.stat(key);
        return stat.isFile();
    }

    private normalizeKey(key: string): string {
        return join(this.location, this.codec.encode(key));
    }

    async exists(key: string): Promise<boolean> {
        const normalizeKey = this.normalizeKey(key);
        return FsFileStorageAdapter.isFileFound(normalizeKey);
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        const normalizeKey = this.normalizeKey(key);
        if (await FsFileStorageAdapter.isFileFound(normalizeKey)) {
            return null;
        }
        return createReadStream(normalizeKey);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        try {
            const normalizeKey = this.normalizeKey(key);
            const file = await fs.readFile(normalizeKey);
            return new Uint8Array(file);
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        const normalizeKey = this.normalizeKey(key);
        const stat = await fs.stat(normalizeKey);
        let contentType = lookup(key);
        if (contentType === false) {
            contentType = "application/octet-stream";
        }
        return {
            etag: etag(stat),
            contentType,
            fileSizeInBytes: stat.size,
            createdAt: stat.birthtime,
            updatedAt: stat.birthtimeMs === stat.mtimeMs ? null : stat.mtime,
        } satisfies FileAdapterMetadata;
    }

    async add(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            const normalizeKey = this.normalizeKey(key);
            await fs.writeFile(normalizeKey, content.data, {
                flag: "wx",
            });
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            const normalizeKey = this.normalizeKey(key);
            const writeStream = createWriteStream(normalizeKey, {
                flags: "wx",
            });
            await pipeline(stream.data, writeStream);
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async update(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            const normalizeKey = this.normalizeKey(key);
            await fs.writeFile(normalizeKey, content.data, {
                flag: "x",
            });
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            const normalizeKey = this.normalizeKey(key);
            const writeStream = createWriteStream(normalizeKey, {
                flags: "x",
            });
            await pipeline(stream.data, writeStream);
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        const normalizeKey = this.normalizeKey(key);
        const isFound = await FsFileStorageAdapter.isFileFound(normalizeKey);
        await fs.writeFile(normalizeKey, content.data);
        return isFound;
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        const normalizeKey = this.normalizeKey(key);
        const isFound = await FsFileStorageAdapter.isFileFound(normalizeKey);
        const writeStream = createWriteStream(normalizeKey);
        await pipeline(stream.data, writeStream);
        return isFound;
    }

    async copy(source: string, destination: string): Promise<FileWriteEnum> {
        try {
            const normalizeSource = this.normalizeKey(source);
            const normalizeDestination = this.normalizeKey(destination);
            await fs.copyFile(
                normalizeSource,
                normalizeDestination,
                fs.constants.COPYFILE_EXCL,
            );
            return FILE_WRITE_ENUM.SUCCESS;
        } catch (error: unknown) {
            // The source does not exists
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return FILE_WRITE_ENUM.NOT_FOUND;
            }
            // The destination does already exists
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return FILE_WRITE_ENUM.KEY_EXISTS;
            }
            throw error;
        }
    }

    async copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        try {
            const normalizeSource = this.normalizeKey(source);
            const normalizeDestination = this.normalizeKey(destination);
            await fs.copyFile(
                normalizeSource,
                normalizeDestination,
                fs.constants.COPYFILE_EXCL,
            );
            return true;
        } catch (error: unknown) {
            // The source does not exists
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async move(source: string, destination: string): Promise<FileWriteEnum> {
        const result = await this.copy(source, destination);
        await this.removeMany([source]);
        return result;
    }

    async moveAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        const result = await this.copyAndReplace(source, destination);
        await this.removeMany([source]);
        return result;
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        const promises = [
            ...new Set(
                keys.map((key) => {
                    return this.normalizeKey(key);
                }),
            ),
        ].map(async (normalizeKey) => {
            try {
                await fs.rm(normalizeKey);
                return true;
            } catch (error: unknown) {
                if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                    return false;
                }
                throw error;
            }
        });
        const results = await Promise.all(promises);
        for (const result of results) {
            if (result) {
                return true;
            }
        }
        return false;
    }

    async removeByPrefix(prefix: string): Promise<void> {
        const encodedFiles = await fs.readdir(normalize(prefix), {
            recursive: true,
        });
        for (const encodedFile of encodedFiles) {
            const decodedFile = this.codec.decode(encodedFile);
            if (!decodedFile.startsWith(prefix)) {
                continue;
            }
            try {
                await fs.rm(encodedFile);
            } catch {
                /* EMPTY */
            }
        }
    }
}
