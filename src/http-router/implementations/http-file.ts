/**
 * @module HttpRouter
 */

import { FileSize } from "@/file-size/implementations/file-size.js";
import { type IHttpFile } from "@/http-router/contracts/_module.js";

/**
 * @internal
 */
export class HttpFile implements IHttpFile {
    constructor(private readonly file: File) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
        yield* this.file.stream();
    }

    asText(): Promise<string> {
        return this.file.text();
    }

    asBytes(): Promise<Uint8Array> {
        return this.file.bytes();
    }

    asArrayBuffer(): Promise<ArrayBuffer> {
        return this.file.arrayBuffer();
    }

    asReadableStream(): ReadableStream<Uint8Array> {
        return this.file.stream();
    }

    asFile(): File {
        return this.file;
    }

    get fileSize(): FileSize {
        return FileSize.fromBytes(this.file.size);
    }

    get name(): string {
        return this.file.name;
    }

    get lastModified(): Date {
        return new Date(this.file.lastModified);
    }

    get contentType(): string {
        return this.file.type;
    }
}
