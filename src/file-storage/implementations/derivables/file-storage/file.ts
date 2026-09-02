/**
 * @module FileStorage
 */

import { TO_BYTES } from "@/file-size/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import {
    KeyExistsFileError,
    KeyNotFoundFileError,
    FILE_WRITE_ENUM,
} from "@/file-storage/contracts/_module.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type {
    IFile,
    ISignedFileStorageAdapter,
    FileMetadata,
    WritableFileStream,
    FileDownloadUrlOptions,
    WritableFileContent,
    FileUploadUrlOptions,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export type FileSettings = {
    originalKey: string;
    adapter: ISignedFileStorageAdapter;
    key: string;
    serdeTransformerName: string;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
};

/**
 * @internal
 */
export type ISerializedFile = {
    version: "1";
    key: string;
};

/**
 * @internal
 */
export class File implements IFile {
    /**
     * @internal
     */
    static internalSerialize(deserializedValue: File): ISerializedFile {
        return {
            version: "1",
            key: deserializedValue.internalKey,
        };
    }

    private static readonly DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private readonly adapter: ISignedFileStorageAdapter;
    private readonly internalKey: string;
    private readonly serdeTransformerName: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;

    constructor(settings: FileSettings) {
        const {
            adapter,
            key,
            serdeTransformerName,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultCacheControl,
            defaultContentLanguage,
        } = settings;

        this.adapter = adapter;
        this.internalKey = key;
        this.serdeTransformerName = serdeTransformerName;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
    }

    internalGetSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    internalGetAdapter(): ISignedFileStorageAdapter {
        return this.adapter;
    }

    async getText(): Promise<string | null> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            return null;
        }
        return new TextDecoder().decode(bytes);
    }

    async getTextOrFail(): Promise<string> {
        const text = await this.getText();
        if (text === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return text;
    }

    async getBytes(): Promise<Uint8Array | null> {
        return await this.adapter.getBytes(this.internalKey);
    }

    async getBytesOrFail(): Promise<Uint8Array> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return bytes;
    }

    async getArrayBuffer(): Promise<ArrayBuffer | null> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            return null;
        }
        return new Uint8Array(bytes).buffer;
    }

    async getArrayBufferOrFail(): Promise<ArrayBuffer> {
        const arrayBuffer = await this.getArrayBuffer();
        if (arrayBuffer === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return arrayBuffer;
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        const stream = await this.adapter.getStream(this.internalKey);
        if (stream === null) {
            return null;
        }
        return ReadableStream.from(stream);
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        const stream = await this.getReadableStream();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return stream;
    }

    async getMetadata(): Promise<FileMetadata | null> {
        const metadata = await this.adapter.getMetaData(this.internalKey);
        if (metadata === null) {
            return null;
        }
        return {
            contentType: metadata.contentType ?? "application/octet-stream",
            etag: metadata.etag,
            updatedAt: metadata.updatedAt,
            fileSize: FileSize.fromBytes(metadata.fileSizeInBytes),
        };
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        const metadata = await this.getMetadata();
        if (metadata === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return metadata;
    }

    async exists(): Promise<boolean> {
        return await this.adapter.exists(this.internalKey);
    }

    async missing(): Promise<boolean> {
        return !(await this.exists());
    }

    async add(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = File.DEFAULT_CONTENT_TYPE } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.add(this.internalKey, {
            data: resolvedData,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
            fileSizeInBytes: resolvedData.length,
        });
    }

    async addOrFail(content: WritableFileContent): Promise<void> {
        const hasAdded = await this.add(content);
        if (!hasAdded) {
            throw KeyExistsFileError.create(this.internalKey);
        }
    }

    async addStream(stream: WritableFileStream): Promise<boolean> {
        const {
            data,
            fileSize = null,
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = stream;

        return await this.adapter.addStream(this.internalKey, {
            data: new ResolveFileStream(data),
            fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
        });
    }

    async addStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasAdded = await this.addStream(stream);
        if (!hasAdded) {
            throw KeyExistsFileError.create(this.internalKey);
        }
    }

    async update(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = File.DEFAULT_CONTENT_TYPE } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.update(this.internalKey, {
            data: resolvedData,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
            fileSizeInBytes: resolvedData.length,
        });
    }

    async updateOrFail(content: WritableFileContent): Promise<void> {
        const hasUpdated = await this.update(content);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async updateStream(stream: WritableFileStream): Promise<boolean> {
        const {
            data,
            fileSize = null,
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = stream;
        return await this.adapter.updateStream(this.internalKey, {
            data: new ResolveFileStream(data),
            fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
        });
    }

    async updateStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasUpdated = await this.updateStream(stream);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async put(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = File.DEFAULT_CONTENT_TYPE } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.put(this.internalKey, {
            data: resolvedData,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
            fileSizeInBytes: resolvedData.length,
        });
    }

    async putStream(stream: WritableFileStream): Promise<boolean> {
        const {
            data,
            fileSize = null,
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = stream;
        return await this.adapter.putStream(this.internalKey, {
            data: new ResolveFileStream(data),
            fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
        });
    }

    async remove(): Promise<boolean> {
        return await this.adapter.removeMany([this.internalKey]);
    }

    async removeOrFail(): Promise<void> {
        const hasFound = await this.remove();
        if (!hasFound) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async copy(destination: string): Promise<boolean> {
        const result = await this.adapter.copy(this.internalKey, destination);
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async copyOrFail(destination: string): Promise<void> {
        const result = await this.adapter.copy(this.internalKey, destination);
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this.internalKey);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async copyAndReplace(destination: string): Promise<boolean> {
        return await this.adapter.copyAndReplace(this.internalKey, destination);
    }

    async copyAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.copyAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async move(destination: string): Promise<boolean> {
        const result = await this.adapter.move(this.internalKey, destination);
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async moveOrFail(destination: string): Promise<void> {
        const result = await this.adapter.move(this.internalKey, destination);
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this.internalKey);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async moveAndReplace(destination: string): Promise<boolean> {
        return await this.adapter.moveAndReplace(this.internalKey, destination);
    }

    async moveAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.moveAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async getPublicUrl(): Promise<string | null> {
        return await this.adapter.getPublicUrl(this.internalKey);
    }

    async getPublicUrlOrFail(): Promise<string> {
        const url = await this.getPublicUrl();
        if (url === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return url;
    }

    async getSignedUploadUrl(
        options: FileUploadUrlOptions = {},
    ): Promise<string> {
        const {
            ttl = TimeSpan.fromMinutes(10),
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = options;
        return await this.adapter.getSignedUploadUrl(this.internalKey, {
            expirationInSeconds: TimeSpan.fromTimeSpan(ttl).toSeconds(),
            contentType,
        });
    }

    async getSignedDownloadUrl(
        options: FileDownloadUrlOptions = {},
    ): Promise<string | null> {
        const {
            ttl: expiration = TimeSpan.fromMinutes(10),
            contentType = File.DEFAULT_CONTENT_TYPE,
            contentDisposition = null,
        } = options;
        return await this.adapter.getSignedDownloadUrl(this.internalKey, {
            expirationInSeconds: TimeSpan.fromTimeSpan(expiration).toSeconds(),
            contentType,
            contentDisposition,
        });
    }

    async getSignedDownloadUrlOrFail(
        options?: FileDownloadUrlOptions,
    ): Promise<string> {
        const url = await this.getSignedDownloadUrl(options);
        if (url === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return url;
    }

    get key(): string {
        return this.internalKey;
    }
}
