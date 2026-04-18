/**
 * @module FileStorage
 */

import { type Readable } from "node:stream";

import { type IFileSize } from "@/file-size/contracts/_module.js";
import { type FileSize } from "@/file-size/implementations/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * Configuration options for generating signed download URLs.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileDownloadUrlOptions = {
    /**
     * Time-to-live (TTL) duration for the signed URL.
     * The URL will only be valid for this duration before requiring re-signing.
     *
     * @default TimeSpan.fromMinutes(10)
     */
    ttl?: ITimeSpan;

    /**
     * MIME type to include in the download response headers.
     * Controls how the browser handles the file (e.g., display inline or download as attachment).
     * If not specified, the content type will be inferred from the file key.
     *
     * @default null (inferred from file extension)
     */
    contentType?: string | null;

    /**
     * Content-Disposition header value for controlling download behavior.
     * Set to 'attachment' to force download, 'inline' to display in browser.
     * If not specified, defaults to null (browser decides based on content type).
     *
     * @default null
     */
    contentDisposition?: string | null;
};

/**
 * Configuration options for generating signed upload URLs.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileUploadUrlOptions = {
    /**
     * Time-to-live (TTL) duration for the signed URL.
     * The URL will only be valid for this duration before requiring re-signing.
     *
     * @default TimeSpan.fromMinutes(10)
     */
    ttl?: ITimeSpan;

    /**
     * MIME type restriction for uploads using this URL.
     * Only files matching this content type will be accepted for upload.
     * If not specified, any content type is allowed.
     *
     * @default null (no content type restriction)
     */
    contentType?: string | null;
};

/**
 * Metadata information about a stored file.
 * Contains versioning, type, size, and modification tracking information.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileMetadata = {
    /**
     * Entity tag (ETag) for cache invalidation and version tracking.
     * Changes whenever the file content is updated.
     */
    etag: string;

    /**
     * MIME type of the file (e.g., 'application/json', 'image/png', 'text/plain').
     * Determines how the file should be interpreted and processed.
     */
    contentType: string;

    /**
     * Size of the file in bytes.
     */
    fileSize: FileSize;

    /**
     * Timestamp of when the file was last modified or uploaded.
     */
    updatedAt: Date;
};

