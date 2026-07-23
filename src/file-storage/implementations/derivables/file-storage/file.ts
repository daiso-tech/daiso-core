/**
 * @module FileStorage
 */

import { lookup } from "mime-types";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { TO_BYTES } from "@/file-size/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import {
    type IFile,
    type ISignedFileStorageAdapter,
    type FileMetadata,
    type WritableFileStream,
    KeyExistsFileError,
    KeyNotFoundFileError,
    type FileDownloadUrlOptions,
    FILE_WRITE_ENUM,
    type WritableFileContent,
    type FileStorageAdapterVariants,
    InvalidKeyFileError,
    type FileUploadUrlOptions,
} from "@/file-storage/contracts/_module.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSettings = {
    originalKey: string;
    onlyLowercase: boolean;
    keyValidator: InvokableFn<[key: string], string | null>;
    defaultContentType: string;
    originalAdapter: FileStorageAdapterVariants;
    adapter: ISignedFileStorageAdapter;
    key: string;
    serdeTransformerName: string;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    context: IReadableContext;
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
    static _serialize(deserializedValue: File): ISerializedFile {
        return {
            version: "1",
            key: deserializedValue._key,
        };
    }

    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly _key: string;
    private readonly serdeTransformerName: string;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly context: IReadableContext;
    private readonly originalKey: string;

    constructor(settings: FileSettings) {
        const {
            onlyLowercase,
            keyValidator,
            adapter,
            key,
            serdeTransformerName,
            defaultContentType,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultCacheControl,
            defaultContentLanguage,
            originalAdapter,
            context,
            originalKey,
        } = settings;

        this.originalKey = originalKey;
        this.context = context;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = originalAdapter;
        this.defaultContentType = defaultContentType;
        this.adapter = adapter;
        this._key = key;
        this.serdeTransformerName = serdeTransformerName;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
        this.handleKey(this._key);
    }

    private handleKey(key: string): string {
        if (this.onlyLowercase) {
            key = key.toLowerCase();
        }
        const validationMessage = this.keyValidator(key);
        if (validationMessage !== null) {
            throw InvalidKeyFileError.create(validationMessage);
        }
        return key;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): FileStorageAdapterVariants {
        return this.originalAdapter;
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
            throw KeyNotFoundFileError.create(this._key);
        }
        return text;
    }

    async getBytes(): Promise<Uint8Array | null> {
        return await this.adapter.getBytes(this.context, this._key.toString());
    }

    async getBytesOrFail(): Promise<Uint8Array> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            throw KeyNotFoundFileError.create(this._key);
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
            throw KeyNotFoundFileError.create(this._key);
        }
        return arrayBuffer;
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        const stream = await this.adapter.getStream(
            this.context,
            this._key.toString(),
        );
        if (stream === null) {
            return null;
        }
        return ReadableStream.from(stream);
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        const stream = await this.getReadableStream();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return stream;
    }

    async getMetadata(): Promise<FileMetadata | null> {
        const metadata = await this.adapter.getMetaData(
            this.context,
            this._key.toString(),
        );
        if (metadata === null) {
            return null;
        }
        return {
            contentType: metadata.contentType,
            etag: metadata.etag,
            updatedAt: metadata.updatedAt,
            fileSize: FileSize.fromBytes(metadata.fileSizeInBytes),
        };
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        const metadata = await this.getMetadata();
        if (metadata === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return metadata;
    }

    async exists(): Promise<boolean> {
        return await this.adapter.exists(this.context, this._key.toString());
    }

    async missing(): Promise<boolean> {
        return !(await this.exists());
    }

    async add(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = this.getContentType(this._key) } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.add(this.context, this._key.toString(), {
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
            throw KeyExistsFileError.create(this._key);
        }
    }

    private getContentType(key: string): string {
        let resolvedContentType = lookup(key);
        if (resolvedContentType === false) {
            resolvedContentType = this.defaultContentType;
        }
        return resolvedContentType;
    }

    async addStream(stream: WritableFileStream): Promise<boolean> {
        const {
            data,
            fileSize = null,
            contentType = this.getContentType(this._key),
        } = stream;

        return await this.adapter.addStream(
            this.context,
            this._key.toString(),
            {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            },
        );
    }

    async addStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasAdded = await this.addStream(stream);
        if (!hasAdded) {
            throw KeyExistsFileError.create(this._key);
        }
    }

    async update(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = this.getContentType(this._key) } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.update(this.context, this._key.toString(), {
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
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async updateStream(stream: WritableFileStream): Promise<boolean> {
        const {
            data,
            fileSize = null,
            contentType = this.getContentType(this._key),
        } = stream;
        return await this.adapter.updateStream(
            this.context,
            this._key.toString(),
            {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            },
        );
    }

    async updateStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasUpdated = await this.updateStream(stream);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async put(content: WritableFileContent): Promise<boolean> {
        const { data, contentType = this.getContentType(this._key) } = content;
        const resolvedData = resolveFileContent(data);
        return await this.adapter.put(this.context, this._key.toString(), {
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
            contentType = this.getContentType(this._key),
        } = stream;
        return await this.adapter.putStream(
            this.context,
            this._key.toString(),
            {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            },
        );
    }

    async remove(): Promise<boolean> {
        return await this.adapter.removeMany(this.context, [this._key]);
    }

    async removeOrFail(): Promise<void> {
        const hasFound = await this.remove();
        if (!hasFound) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async copy(destination: string): Promise<boolean> {
        const result = await this.adapter.copy(
            this.context,
            this._key.toString(),
            destination,
        );
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async copyOrFail(destination: string): Promise<void> {
        const result = await this.adapter.copy(
            this.context,
            this._key.toString(),
            destination,
        );
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this._key);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async copyAndReplace(destination: string): Promise<boolean> {
        return await this.adapter.copyAndReplace(
            this.context,
            this._key.toString(),
            destination,
        );
    }

    async copyAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.copyAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async move(destination: string): Promise<boolean> {
        const result = await this.adapter.move(
            this.context,
            this._key.toString(),
            destination,
        );
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async moveOrFail(destination: string): Promise<void> {
        const result = await this.adapter.move(
            this.context,
            this._key.toString(),
            destination,
        );
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this._key);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async moveAndReplace(destination: string): Promise<boolean> {
        return await this.adapter.moveAndReplace(
            this.context,
            this._key.toString(),
            destination,
        );
    }

    async moveAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.moveAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async getPublicUrl(): Promise<string | null> {
        return await this.adapter.getPublicUrl(this.context, this._key);
    }

    async getPublicUrlOrFail(): Promise<string> {
        const url = await this.getPublicUrl();
        if (url === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return url;
    }

    async getSignedUploadUrl(
        options: FileUploadUrlOptions = {},
    ): Promise<string> {
        const { ttl = TimeSpan.fromMinutes(10), contentType = null } = options;
        return await this.adapter.getSignedUploadUrl(
            this.context,
            this._key.toString(),
            {
                expirationInSeconds: TimeSpan.fromTimeSpan(ttl).toSeconds(),
                contentType,
            },
        );
    }

    async getSignedDownloadUrl(
        options: FileDownloadUrlOptions = {},
    ): Promise<string | null> {
        const {
            ttl: expiration = TimeSpan.fromMinutes(10),
            contentType = null,
            contentDisposition = null,
        } = options;
        return await this.adapter.getSignedDownloadUrl(
            this.context,
            this._key.toString(),
            {
                expirationInSeconds:
                    TimeSpan.fromTimeSpan(expiration).toSeconds(),
                contentType,
                contentDisposition,
            },
        );
    }

    async getSignedDownloadUrlOrFail(
        options?: FileDownloadUrlOptions,
    ): Promise<string> {
        const url = await this.getSignedDownloadUrl(options);
        if (url === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return url;
    }

    get key(): string {
        return this._key;
    }
}
