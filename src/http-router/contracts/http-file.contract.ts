/**
 * @module HttpRouter
 */

import { type FileSize } from "@/file-size/implementations/_module.js";

/**
 * Represents a file that was uploaded as part of an HTTP request (typically via `multipart/form-data`).
 * Provides multiple methods to access the file's content in various formats — text, binary,
 * ArrayBuffer, or as a stream for efficient handling of large files.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpFile = AsyncIterable<Uint8Array> & {
    /**
     * Reads the file content as a UTF-8 text string.
     *
     * @returns A promise that resolves with the file content as a string.
     */
    asText(): Promise<string>;

    /**
     * Reads the file content as a `Uint8Array` (raw binary data).
     *
     * @returns A promise that resolves with the file content as bytes.
     */
    asBytes(): Promise<Uint8Array>;

    /**
     * Reads the file content as an `ArrayBuffer`.
     *
     * @returns A promise that resolves with the file content as an ArrayBuffer.
     */
    asArrayBuffer(): Promise<ArrayBuffer>;

    /**
     * Reads the file content as a `ReadableStream<Uint8Array>` using the Web Streams API.
     * Suitable for streaming large files without loading the entire content into memory.
     *
     * @returns A promise that resolves with a readable stream of the file content.
     */
    asReadableStream(): ReadableStream<Uint8Array>;

    /**
     * Returns the underlying Web API `File` object.
     *
     * @returns The native `File` instance.
     */
    asFile(): File;

    /**
     * Returns the size of the file in bytes as a {@link FileSize}.
     *
     * @returns The file size.
     */
    readonly fileSize: FileSize;

    /**
     * The original file name from the upload.
     */
    readonly name: string;

    /**
     * The last modified timestamp of the file.
     */
    readonly lastModified: Date;

    /**
     * The MIME content type of the file (e.g. `"image/png"`).
     */
    readonly contentType: string;
};
