/**
 * @module ExecutionContext
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Error thrown when attempting to access a context value that does not exist.
 *
 * This error is thrown by methods like `getOrFail()` when a context token
 * is not found in the current execution context. Use this error to detect
 * missing context values and handle them appropriately.
 */
export class NotFoundExecutionContextError extends Error {
    /**
     * Factory method to create a new NotFoundExecutionContextError.
     *
     * @param token - The ID of the context token that was not found
     * @param cause - Optional underlying error that caused this error
     * @returns A new NotFoundExecutionContextError instance
     */
    static create(
        token: string,
        cause?: unknown,
    ): NotFoundExecutionContextError {
        return new NotFoundExecutionContextError(
            `Execution context token "${token}" was not found`,
            cause,
        );
    }

    /**
     * Constructs a new NotFoundExecutionContextError.
     *
     * Note: Do not instantiate `NotFoundExecutionContextError` directly via the constructor.
     * Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types
     * and prevent type errors.
     *
     * @param message - The error message
     * @param cause - Optional underlying error that caused this error
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = NotFoundExecutionContextError.name;
    }
}
