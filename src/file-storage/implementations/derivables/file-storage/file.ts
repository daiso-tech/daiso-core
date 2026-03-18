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
import { type AsyncMiddlewareFn } from "@/hooks/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

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
        } = settings;

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

                this.eventDispatcher
                    .dispatch(FILE_EVENTS.UNEXPECTED_ERROR, {
                        error,
                        file: this,
                    })
                    .detach();

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
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.FOUND, {
                        file: this,
                    })
                    .detach();
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
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.FOUND, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            return exists;
        };
    }

    getText(): ITask<string | null> {
        return new Task(async () => {
            const bytes = await this.getBytes();
            if (bytes === null) {
                return null;
            }
            return new TextDecoder().decode(bytes);
        });
    }

    getTextOrFail(): ITask<string> {
        return new Task(async () => {
            const text = await this.getText();
            if (text === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return text;
        });
    }

    getBytes(): ITask<Uint8Array | null> {
        return new Task(async () => {
            return await this.adapter.getBytes(this._key.toString());
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getBytesOrFail(): ITask<Uint8Array> {
        return new Task(async () => {
            const bytes = await this.getBytes();
            if (bytes === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return bytes;
        });
    }

    getBuffer(): ITask<Buffer | null> {
        return new Task<Buffer | null>(async () => {
            const bytes = await this.getBytes();
            if (bytes === null) {
                return null;
            }
            return Buffer.from(bytes);
        });
    }

    getBufferOrFail(): ITask<Buffer> {
        return new Task(async () => {
            const buffer = await this.getBuffer();
            if (buffer === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return buffer;
        });
    }

    getArrayBuffer(): ITask<ArrayBuffer | null> {
        return new Task<ArrayBuffer | null>(async () => {
            const bytes = await this.getBuffer();
            if (bytes === null) {
                return null;
            }
            return new Uint8Array(Buffer.from(bytes)).buffer;
        });
    }

    getArrayBufferOrFail(): ITask<ArrayBuffer> {
        return new Task(async () => {
            const arrayBuffer = await this.getArrayBuffer();
            if (arrayBuffer === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return arrayBuffer;
        });
    }

    getReadable(): ITask<Readable | null> {
        return new Task(async () => {
            const stream = await this.adapter.getStream(this._key.toString());
            if (stream === null) {
                return null;
            }
            return Readable.from(stream);
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getReadableOrFail(): ITask<Readable> {
        return new Task(async () => {
            const stream = await this.getReadable();
            if (stream === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return stream;
        });
    }

    getReadableStream(): ITask<ReadableStream<Uint8Array> | null> {
        return new Task(async () => {
            const stream = await this.adapter.getStream(this._key.toString());
            if (stream === null) {
                return null;
            }
            return ReadableStream.from(stream);
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getReadableStreamOrFail(): ITask<ReadableStream<Uint8Array>> {
        return new Task(async () => {
            const stream = await this.getReadableStream();
            if (stream === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return stream;
        });
    }

    getMetadata(): ITask<FileMetadata | null> {
        return new Task<FileMetadata | null>(async () => {
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
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getMetadataOrFail(): ITask<FileMetadata> {
        return new Task(async () => {
            const metadata = await this.getMetadata();
            if (metadata === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return metadata;
        });
    }

    exists(): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.exists(this._key.toString());
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleBooleanFoundEvent(),
        ]);
    }

    missing(): ITask<boolean> {
        return new Task(async () => {
            return !(await this.exists());
        });
    }

    private handleAddEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasAdded = await next(...args);
            if (hasAdded) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.ADDED, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.KEY_EXISTS, {
                        file: this,
                    })
                    .detach();
            }
            return hasAdded;
        };
    }

    add(content: WritableFileContent): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handleAddEvent()]);
    }

    addOrFail(content: WritableFileContent): ITask<void> {
        return new Task(async () => {
            const hasAdded = await this.add(content);
            if (!hasAdded) {
                throw KeyExistsFileError.create(this._key);
            }
        });
    }

    private getContentType(key: string): string {
        let resolvedContentType = lookup(key);
        if (resolvedContentType === false) {
            resolvedContentType = this.defaultContentType;
        }
        return resolvedContentType;
    }

    addStream(stream: WritableFileStream): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handleAddEvent()]);
    }

    addStreamOrFail(stream: WritableFileStream): ITask<void> {
        return new Task(async () => {
            const hasAdded = await this.addStream(stream);
            if (!hasAdded) {
                throw KeyExistsFileError.create(this._key);
            }
        });
    }

    private handleUpdateEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasUpdated = await next(...args);
            if (hasUpdated) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.UPDATED, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            return hasUpdated;
        };
    }

    update(content: WritableFileContent): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handleUpdateEvent()]);
    }

    updateOrFail(content: WritableFileContent): ITask<void> {
        return new Task(async () => {
            const hasUpdated = await this.update(content);
            if (!hasUpdated) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }

    updateStream(stream: WritableFileStream): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handleUpdateEvent()]);
    }

    updateStreamOrFail(stream: WritableFileStream): ITask<void> {
        return new Task(async () => {
            const hasUpdated = await this.updateStream(stream);
            if (!hasUpdated) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }

    private handlePutEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasUpdated = await next(...args);
            if (hasUpdated) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.UPDATED, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.ADDED, {
                        file: this,
                    })
                    .detach();
            }
            return hasUpdated;
        };
    }

    put(content: WritableFileContent): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handlePutEvent()]);
    }

    putStream(stream: WritableFileStream): ITask<boolean> {
        return new Task(async () => {
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
        }).pipe([this.handleUnexpectedErrorEvent(), this.handlePutEvent()]);
    }

    private handleRemoveEvent<
        TParameters extends Array<unknown>,
    >(): AsyncMiddlewareFn<TParameters, boolean> {
        return async (args, next) => {
            const hasRemoved = await next(...args);
            if (hasRemoved) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.REMOVED, {
                        file: this,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            return hasRemoved;
        };
    }

    remove(): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.removeMany([this.key.toString()]);
        }).pipe(this.handleRemoveEvent());
    }

    removeOrFail(): ITask<void> {
        return new Task(async () => {
            const hasFound = await this.remove();
            if (!hasFound) {
                throw KeyNotFoundFileError.create(this.key);
            }
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    private _copy(destination: string): ITask<FileWriteEnum> {
        return new Task(async () => {
            const destinationKey = this.namespace.create(destination);
            const result = await this.adapter.copy(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.DESTINATION_EXISTS, {
                        source: this,
                        destination: destinationKey,
                    })
                    .detach();
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            if (result === FILE_WRITE_ENUM.SUCCESS) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.COPIED, {
                        source: this,
                        destination: destinationKey,
                        replaced: false,
                    })
                    .detach();
            }
            return result;
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    copy(destination: string): ITask<boolean> {
        return new Task(async () => {
            const result = await this._copy(destination);
            return result === FILE_WRITE_ENUM.SUCCESS;
        });
    }

    copyOrFail(destination: string): ITask<void> {
        return new Task(async () => {
            const result = await this._copy(destination);
            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                throw KeyExistsFileError.create(this._key);
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }

    copyAndReplace(destination: string): ITask<boolean> {
        return new Task(async () => {
            const destinationKey = this.namespace.create(destination);
            const hasCopied = await this.adapter.copyAndReplace(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (hasCopied) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.COPIED, {
                        source: this,
                        destination: destinationKey,
                        replaced: true,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            return hasCopied;
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    copyAndReplaceOrFail(destination: string): ITask<void> {
        return new Task(async () => {
            const hasCopied = await this.copyAndReplace(destination);
            if (!hasCopied) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }
    private _move(destination: string): ITask<FileWriteEnum> {
        return new Task(async () => {
            const destinationKey = this.namespace.create(destination);
            const result = await this.adapter.move(
                this._key.toString(),
                destinationKey.toString(),
            );

            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.DESTINATION_EXISTS, {
                        source: this,
                        destination: destinationKey,
                    })
                    .detach();
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            if (result === FILE_WRITE_ENUM.SUCCESS) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.MOVED, {
                        source: this,
                        destination: destinationKey,
                        replaced: false,
                    })
                    .detach();
            }
            return result;
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    move(destination: string): ITask<boolean> {
        return new Task(async () => {
            const result = await this._move(destination);
            return result === FILE_WRITE_ENUM.SUCCESS;
        });
    }

    moveOrFail(destination: string): ITask<void> {
        return new Task(async () => {
            const result = await this._move(destination);
            if (result === FILE_WRITE_ENUM.KEY_EXISTS) {
                throw KeyExistsFileError.create(this._key);
            }
            if (result === FILE_WRITE_ENUM.NOT_FOUND) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }

    moveAndReplace(destination: string): ITask<boolean> {
        return new Task(async () => {
            const destinationKey = this.namespace.create(destination);
            const hasMoved = await this.adapter.moveAndReplace(
                this._key.toString(),
                destinationKey.toString(),
            );
            if (hasMoved) {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.MOVED, {
                        source: this,
                        destination: destinationKey,
                        replaced: true,
                    })
                    .detach();
            } else {
                this.eventDispatcher
                    .dispatch(FILE_EVENTS.NOT_FOUND, {
                        file: this,
                    })
                    .detach();
            }
            return hasMoved;
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    moveAndReplaceOrFail(destination: string): ITask<void> {
        return new Task(async () => {
            const hasCopied = await this.moveAndReplace(destination);
            if (!hasCopied) {
                throw KeyNotFoundFileError.create(this._key);
            }
        });
    }

    getPublicUrl(): ITask<string | null> {
        return new Task(async () => {
            return await this.adapter.getPublicUrl(this.key.toString());
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getPublicUrlOrFail(): ITask<string> {
        return new Task(async () => {
            const url = await this.getPublicUrl();
            if (url === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return url;
        });
    }

    getSignedUploadUrl(options: FileUploadUrlOptions = {}): ITask<string> {
        return new Task(async () => {
            const { ttl = TimeSpan.fromMinutes(10), contentType = null } =
                options;
            return await this.adapter.getSignedUploadUrl(this._key.toString(), {
                expirationInSeconds: TimeSpan.fromTimeSpan(ttl).toSeconds(),
                contentType,
            });
        });
    }

    getSignedDownloadUrl(
        options: FileDownloadUrlOptions = {},
    ): ITask<string | null> {
        return new Task(async () => {
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
        }).pipe([
            this.handleUnexpectedErrorEvent(),
            this.handleNullableFoundEvent(),
        ]);
    }

    getSignedDownloadUrlOrFail(
        options?: FileDownloadUrlOptions,
    ): ITask<string> {
        return new Task(async () => {
            const url = await this.getSignedDownloadUrl(options);
            if (url === null) {
                throw KeyNotFoundFileError.create(this._key);
            }
            return url;
        });
    }
}
