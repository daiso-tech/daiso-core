/**
 * @module FileStorage
 */

import { Buffer } from "node:buffer";
import { Readable } from "stream";

import { lookup } from "mime-types";

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { TO_BYTES } from "@/file-size/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import {
    type IFile,
    type ISignedFileStorageAdapter,
    type FileMetadata,
    type WritableFileStream,
    KeyExistsFileError,
    KeyNotFoundFileError,
    type FileEventMap,
    type FileDownloadUrlOptions,
    FILE_WRITE_ENUM,
    type FileWriteEnum,
    type WritableFileContent,
    type FileStorageAdapterVariants,
    InvalidKeyFileError,
    type FileUploadUrlOptions,
} from "@/file-storage/contracts/_module.js";
import {
    handleAddEvent,
    handleBooleanFoundEvent,
    handleCopyAndReplaceEvent,
    handleCopyEvent,
    handleMoveAndReplaceEvent,
    handleMoveEvent,
    handleNullableFoundEvent,
    handlePutEvent,
    handleRemoveEvent,
    handleUnexpectedErrorEvent,
    handleUpdateEvent,
} from "@/file-storage/implementations/derivables/file-storage/event-helpers.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";
import { type ILockFactoryBase } from "@/lock/contracts/_module.js";
import { type MiddlewareFn, type Use } from "@/middleware/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSettings = {
    originalKey: string;
    lockFactory: ILockFactoryBase;
    onlyLowercase: boolean;
    keyValidator: InvokableFn<[key: string], string | null>;
    defaultContentType: string;
    originalAdapter: FileStorageAdapterVariants;
    adapter: ISignedFileStorageAdapter;
    key: IKey;
    eventDispatcher: IEventDispatcher<FileEventMap>;
    serdeTransformerName: string;
    namespace: INamespace;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
    use: Use;
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
    static _internal_serialize(deserializedValue: File): ISerializedFile {
        return {
            version: "1",
            key: deserializedValue._key.get(),
        };
    }

    private readonly waitUntil: WaitUntil;
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly _key: IKey;
    private readonly eventDispatcher: IEventDispatcher<FileEventMap>;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;
    private readonly lockFactory: ILockFactoryBase;
    private readonly originalKey: string;

    constructor(settings: FileSettings) {
        const {
            onlyLowercase,
            keyValidator,
            adapter,
            key,
            eventDispatcher,
            serdeTransformerName,
            namespace,
            defaultContentType,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultCacheControl,
            defaultContentLanguage,
            originalAdapter,
            waitUntil,
            executionContext,
            use,
            lockFactory,
            originalKey,
        } = settings;

        this.originalKey = originalKey;
        this.lockFactory = lockFactory;
        this.use = use;
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = originalAdapter;
        this.defaultContentType = defaultContentType;
        this.adapter = adapter;
        this._key = key;
        this.eventDispatcher = eventDispatcher;
        this.serdeTransformerName = serdeTransformerName;
        this.namespace = namespace;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
        this.handleKey(this._key);
    }

    private handleKey(key: IKey): string {
        let rawKey = key.toString();
        if (this.onlyLowercase) {
            rawKey = rawKey.toLowerCase();
        }
        const validationMessage = this.keyValidator(rawKey);
        if (validationMessage !== null) {
            throw InvalidKeyFileError.create(validationMessage);
        }
        return rawKey;
    }

    _internal_getNamespace(): INamespace {
        return this.namespace;
    }

    _internal_getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _internal_getAdapter(): FileStorageAdapterVariants {
        return this.originalAdapter;
    }

    get key(): IKey {
        return this._key;
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
        return this.use(async () => {
            return await this.adapter.getBytes(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async getBytesOrFail(): Promise<Uint8Array> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return bytes;
    }

    async getBuffer(): Promise<Buffer | null> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            return null;
        }
        return Buffer.from(bytes);
    }

    async getBufferOrFail(): Promise<Buffer> {
        const buffer = await this.getBuffer();
        if (buffer === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return buffer;
    }

    async getArrayBuffer(): Promise<ArrayBuffer | null> {
        const bytes = await this.getBuffer();
        if (bytes === null) {
            return null;
        }
        return new Uint8Array(Buffer.from(bytes)).buffer;
    }

    async getArrayBufferOrFail(): Promise<ArrayBuffer> {
        const arrayBuffer = await this.getArrayBuffer();
        if (arrayBuffer === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return arrayBuffer;
    }

    async getReadable(): Promise<Readable | null> {
        return this.use(async () => {
            const stream = await this.adapter.getStream(
                this.executionContext,
                this._key.toString(),
            );
            if (stream === null) {
                return null;
            }
            return Readable.from(stream);
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async getReadableOrFail(): Promise<Readable> {
        const stream = await this.getReadable();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return stream;
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        return this.use(async () => {
            const stream = await this.adapter.getStream(
                this.executionContext,
                this._key.toString(),
            );
            if (stream === null) {
                return null;
            }
            return ReadableStream.from(stream);
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        const stream = await this.getReadableStream();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return stream;
    }

    async getMetadata(): Promise<FileMetadata | null> {
        return this.use(async () => {
            const metadata = await this.adapter.getMetaData(
                this.executionContext,
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
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        const metadata = await this.getMetadata();
        if (metadata === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return metadata;
    }

    async exists(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.exists(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleBooleanFoundEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async missing(): Promise<boolean> {
        return !(await this.exists());
    }

    private lock<TParameters extends Array<unknown>, TReturn>(): MiddlewareFn<
        TParameters,
        Promise<TReturn>
    > {
        return async ({ next }) => {
            return await this.lockFactory
                .create(this.originalKey)
                .runOrFail(async () => {
                    return await next();
                });
        };
    }

    async add(content: WritableFileContent): Promise<boolean> {
        return this.use(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.add(
                this.executionContext,
                this._key.toString(),
                {
                    data: resolvedData,
                    contentType,
                    contentDisposition: this.defaultContentDisposition,
                    contentEncoding: this.defaultContentEncoding,
                    cacheControl: this.defaultCacheControl,
                    contentLanguage: this.defaultContentLanguage,
                    fileSizeInBytes: resolvedData.length,
                },
            );
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleAddEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
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
        return this.use(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;

            return await this.adapter.addStream(
                this.executionContext,
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
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleAddEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async addStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasAdded = await this.addStream(stream);
        if (!hasAdded) {
            throw KeyExistsFileError.create(this._key);
        }
    }

    async update(content: WritableFileContent): Promise<boolean> {
        return this.use(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.update(
                this.executionContext,
                this._key.toString(),
                {
                    data: resolvedData,
                    contentType,
                    contentDisposition: this.defaultContentDisposition,
                    contentEncoding: this.defaultContentEncoding,
                    cacheControl: this.defaultCacheControl,
                    contentLanguage: this.defaultContentLanguage,
                    fileSizeInBytes: resolvedData.length,
                },
            );
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleUpdateEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async updateOrFail(content: WritableFileContent): Promise<void> {
        const hasUpdated = await this.update(content);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async updateStream(stream: WritableFileStream): Promise<boolean> {
        return this.use(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;
            return await this.adapter.updateStream(
                this.executionContext,
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
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleUpdateEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async updateStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasUpdated = await this.updateStream(stream);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async put(content: WritableFileContent): Promise<boolean> {
        return this.use(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.put(
                this.executionContext,
                this._key.toString(),
                {
                    data: resolvedData,
                    contentType,
                    contentDisposition: this.defaultContentDisposition,
                    contentEncoding: this.defaultContentEncoding,
                    cacheControl: this.defaultCacheControl,
                    contentLanguage: this.defaultContentLanguage,
                    fileSizeInBytes: resolvedData.length,
                },
            );
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handlePutEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async putStream(stream: WritableFileStream): Promise<boolean> {
        return this.use(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;
            return await this.adapter.putStream(
                this.executionContext,
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
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handlePutEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async remove(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.removeMany(this.executionContext, [
                this.key.toString(),
            ]);
        }, [
            this.lock(),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleRemoveEvent(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    async removeOrFail(): Promise<void> {
        const hasFound = await this.remove();
        if (!hasFound) {
            throw KeyNotFoundFileError.create(this.key);
        }
    }

    private async _copy(destination: string): Promise<FileWriteEnum> {
        const destinationKey = this.namespace.create(destination);
        return this.use(async () => {
            return await this.adapter.copy(
                this.executionContext,
                this._key.toString(),
                destinationKey.toString(),
            );
        }, [
            this.lock(),
            handleCopyEvent(
                this.waitUntil,
                this.eventDispatcher,
                destinationKey,
                this,
            ),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async copy(destination: string): Promise<boolean> {
        const result = await this._copy(destination);
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async copyOrFail(destination: string): Promise<void> {
        const result = await this._copy(destination);
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this._key);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async copyAndReplace(destination: string): Promise<boolean> {
        const destinationKey = this.namespace.create(destination);
        return this.use(async () => {
            return await this.adapter.copyAndReplace(
                this.executionContext,
                this._key.toString(),
                destinationKey.toString(),
            );
        }, [
            this.lock(),
            handleCopyAndReplaceEvent(
                this.waitUntil,
                this.eventDispatcher,
                destinationKey,
                this,
            ),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async copyAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.copyAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }
    private async _move(destination: string): Promise<FileWriteEnum> {
        const destinationKey = this.namespace.create(destination);
        return this.use(async () => {
            return await this.adapter.move(
                this.executionContext,
                this._key.toString(),
                destinationKey.toString(),
            );
        }, [
            this.lock(),
            handleMoveEvent(
                this.waitUntil,
                this.eventDispatcher,
                destinationKey,
                this,
            ),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async move(destination: string): Promise<boolean> {
        const result = await this._move(destination);
        return result === FILE_WRITE_ENUM.SUCCESS;
    }

    async moveOrFail(destination: string): Promise<void> {
        const result = await this._move(destination);
        if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
            throw KeyExistsFileError.create(this._key);
        }
        if (result === FILE_WRITE_ENUM.NOT_FOUND) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async moveAndReplace(destination: string): Promise<boolean> {
        const destinationKey = this.namespace.create(destination);
        return this.use(async () => {
            return await this.adapter.moveAndReplace(
                this.executionContext,
                this._key.toString(),
                destinationKey.toString(),
            );
        }, [
            this.lock(),
            handleMoveAndReplaceEvent(
                this.waitUntil,
                this.eventDispatcher,
                destinationKey,
                this,
            ),
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
    }

    async moveAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.moveAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async getPublicUrl(): Promise<string | null> {
        return this.use(async () => {
            return await this.adapter.getPublicUrl(
                this.executionContext,
                this.key.toString(),
            );
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
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
            this.executionContext,
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
        return this.use(async () => {
            const {
                ttl: expiration = TimeSpan.fromMinutes(10),
                contentType = null,
                contentDisposition = null,
            } = options;
            return await this.adapter.getSignedDownloadUrl(
                this.executionContext,
                this._key.toString(),
                {
                    expirationInSeconds:
                        TimeSpan.fromTimeSpan(expiration).toSeconds(),
                    contentType,
                    contentDisposition,
                },
            );
        }, [
            handleUnexpectedErrorEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
            handleNullableFoundEvent(
                this.waitUntil,
                this.eventDispatcher,
                this,
            ),
        ])();
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
}
