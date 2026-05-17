/**
 * @module ConfigAccessor
 */

/**
 * Error thrown when a environment fields are not loaded into memory.
 *
 * This error is used to indicate that a environment fields are not loaded into memory.
 *
 * @group Errors
 */
export class UninitializedEnvAccessorError extends Error {
    /**
     * Create a new UninitializedEnvAccessorError for a specific field.
     *
     * @param field The missing field name or index.
     * @returns The error instance.
     */
    static create(): UninitializedEnvAccessorError {
        return new UninitializedEnvAccessorError(
            "IEnvAccessor must be initialized before use. Call 'init()' before accessing environment fields.",
        );
    }

    /**
     * Note: Do not instantiate `UninitializedEnvAccessorError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}
