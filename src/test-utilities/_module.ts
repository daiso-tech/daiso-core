import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
export type BinaryData =
    | ArrayBuffer
    | SharedArrayBuffer
    | ArrayBufferView
    | Buffer;

/**
 * @internal
 */
function isBinaryData(val: unknown): val is BinaryData {
    return (
        val instanceof ArrayBuffer ||
        val instanceof SharedArrayBuffer ||
        ArrayBuffer.isView(val) ||
        (typeof Buffer !== "undefined" && Buffer.isBuffer(val))
    );
}

/**
 * @internal
 */
export function isBytesArrayEqualityTester(
    a: unknown,
    b: unknown,
): boolean | undefined {
    if (!isBinaryData(a)) {
        return;
    }

    if (!isBinaryData(b)) {
        return;
    }
    const uInt8ArrayA = resolveFileContent(a);
    const uInt8ArrayB = resolveFileContent(b);
    if (uInt8ArrayA.length !== uInt8ArrayB.length) {
        return false;
    }
    for (let i = 0; i < uInt8ArrayA.length; i++) {
        if (uInt8ArrayA[i] !== uInt8ArrayB[i]) {
            return false;
        }
    }
    return true;
}

/**
 * @internal
 */
export async function resolveStream(
    stream: AsyncIterable<Uint8Array> | null,
): Promise<Uint8Array | null> {
    if (!stream) {
        return null;
    }

    const chunks: Array<Uint8Array> = [];
    let totalLength = 0;

    // 1. Collect all chunks and track the total byte length
    for await (const chunk of stream) {
        chunks.push(chunk);
        totalLength += chunk.byteLength;
    }

    // Handle empty streams
    if (chunks.length === 0) {
        return new Uint8Array(0);
    }

    // 2. Optimization: If there's only one chunk, just return it
    if (chunks.length === 1) {
        const chunk = chunks[0];
        if (chunk === undefined) {
            return null;
        }
        return chunk;
    }

    // 3. Allocate the final memory once
    const result = new Uint8Array(totalLength);
    let offset = 0;

    // 4. Copy each chunk into the final array
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return result;
}

/**
 * @internal
 */
export function isUint8ByteArrayEqualityTester(
    a: unknown,
    b: unknown,
): boolean | undefined {
    if (!(a instanceof Uint8Array)) {
        return;
    }

    if (!(b instanceof Uint8Array)) {
        return;
    }

    return Buffer.from(a).equals(b);
}

export function createIsTimeSpanEqualityTester(buffer: ITimeSpan) {
    return (a: unknown, b: unknown): boolean | undefined => {
        if (!(a instanceof TimeSpan)) {
            return;
        }
        if (!(b instanceof TimeSpan)) {
            return;
        }
        const upperBound = a.addTimeSpan(
            TimeSpan.fromTimeSpan(buffer).divide(2),
        );
        const lowerBound = a.subtractTimeSpan(
            TimeSpan.fromTimeSpan(buffer).divide(2),
        );
        return b.gte(lowerBound) || b.lte(upperBound);
    };
}
