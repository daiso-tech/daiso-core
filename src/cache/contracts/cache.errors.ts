/**
 * @module Cache
 */

import { type IKey } from "@/namespace/contracts/_module.js";

/**
 * The error is thrown when a key is not found
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Errors
 */
export class KeyNotFoundCacheError extends Error {
    static create(key: IKey, cause?: unknown): KeyNotFoundCacheError {
        return new KeyNotFoundCacheError(
            `Key "${key.get()}" is not found`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `KeyNotFoundCacheError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = KeyNotFoundCacheError.name;
    }
}

/**
 * The error is thrown when a key already exists found
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Errors
 */
export class KeyExistsCacheError extends Error {
    static create(key: IKey, cause?: unknown): KeyExistsCacheError {
        return new KeyExistsCacheError(
            `Key "${key.get()}" already exists`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `KeyExistsCacheError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = KeyExistsCacheError.name;
    }
}

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Errors
 */
export const CACHE_ERRORS = {
    KeyNotFound: KeyNotFoundCacheError,
} as const;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Errors
 */
export type AllCacheErrors = KeyNotFoundCacheError;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Errors
 */
export function isCacheError(value: unknown): value is AllCacheErrors {
    for (const ErrorClass of Object.values(CACHE_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}
