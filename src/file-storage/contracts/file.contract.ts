/**
 * @module FileStorage
 */

import { type Readable } from "node:stream";

import { type IFileSize } from "@/file-size/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type KeyExistsFileError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type KeyNotFoundFileError,
} from "@/file-storage/contracts/file.errors.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FildeSignedUrlOptions = {
    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/time-span"
     *
     * TimeSpan.fromMinutes(10)
     * ```
     */
    ttl?: ITimeSpan;

    /**
     * The content type will be infered when creating the IFile object.
     */
    contentType?: string | null;

    /**
     * @default null
     */
    contentDisposition?: string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileMetadata = {
    etag: string;
    contentType: string;
    fileSize: IFileSize;
    createdAt: Date;
    updatedAt: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IReadableFile = {
    readonly key: IKey;

    asText(): ITask<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asTextOrFail(): ITask<string>;

    asBytes(): ITask<Uint8Array | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asBytesOrFail(): ITask<Uint8Array>;

    asBuffer(): ITask<Buffer | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asBufferOrFail(): ITask<Buffer>;

    asArrayBuffer(): ITask<ArrayBuffer | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asArrayBufferOrFail(): ITask<ArrayBuffer>;

    asReadable(): ITask<Readable | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asReadableOrFail(): ITask<Readable>;

    asReadableStream(): ITask<ReadableStream<Uint8Array> | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    asReadableStreamOrFail(): ITask<ReadableStream<Uint8Array>>;

    getMetadata(): ITask<FileMetadata | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getMetadataOrFail(): ITask<FileMetadata>;

    exists(): ITask<boolean>;

    missing(): ITask<boolean>;

    getPublicUrl(): ITask<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getPublicUrlOrFail(): ITask<string>;

    getSignedDownloadUrl(options?: FildeSignedUrlOptions): ITask<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getSignedDownloadUrlOrFail(options?: FildeSignedUrlOptions): ITask<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type ArrayBufferLikeable = { buffer: ArrayBufferLike };

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileContent = string | ArrayBufferLike | ArrayBufferLikeable;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileCommonSettings = {
    /**
     * You can explicitly set a custom Content-Type. If one is not provided, it will be inferred from the key. For example, a key ending in .txt (such as key-a.txt) will be assigned text/plain.
     * If the key contains a non-standard extension it will default to application/octet-stream.
     */
    contentType?: string;

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentLanguage?: string | null;

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentEncoding?: string | null;

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentDisposition?: string | null;

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    cacheControl?: string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileContent = WritableFileCommonSettings & {
    data: FileContent;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileStream = WritableFileCommonSettings & {
    data: AsyncIterable<FileContent>;

    /**
     * @default null
     */
    fileSize?: IFileSize | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFile = IReadableFile & {
    add(content: WritableFileContent): ITask<boolean>;

    /**
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    addOrFail(content: WritableFileContent): ITask<void>;

    addStream(stream: WritableFileStream): ITask<boolean>;

    /**
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    addStreamOrFail(stream: WritableFileStream): ITask<void>;

    update(content: WritableFileContent): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    updateOrFail(content: WritableFileContent): ITask<void>;

    updateStream(stream: WritableFileStream): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    updateStreamOrFail(stream: WritableFileStream): ITask<void>;

    put(content: WritableFileContent): ITask<boolean>;

    putStream(stream: WritableFileStream): ITask<boolean>;

    copy(destination: string): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    copyOrFail(destination: string): ITask<void>;

    copyAndReplace(destination: string): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    copyAndReplaceOrFail(destination: string): ITask<void>;

    move(destination: string): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    moveOrFail(destination: string): ITask<void>;

    moveAndReplace(destination: string): ITask<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    moveAndReplaceOrFail(destination: string): ITask<void>;

    getSignedUploadUrl(options?: FildeSignedUrlOptions): ITask<string>;
};
