/**
 * @module DepdencyInjection
 */

/**
 * @group Errors
 */
export class ServiceResolutionError extends Error {
    static create(tokenId: string): ServiceResolutionError {
        return new ServiceResolutionError(
            `Failed to resolve service for token: '${tokenId}'. The service could not be constructed or located.`,
        );
    }

    /**
     * Note: Do not instantiate `ServiceResolutionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Is throw when singleton is depdent on transient or scoped.
 * Is also thrown when scoped is depdent on transient
 * @group Errors
 */
export class InvalidDepdencyError extends Error {
    static create(tokenId: string): InvalidDepdencyError {
        return new InvalidDepdencyError(
            `Invalid dependency graph detected for token: '${tokenId}'. Check for singleton depending on transient/scoped or scoped depending on transient.`,
        );
    }

    /**
     * Note: Do not instantiate `InvalidDepdencyError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}
