/**
 * @module FileStorage
 */

import { type ArrayBufferLikeable } from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export function isArrayBufferLikeable(
    buffer: ArrayBufferLike | ArrayBufferLikeable,
): buffer is ArrayBufferLikeable {
    return typeof buffer === "object" && "buffer" in buffer;
}
