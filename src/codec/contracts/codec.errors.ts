/**
 * @module Codec
 */

/**
 * The error occurs when a value is unable to be encoded.
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Errors
 */
export class EncodingError extends Error {
    static create(error: unknown): EncodingError {
        return new EncodingError(
            `Encoding error "${String(error)}" occured`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `EncodingError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = EncodingError.name;
    }
}

/**
 * The error occurs when a value is unable to be decoded.
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Errors
 */
export class DecodingError extends Error {
    static create(error: unknown): DecodingError {
        return new DecodingError(
            `Decoding error "${String(error)}" occured`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `DecodingError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = DecodingError.name;
    }
}

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Errors
 */
export const CODEC_ERRORS = {
    Encoding: EncodingError,
    Decoding: DecodingError,
} as const;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Errors
 */
export type AllCodecErrors = EncodingError | DecodingError;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Errors
 */
export function isCodecError(value: unknown): value is AllCodecErrors {
    for (const ErrorClass of Object.values(CODEC_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}
