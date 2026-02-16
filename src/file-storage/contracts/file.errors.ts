/**
 * @module FileStorage
 */

import { type IKey } from "@/namespace/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export class KeyNotFoundFileError extends Error {
    static create(key: IKey, cause?: unknown): KeyNotFoundFileError {
        return new KeyNotFoundFileError(
            `Key "${key.get()}" is not found`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `KeyNotFoundFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = KeyNotFoundFileError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export class KeyExistsFileError extends Error {
    static create(key: IKey, cause?: unknown): KeyExistsFileError {
        return new KeyExistsFileError(
            `Key "${key.get()}" already exists`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `KeyExistsFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = KeyExistsFileError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export class InvalidKeyFileError extends Error {
    static create(message: string, cause?: unknown): InvalidKeyFileError {
        return new InvalidKeyFileError(message, cause);
    }

    /**
     * Note: Do not instantiate `InvalidKeyFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidKeyFileError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export const FILE_STORAGE_ERRORS = {
    KeyNotFound: KeyNotFoundFileError,
    KeyExists: KeyExistsFileError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export type AllFileErrors = KeyNotFoundFileError | KeyExistsFileError;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Errors
 */
export function isFileError(value: unknown): value is AllFileErrors {
    for (const ErrorClass of Object.values(FILE_STORAGE_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}
