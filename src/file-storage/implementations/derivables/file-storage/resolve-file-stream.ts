/**
 * @module FileStorage
 */

import { type FileContent } from "@/file-storage/contracts/_module.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";

/**
 * @internal
 */
export class ResolveFileStream implements AsyncIterable<Uint8Array> {
    constructor(private readonly fileStream: AsyncIterable<FileContent>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
        for await (const content of this.fileStream) {
            yield resolveFileContent(content);
        }
    }
}