/**
 * Read-only interface for accessing file content and metadata.
 * Provides multiple data format options (text, bytes, streams) and metadata retrieval.
 * All methods follow a pattern of returning null for missing files or throwing errors on OrFail variants.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IReadableFile = {
    /**
     * The unique identifier/path for this file in storage.
     */
    readonly key: IKey;

    /**
     * Retrieves file content as a UTF-8 text string.
     *
     * @returns The file content as text, or null if not found
     */
    getText(): Promise<string | null>;

    /**
     * Retrieves file content as a UTF-8 text string.
     *
     * @returns The file content as text
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getTextOrFail(): Promise<string>;

    /**
     * Retrieves file content as a Uint8Array (binary data).
     *
     * @returns The file content as bytes, or null if not found
     */
    getBytes(): Promise<Uint8Array | null>;

    /**
     * Retrieves file content as a Uint8Array (binary data).
     *
     * @returns The file content as bytes
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getBytesOrFail(): Promise<Uint8Array>;

    /**
     * Retrieves file content as a Node.js Buffer.
     *
     * @returns The file content as buffer, or null if not found
     */
    getBuffer(): Promise<Buffer | null>;

    /**
     * Retrieves file content as a Node.js Buffer.
     *
     * @returns The file content as buffer
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getBufferOrFail(): Promise<Buffer>;

    /**
     * Retrieves file content as an ArrayBuffer (standard JavaScript).
     *
     * @returns The file content as ArrayBuffer, or null if not found
     */
    getArrayBuffer(): Promise<ArrayBuffer | null>;

    /**
     * Retrieves file content as an ArrayBuffer (standard JavaScript).
     *
     * @returns The file content as ArrayBuffer
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getArrayBufferOrFail(): Promise<ArrayBuffer>;

    /**
     * Retrieves file content as a Node.js Readable stream.
     * Suitable for streaming large files without loading entire content into memory.
     *
     * @returns A readable stream, or null if not found
     */
    getReadable(): Promise<Readable | null>;

    /**
     * Retrieves file content as a Node.js Readable stream.
     * Suitable for streaming large files without loading entire content into memory.
     *
     * @returns A readable stream
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getReadableOrFail(): Promise<Readable>;

    /**
     * Retrieves file content as a standard Web Streams API ReadableStream.
     * Suitable for streaming large files without loading entire content into memory.
     *
     * @returns A readable stream, or null if not found
     */
    getReadableStream(): Promise<ReadableStream<Uint8Array> | null>;

    /**
     * Retrieves file content as a standard Web Streams API ReadableStream.
     * Suitable for streaming large files without loading entire content into memory.
     *
     * @returns A readable stream
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>>;

    /**
     * Retrieves metadata about the file without downloading its content.
     *
     * @returns File metadata (ETag, content type, size, modification time), or null if not found
     */
    getMetadata(): Promise<FileMetadata | null>;

    /**
     * Retrieves metadata about the file without downloading its content.
     *
     * @returns File metadata (ETag, content type, size, modification time)
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getMetadataOrFail(): Promise<FileMetadata>;

    /**
     * Checks if this file exists in storage.
     *
     * @returns true if the file exists, false otherwise
     */
    exists(): Promise<boolean>;

    /**
     * Checks if this file does not exist in storage.
     *
     * @returns true if the file does not exist, false if it exists
     */
    missing(): Promise<boolean>;

    /**
     * Gets the publicly accessible URL for this file.
     * Only works if the file storage backend supports public file access.
     *
     * @returns The public URL, or null if the file is not found or not publicly accessible
     */
    getPublicUrl(): Promise<string | null>;

    /**
     * Gets the publicly accessible URL for this file.
     * Only works if the file storage backend supports public file access.
     *
     * @returns The public URL
     * @throws {KeyNotFoundFileError} If the file is not found or not publicly accessible
     */
    getPublicUrlOrFail(): Promise<string>;

    /**
     * Generates a signed download URL with optional constraints.
     * The URL will be valid only for the specified TTL and can include content-type/disposition overrides.
     *
     * @param options - Download URL configuration options (TTL, content-type, content-disposition)
     * @returns A signed URL, or null if the file is not found
     */
    getSignedDownloadUrl(
        options?: FileDownloadUrlOptions,
    ): Promise<string | null>;

    /**
     * Generates a signed download URL with optional constraints.
     * The URL will be valid only for the specified TTL and can include content-type/disposition overrides.
     *
     * @param options - Download URL configuration options (TTL, content-type, content-disposition)
     * @returns A signed URL
     * @throws {KeyNotFoundFileError} If the file is not found
     */
    getSignedDownloadUrlOrFail(
        options?: FileDownloadUrlOptions,
    ): Promise<string>;
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
     * @throws {KeyExistsFileError}
     */
    addOrFail(content: WritableFileContent): Promise<void>;

    addStream(stream: WritableFileStream): Promise<boolean>;

    /**
     * @throws {KeyExistsFileError}
     */
    addStreamOrFail(stream: WritableFileStream): Promise<void>;

    update(content: WritableFileContent): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     */
    updateOrFail(content: WritableFileContent): Promise<void>;

    updateStream(stream: WritableFileStream): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     */
    updateStreamOrFail(stream: WritableFileStream): Promise<void>;

    put(content: WritableFileContent): Promise<boolean>;

    putStream(stream: WritableFileStream): Promise<boolean>;

    remove(): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     */
    removeOrFail(): Promise<void>;

    copy(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     * @throws {KeyExistsFileError}
     */
    copyOrFail(destination: string): Promise<void>;

    copyAndReplace(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     */
    copyAndReplaceOrFail(destination: string): Promise<void>;

    move(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     * @throws {KeyExistsFileError}
     */
    moveOrFail(destination: string): Promise<void>;

    moveAndReplace(destination: string): Promise<boolean>;

    /**
     * @throws {KeyNotFoundFileError}
     */
    moveAndReplaceOrFail(destination: string): Promise<void>;

    getSignedUploadUrl(options?: FileUploadUrlOptions): Promise<string>;
};
