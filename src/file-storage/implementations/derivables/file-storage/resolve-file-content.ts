/**
 * @module FileStorage
 */
import { type FileContent } from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export function resolveFileContent(fileContent: FileContent): Uint8Array {
    if (typeof fileContent === "string") {
        return new TextEncoder().encode(fileContent);
    }
    if (
        fileContent instanceof ArrayBuffer ||
        fileContent instanceof SharedArrayBuffer
    ) {
        return new Uint8Array(fileContent);
    }

    return new Uint8Array(
        fileContent.buffer,
        fileContent.byteOffset,
        fileContent.byteLength,
    );
}
