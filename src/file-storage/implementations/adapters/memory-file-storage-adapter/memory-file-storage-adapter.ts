/**
 * @module FileStorage
 */

import { Buffer } from "node:buffer";

import etag from "etag";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    FILE_WRITE_ENUM,
} from "@/file-storage/contracts/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IFileStorage,
    IFileStorageAdapter,
    FileAdapterMetadata,
    FileAdapterStream,
    FileWriteEnum,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import type { IDeinitizable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export type MemoryFile = {
    data: Buffer;
    metadata: {
        etag: string;
        contentType: string;
        updatedAt: Date;
    };
};

/**
 * The `MemoryFileStorageAdapter` is used for easily facking {@link IFileStorage | `IFileStorage`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export class MemoryFileStorageAdapter
    implements IFileStorageAdapter, IDeinitizable
{
    /**
     * You can provide an optional {@link Map | `Map`}, that will be used for storing the data.
     * @example
     * ```ts
     * import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
     *
     * const map = new Map<string, any>();
     * const fileStorageAdapter = new MemoryFileStorageAdapter(map);
     * ```
     */
    constructor(private readonly map = new Map<string, MemoryFile>()) {}

    /**
     * Removes all in-memory file data.
     */
    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    exists(key: string, _context: IReadableContext): Promise<boolean> {
        return Promise.resolve(this.map.has(key));
    }

    getStream(
        key: string,
        _context: IReadableContext,
    ): Promise<FileAdapterStream | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                yield Promise.resolve(new Uint8Array(file.data));
            },
        } satisfies FileAdapterStream);
    }

    getBytes(
        key: string,
        _context: IReadableContext,
    ): Promise<Uint8Array | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(new Uint8Array(file.data));
    }

    getMetaData(
        key: string,
        _context: IReadableContext,
    ): Promise<FileAdapterMetadata | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(
            structuredClone({
                etag: file.metadata.etag,
                contentType: file.metadata.contentType,
                fileSizeInBytes: file.data.length,
                updatedAt: file.metadata.updatedAt,
            }) satisfies FileAdapterMetadata,
        );
    }

    add(
        key: string,
        content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        this.map.set(key, {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(true);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(true);
    }

    update(
        key: string,
        content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }

        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        file = {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        };
        this.map.set(key, file);
        return Promise.resolve(true);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        file = {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        };
        this.map.set(key, file);
        return Promise.resolve(true);
    }

    put(
        key: string,
        content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        const exists = this.map.has(key);
        this.map.set(key, {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(exists);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        const exists = this.map.has(key);
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(exists);
    }

    private internalCopy(
        source: string,
        destination: string,
        _context: IReadableContext,
    ): Promise<FileWriteEnum> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(FILE_WRITE_ENUM.NOT_FOUND);
        }
        if (this.map.has(destination)) {
            return Promise.resolve(FILE_WRITE_ENUM.KEY_EXISTS);
        }
        const copiedBuffer = Buffer.alloc(sourceFile.data.byteLength);
        sourceFile.data.copy(copiedBuffer);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: structuredClone(sourceFile.metadata),
        });
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    copy(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<FileWriteEnum> {
        return this.internalCopy(source, destination, context);
    }

    private internalCopyAndReplace(
        source: string,
        destination: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(false);
        }
        const copiedBuffer = Buffer.alloc(sourceFile.data.byteLength);
        sourceFile.data.copy(copiedBuffer);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: structuredClone(sourceFile.metadata),
        });
        return Promise.resolve(true);
    }

    copyAndReplace(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<boolean> {
        return this.internalCopyAndReplace(source, destination, context);
    }

    private internalRemoveMany(
        keys: Array<string>,
        _context: IReadableContext,
    ): Promise<boolean> {
        let hasDeleted = false;
        for (const key of keys) {
            const hasDeleted_ = this.map.delete(key);
            if (hasDeleted_) {
                hasDeleted = true;
            }
        }
        return Promise.resolve(hasDeleted);
    }

    async move(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<FileWriteEnum> {
        const result = await this.internalCopy(source, destination, context);
        if (result === FILE_WRITE_ENUM.SUCCESS) {
            await this.internalRemoveMany([source], context);
        }
        return result;
    }

    async moveAndReplace(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<boolean> {
        const hasMoved = await this.internalCopyAndReplace(
            source,
            destination,
            context,
        );
        if (hasMoved) {
            await this.internalRemoveMany([source], context);
        }
        return hasMoved;
    }

    removeMany(
        keys: Array<string>,
        context: IReadableContext,
    ): Promise<boolean> {
        return this.internalRemoveMany(keys, context);
    }

    removeByPrefix(prefix: string, _context: IReadableContext): Promise<void> {
        for (const [key] of this.map) {
            if (!key.startsWith(prefix)) {
                continue;
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }
}
