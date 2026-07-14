/**
 * @module DI
 */

import { type DiToken } from "@/di/contracts/container.contract.js";
import { isClass } from "@/utilities/_module.js";

/**
 * @internal
 */
function tokenToString(diToken: DiToken): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.id.toString();
}

/**
 * Thrown when a service cannot be resolved because it was never registered.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceNotFoundDiError extends Error {
    /**
     * Creates a new {@link ServiceNotFoundDiError} instance.
     *
     * @param token - The DI token that could not be resolved.
     * @returns A new error instance.
     */
    static create(token: DiToken): ServiceNotFoundDiError {
        return new ServiceNotFoundDiError(
            `Failed to resolve service for token: "${tokenToString(token)}". The service could not be constructed or located.`,
        );
    }

    /**
     * Note: Do not instantiate `ServiceNotFoundDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Thrown when a lifetime configuration is invalid, such as a
 * - Singleton is dependent on Transient
 * - Singleton is dependent on Scoped
 * - Singleton is dependent on Dynamic
 * - Scoped is dependent on Transient
 * - Dynamic is dependent on Transient
 * - Transient is dependent on Dynamic
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class InvalidLifetimeDiError extends Error {
    /**
     * Creates a new {@link InvalidLifetimeDiError} instance.
     *
     * @param token - The DI token with an invalid lifetime configuration.
     * @returns A new error instance.
     */
    static create(token: DiToken): InvalidLifetimeDiError {
        return new InvalidLifetimeDiError(
            `Invalid dependency graph detected for token: "${tokenToString(token)}". Check for singleton depending on transient/scoped or scoped depending on transient.`,
        );
    }

    /**
     * Note: Do not instantiate `InvalidLifetimeDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Thrown when a circular dependency is detected in the service graph.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CircularDependencyDiError extends Error {
    /**
     * Creates a new {@link CircularDependencyDiError} instance.
     *
     * @param tokenA - The first token in the dependency cycle.
     * @param tokenB - The second token in the dependency cycle.
     * @returns A new error instance.
     */
    static create(tokenA: DiToken, tokenB: DiToken): CircularDependencyDiError {
        return new CircularDependencyDiError(
            `Circular dependency detected: "${tokenToString(tokenA)}" → "${tokenToString(tokenB)}" → ... forms a cycle. Check for dependency cycles in your service graph or module imports.`,
        );
    }

    /**
     * Note: Do not instantiate `CircularDependencyDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Thrown when attempting to register a service with a token that already
 * has an existing registration.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceExistsDiError extends Error {
    /**
     * Creates a new {@link ServiceExistsDiError} instance.
     *
     * @param token - The DI token that already has a registration.
     * @returns A new error instance.
     */
    static create(token: DiToken): ServiceExistsDiError {
        return new ServiceExistsDiError(
            `Failed to register service for token: "${tokenToString(token)}". A registration with this token already exists and cannot be replaced.`,
        );
    }

    /**
     * Note: Do not instantiate `ServiceExistsDiError` directly via the constructor. Use the static {@link ServiceExistsDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with error types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}
