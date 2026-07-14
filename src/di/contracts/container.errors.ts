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
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceNotFoundDiError extends Error {
    static create(token: DiToken): ServiceNotFoundDiError {
        return new ServiceNotFoundDiError(
            `Failed to resolve service for token: "${tokenToString(token)}". The service could not be constructed or located.`,
        );
    }

    /**
     * Note: Do not instantiate `ServiceResolutionDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class InvalidLifetimeDiError extends Error {
    static create(token: DiToken): InvalidLifetimeDiError {
        return new InvalidLifetimeDiError(
            `Invalid dependency graph detected for token: "${tokenToString(token)}". Check for singleton depending on transient/scoped or scoped depending on transient.`,
        );
    }

    /**
     * Note: Do not instantiate `InvalidDependencyDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CircularDependencyDiError extends Error {
    static create(tokenA: DiToken, tokenB: DiToken): CircularDependencyDiError {
        return new CircularDependencyDiError(
            `Circular dependency detected: "${tokenToString(tokenA)}" → "${tokenToString(tokenB)}" → ... forms a cycle. Check for dependency cycles in your service graph or module imports.`,
        );
    }

    /**
     * Note: Do not instantiate `CircularDependencyDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceExistsDiError extends Error {
    static create(token: DiToken): ServiceExistsDiError {
        return new ServiceExistsDiError(
            `Failed to register service for token: "${tokenToString(token)}". A registration with this token already exists and cannot be replaced.`,
        );
    }

    /**
     * Note: Do not instantiate `ServiceExistsDiError` directly via the constructor. Use the static {@link ServiceExistsDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with error types and prevent type errors.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}
