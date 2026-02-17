/**
 * @module FileStorage
 */

import { Buffer } from "node:buffer";

import etag from "etag";

import {
    type IFileStorageAdapter,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
    FILE_WRITE_ENUM,
} from "@/file-storage/contracts/file-storage-adapter.contract.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export type MemoryFile = {
    data: Buffer;
    metadata: {
        etag: string;
        contentType: string;
        createdAt: Date;
        updatedAt: Date | null;
    };
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export class MemoryFileStorageAdapter implements IFileStorageAdapter {
    constructor(private readonly map = new Map<string, MemoryFile>()) {}

    exists(key: string): Promise<boolean> {
        return Promise.resolve(this.map.has(key));
    }

    getStream(key: string): Promise<FileAdapterStream | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                yield Promise.resolve(new Uint8Array(file.data.buffer));
            },
        } satisfies FileAdapterStream);
    }

    getBytes(key: string): Promise<Uint8Array | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(new Uint8Array(file.data.buffer));
    }

    getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            etag: file.metadata.etag,
            contentType: file.metadata.contentType,
            fileSizeInBytes: file.data.length,
            createdAt: file.metadata.createdAt,
            updatedAt: file.metadata.updatedAt,
        } satisfies FileAdapterMetadata);
    }

    add(key: string, content: WritableFileAdapterContent): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        const data = Buffer.from(content.data);
        this.map.set(key, {
            data,
            metadata: {
                etag: etag(data),
                contentType: content.contentType,
                createdAt: new Date(),
                updatedAt: null,
            },
        });
        return Promise.resolve(true);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of new ResolveFileStream(stream.data)) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                createdAt: new Date(),
                updatedAt: null,
            },
        });
        return Promise.resolve(true);
    }

    update(key: string, content: WritableFileAdapterContent): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }
        const data = Buffer.from(content.data);
        file = {
            data,
            metadata: {
                etag: etag(data),
                contentType: content.contentType,
                createdAt: file.metadata.createdAt,
                updatedAt: new Date(),
            },
        };
        return Promise.resolve(true);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of new ResolveFileStream(stream.data)) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        file = {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                createdAt: file.metadata.createdAt,
                updatedAt: new Date(),
            },
        };
        return Promise.resolve(true);
    }

    put(key: string, content: WritableFileAdapterContent): Promise<boolean> {
        const data = Buffer.from(content.data);
        const exists = this.map.has(key);
        this.map.set(key, {
            data,
            metadata: {
                etag: etag(data),
                contentType: content.contentType,
                createdAt: new Date(),
                updatedAt: null,
            },
        });
        return Promise.resolve(exists);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        let totalData = Buffer.from([]);
        for await (const chunk of new ResolveFileStream(stream.data)) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        const exists = this.map.has(key);
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                createdAt: new Date(),
                updatedAt: null,
            },
        });
        return Promise.resolve(exists);
    }

    copy(source: string, destination: string): Promise<FileWriteEnum> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(FILE_WRITE_ENUM.NOT_FOUND);
        }
        if (this.map.has(destination)) {
            return Promise.resolve(FILE_WRITE_ENUM.KEY_EXISTS);
        }
        const copiedBuffer = Buffer.from([]);
        copiedBuffer.copy(sourceFile.data);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: {
                ...sourceFile.metadata,
            },
        });
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    copyAndReplace(source: string, destination: string): Promise<boolean> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(false);
        }
        const copiedBuffer = Buffer.from([]);
        copiedBuffer.copy(sourceFile.data);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: {
                ...sourceFile.metadata,
            },
        });
        return Promise.resolve(true);
    }

    move(source: string, destination: string): Promise<FileWriteEnum> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(FILE_WRITE_ENUM.NOT_FOUND);
        }
        if (this.map.has(destination)) {
            return Promise.resolve(FILE_WRITE_ENUM.KEY_EXISTS);
        }
        const copiedBuffer = Buffer.from([]);
        copiedBuffer.copy(sourceFile.data);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: {
                ...sourceFile.metadata,
            },
        });
        this.map.delete(source);
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    moveAndReplace(source: string, destination: string): Promise<boolean> {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return Promise.resolve(false);
        }
        const copiedBuffer = Buffer.from([]);
        copiedBuffer.copy(sourceFile.data);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: {
                ...sourceFile.metadata,
            },
        });
        this.map.delete(source);
        return Promise.resolve(true);
    }

    removeMany(keys: Array<string>): Promise<boolean> {
        let hasDeleted = false;
        for (const key of keys) {
            const hasDeleted_ = this.map.delete(key);
            if (hasDeleted_) {
                hasDeleted = true;
            }
        }
        return Promise.resolve(hasDeleted);
    }

    removeByPrefix(prefix: string): Promise<void> {
        for (const [key] of this.map) {
            if (!key.startsWith(prefix)) {
                continue;
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }
}
