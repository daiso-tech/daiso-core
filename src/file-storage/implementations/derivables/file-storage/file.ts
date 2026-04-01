/**
 * @module FileStorage
 */

import { Buffer } from "node:buffer";
import { Readable } from "stream";

import { lookup } from "mime-types";

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { TO_BYTES } from "@/file-size/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import {
    type IFile,
    type ISignedFileStorageAdapter,
    type FileMetadata,
    type WritableFileStream,
    KeyExistsFileError,
    KeyNotFoundFileError,
    isFileError,
    FILE_EVENTS,
    type FileEventMap,
    type FileDownloadUrlOptions,
    FILE_WRITE_ENUM,
    type FileWriteEnum,
    type WritableFileContent,
    type FileStorageAdapterVariants,
    InvalidKeyFileError,
    type FileUploadUrlOptions,
} from "@/file-storage/contracts/_module.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";
import { AsyncHooks, type AsyncMiddlewareFn } from "@/hooks/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    type Invokable,
    type InvokableFn,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSettings = {
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
    waitUntil: Invokable<[promise: PromiseLike<unknown>], void>;
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

    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;
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
        } = settings;

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

    private handleUnexpectedErrorEvent = <
        TParameters extends Array<unknown>,
        TReturn,
    >(): AsyncMiddlewareFn<TParameters, TReturn> => {
        return async (args, next) => {
            try {
                return await next(...args);
            } catch (error: unknown) {
                if (isFileError(error)) {
                    throw error;
                }

                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        FILE_EVENTS.UNEXPECTED_ERROR,
                        {
                            error,
                            file: this,
                        },
                    ),
                );

                throw error;
            }
        };
    };

    private handleNullableFoundEvent<
        TParameters extends Array<unknown>,
        TReturn,
    >(): AsyncMiddlewareFn<TParameters, TReturn | null> {
        return async (args, next) => {
            const value = await next(...args);
            if (value === null) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.FOUND, {
                        file: this,
                    }),
                );
            }
            return value;
        };
    }

    private handleBooleanFoundEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const exists = await next(...args);
            if (exists) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.FOUND, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            return exists;
        };
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
        return new AsyncHooks(async () => {
            return await this.adapter.getBytes(this._key.toString());
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
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
        return new AsyncHooks(async () => {
            const stream = await this.adapter.getStream(this._key.toString());
            if (stream === null) {
                return null;
            }
            return Readable.from(stream);
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
    }

    async getReadableOrFail(): Promise<Readable> {
        const stream = await this.getReadable();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return stream;
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        return new AsyncHooks(async () => {
            const stream = await this.adapter.getStream(this._key.toString());
            if (stream === null) {
                return null;
            }
            return ReadableStream.from(stream);
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        const stream = await this.getReadableStream();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return stream;
    }

    async getMetadata(): Promise<FileMetadata | null> {
        return new AsyncHooks(async () => {
            const metadata = await this.adapter.getMetaData(
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
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        const metadata = await this.getMetadata();
        if (metadata === null) {
            throw KeyNotFoundFileError.create(this._key);
        }
        return metadata;
    }

    async exists(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.exists(this._key.toString());
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleBooleanFoundEvent(),
        ]).invoke();
    }

    async missing(): Promise<boolean> {
        return !(await this.exists());
    }

    private handleAddEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasAdded = await next(...args);
            if (hasAdded) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.ADDED, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.KEY_EXISTS, {
                        file: this,
                    }),
                );
            }
            return hasAdded;
        };
    }

    async add(content: WritableFileContent): Promise<boolean> {
        return new AsyncHooks(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.add(this._key.toString(), {
                data: resolvedData,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
                fileSizeInBytes: resolvedData.length,
            });
        }, [this.handleUnexpectedErrorEvent(), this.handleAddEvent()]).invoke();
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
        return new AsyncHooks(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;
            return await this.adapter.addStream(this._key.toString(), {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            });
        }, [this.handleUnexpectedErrorEvent(), this.handleAddEvent()]).invoke();
    }

    async addStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasAdded = await this.addStream(stream);
        if (!hasAdded) {
            throw KeyExistsFileError.create(this._key);
        }
    }

    private handleUpdateEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasUpdated = await next(...args);
            if (hasUpdated) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.UPDATED, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            return hasUpdated;
        };
    }

    async update(content: WritableFileContent): Promise<boolean> {
        return new AsyncHooks(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.update(this._key.toString(), {
                data: resolvedData,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
                fileSizeInBytes: resolvedData.length,
            });
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleUpdateEvent(),
        ]).invoke();
    }

    async updateOrFail(content: WritableFileContent): Promise<void> {
        const hasUpdated = await this.update(content);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async updateStream(stream: WritableFileStream): Promise<boolean> {
        return new AsyncHooks(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;
            return await this.adapter.updateStream(this._key.toString(), {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            });
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleUpdateEvent(),
        ]).invoke();
    }

    async updateStreamOrFail(stream: WritableFileStream): Promise<void> {
        const hasUpdated = await this.updateStream(stream);
        if (!hasUpdated) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    private handlePutEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasUpdated = await next(...args);
            if (hasUpdated) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.UPDATED, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.ADDED, {
                        file: this,
                    }),
                );
            }
            return hasUpdated;
        };
    }

    async put(content: WritableFileContent): Promise<boolean> {
        return new AsyncHooks(async () => {
            const { data, contentType = this.getContentType(this._key.get()) } =
                content;
            const resolvedData = resolveFileContent(data);
            return await this.adapter.put(this._key.toString(), {
                data: resolvedData,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
                fileSizeInBytes: resolvedData.length,
            });
        }, [this.handleUnexpectedErrorEvent(), this.handlePutEvent()]).invoke();
    }

    async putStream(stream: WritableFileStream): Promise<boolean> {
        return new AsyncHooks(async () => {
            const {
                data,
                fileSize = null,
                contentType = this.getContentType(this._key.get()),
            } = stream;
            return await this.adapter.putStream(this._key.toString(), {
                data: new ResolveFileStream(data),
                fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
                contentType,
                contentDisposition: this.defaultContentDisposition,
                contentEncoding: this.defaultContentEncoding,
                cacheControl: this.defaultCacheControl,
                contentLanguage: this.defaultContentLanguage,
            });
        }, [this.handleUnexpectedErrorEvent(), this.handlePutEvent()]).invoke();
    }

    private handleRemoveEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasRemoved = await next(...args);
            if (hasRemoved) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.REMOVED, {
                        file: this,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            return hasRemoved;
        };
    }

    async remove(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.removeMany([this.key.toString()]);
        }, this.handleRemoveEvent()).invoke();
    }

    async removeOrFail(): Promise<void> {
        return new AsyncHooks(async () => {
            const hasFound = await this.remove();
            if (!hasFound) {
                throw KeyNotFoundFileError.create(this.key);
            }
        }, [this.handleUnexpectedErrorEvent()]).invoke();
    }

    private async _copy(destination: string): Promise<FileWriteEnum> {
        return new AsyncHooks(async () => {
            const destinationKey = this.namespace.create(destination);
            const result = await this.adapter.copy(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        {
                            source: this,
                            destination: destinationKey,
                        },
                    ),
                );
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            if (result === FILE_WRITE_ENUM.SUCCESS) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.COPIED, {
                        source: this,
                        destination: destinationKey,
                        replaced: false,
                    }),
                );
            }
            return result;
        }, [this.handleUnexpectedErrorEvent()]).invoke();
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
        return new AsyncHooks(async () => {
            const destinationKey = this.namespace.create(destination);
            const hasCopied = await this.adapter.copyAndReplace(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (hasCopied) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.COPIED, {
                        source: this,
                        destination: destinationKey,
                        replaced: true,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            return hasCopied;
        }, [this.handleUnexpectedErrorEvent()]).invoke();
    }

    async copyAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.copyAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }
    private async _move(destination: string): Promise<FileWriteEnum> {
        return new AsyncHooks(async () => {
            const destinationKey = this.namespace.create(destination);
            const result = await this.adapter.move(
                this._key.toString(),
                destinationKey.toString(),
            );

            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        {
                            source: this,
                            destination: destinationKey,
                        },
                    ),
                );
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            if (result === FILE_WRITE_ENUM.SUCCESS) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.MOVED, {
                        source: this,
                        destination: destinationKey,
                        replaced: false,
                    }),
                );
            }
            return result;
        }, [this.handleUnexpectedErrorEvent()]).invoke();
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
        return new AsyncHooks(async () => {
            const destinationKey = this.namespace.create(destination);
            const hasMoved = await this.adapter.moveAndReplace(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (hasMoved) {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.MOVED, {
                        source: this,
                        destination: destinationKey,
                        replaced: true,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    }),
                );
            }
            return hasMoved;
        }, [this.handleUnexpectedErrorEvent()]).invoke();
    }

    async moveAndReplaceOrFail(destination: string): Promise<void> {
        const hasCopied = await this.moveAndReplace(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this._key);
        }
    }

    async getPublicUrl(): Promise<string | null> {
        return new AsyncHooks(async () => {
            return await this.adapter.getPublicUrl(this.key.toString());
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
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
        return await this.adapter.getSignedUploadUrl(this._key.toString(), {
            expirationInSeconds: TimeSpan.fromTimeSpan(ttl).toSeconds(),
            contentType,
        });
    }

    async getSignedDownloadUrl(
        options: FileDownloadUrlOptions = {},
    ): Promise<string | null> {
        return new AsyncHooks(async () => {
            const {
                ttl: expiration = TimeSpan.fromMinutes(10),
                contentType = null,
                contentDisposition = null,
            } = options;
            return await this.adapter.getSignedDownloadUrl(
                this._key.toString(),
                {
                    expirationInSeconds:
                        TimeSpan.fromTimeSpan(expiration).toSeconds(),
                    contentType,
                    contentDisposition,
                },
            );
        }, [
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]).invoke();
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
