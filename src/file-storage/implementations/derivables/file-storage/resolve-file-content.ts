/**
 * @module FileStorage
 */
import { type FileContent } from "@/file-storage/contracts/_module.js";
import { isArrayBufferLikeable } from "@/file-storage/implementations/derivables/file-storage/is-array-buffer-likeable.js";

/**
 * @internal
 */
export function resolveFileContent(fileContent: FileContent): Uint8Array {
    if (typeof fileContent === "string") {
        return new TextEncoder().encode(fileContent);
    }
    if (isArrayBufferLikeable(fileContent)) {
        fileContent = fileContent.buffer;
    }
    return new Uint8Array(fileContent);
}
