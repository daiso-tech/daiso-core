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
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileDownloadUrlOptions = {
    /**
     * The ttl of signed url.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/time-span"
     *
     * TimeSpan.fromMinutes(10)
     * ```
     */
    ttl?: ITimeSpan;

    /**
     * The content type will be infered by key.
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
export type FileUploadUrlOptions = {
    /**
     * The ttl of signed url.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/time-span"
     *
     * TimeSpan.fromMinutes(10)
     * ```
     */
    ttl?: ITimeSpan;

    /**
     * The content type will be infered by key.
     */
    contentType?: string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileMetadata = {
    etag: string;
    contentType: string;
    fileSize: IFileSize;
    updatedAt: Date;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IReadableFile = {
    readonly key: IKey;

    getText(): Promise<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getTextOrFail(): Promise<string>;

    getBytes(): Promise<Uint8Array | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getBytesOrFail(): Promise<Uint8Array>;

    getBuffer(): Promise<Buffer | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getBufferOrFail(): Promise<Buffer>;

    getArrayBuffer(): Promise<ArrayBuffer | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getArrayBufferOrFail(): Promise<ArrayBuffer>;

    getReadable(): Promise<Readable | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getReadableOrFail(): Promise<Readable>;

    getReadableStream(): Promise<ReadableStream<Uint8Array> | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>>;

    getMetadata(): Promise<FileMetadata | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getMetadataOrFail(): Promise<FileMetadata>;

    exists(): Promise<boolean>;

    missing(): Promise<boolean>;

    getPublicUrl(): Promise<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getPublicUrlOrFail(): Promise<string>;

    getSignedDownloadUrl(
        options?: FileDownloadUrlOptions,
    ): Promise<string | null>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    getSignedDownloadUrlOrFail(options?: FileUploadUrlOptions): Promise<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileContent = string | ArrayBufferLike | ArrayBufferView;

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
    add(content: WritableFileContent): Promise<boolean>;

    /**
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    addOrFail(content: WritableFileContent): Promise<void>;

    addStream(stream: WritableFileStream): Promise<boolean>;

    /**
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    addStreamOrFail(stream: WritableFileStream): Promise<void>;

    update(content: WritableFileContent): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    updateOrFail(content: WritableFileContent): Promise<void>;

    updateStream(stream: WritableFileStream): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    updateStreamOrFail(stream: WritableFileStream): Promise<void>;

    put(content: WritableFileContent): Promise<boolean>;

    putStream(stream: WritableFileStream): Promise<boolean>;

    remove(): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    removeOrFail(): Promise<void>;

    copy(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    copyOrFail(destination: string): Promise<void>;

    copyAndReplace(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    copyAndReplaceOrFail(destination: string): Promise<void>;

    move(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     * @throws {KeyExistsFileError} {@link KeyExistsFileError}
     */
    moveOrFail(destination: string): Promise<void>;

    moveAndReplace(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError} {@link KeyNotFoundFileError}
     */
    moveAndReplaceOrFail(destination: string): Promise<void>;

    getSignedUploadUrl(options?: FileUploadUrlOptions): Promise<string>;
};
