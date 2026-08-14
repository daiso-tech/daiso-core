/**
 * @module DI
 */

import { type DiToken } from "@/di/contracts/container.contract.js";
import { tokenToString } from "@/di/implementations/utils.js";
import { isClass, UnexpectedError } from "@/utilities/_module.js";

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
export class ServiceCanNotBeResolvedError extends Error {
    /**
     * Creates a new {@link ServiceCanNotBeResolvedError} instance.
     *
     * @param token - The DI token that could not be resolved.
     * @returns A new error instance.
     */
    static create(token: DiToken): ServiceCanNotBeResolvedError {
        return new ServiceCanNotBeResolvedError(
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
/**
 * Thrown when a node dependency or neighbor was referenced during graph traversal
 * but was not declared in the `nodeIds` list.
 */
export class UndeclaredDependencyDiError extends Error {
    public readonly nodeId: DiToken;

    private constructor(nodeId: DiToken) {
        super(
            `Node "${String(tokenToString(nodeId))}" was referenced as a neighbor/dependency but not listed in nodeIds.`,
        );
        this.name = "UndeclaredDependencyError";
        this.nodeId = nodeId;
    }

    /**
     * Creates a new {@link UndeclaredDependencyDiError} instance.
     *
     * @param nodeId - The node that was referenced but not declared.
     * @returns A new error instance.
     */
    static create(nodeId: DiToken): UndeclaredDependencyDiError {
        return new UndeclaredDependencyDiError(nodeId);
    }
}
// TODO for Container*Exception Give tips what do
// For example for ContainerNotActiveException:"Illegal method call ... . Move method call to ..."

/**
 * Thrown when a container method only valid to call between `container.init()` to `container.deInit()` but called either before  `container.init()` or after `container.deInit()`.
 *
 * @group Errors
 */
export class ContainerNotActiveException extends Error {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super(
            `Illegal method call: "${methodName}" was called before container.init() or after container.deInit() was invoked.`,
        );
    }
}

/**
 * Thrown when a container method only valid to call before `container.init()` but was called after `container.init()`.
 *
 * @group Errors
 */
export class ContainerAlreadyInitializedException extends Error {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super(
            `Illegal method call: "${methodName}" was called after container.init() was invoked.`,
        );
    }
}
/**
 * Thrown when a container method only valid to call after `container.deInit()` but was called before `container.deInit()
 *
 * @group Errors
 */

export class ContainerNotTerminatedException extends Error {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super(
            `Illegal method call: "${methodName}" was called after container.deInit() was invoked.`,
        );
    }
}
/**
 * Thrown when a container method that is forbidden inside a run scope is
 * called from within `container.run()`.
 *
 * @group Errors
 */

export class MethodCallInsideRunError extends UnexpectedError {
    /**
     * The name of the method that was called illegally.
     */
    public readonly methodName: string;

    constructor(methodName: string) {
        super(`the method ${methodName} was called inside run block`);
        this.name = MethodCallInsideRunError.name;
        this.methodName = methodName;
    }

    /**
     * Creates a new {@link MethodCallInsideRunError} error.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(methodName: string): MethodCallInsideRunError {
        return new MethodCallInsideRunError(methodName);
    }
}

/**
 * Thrown when attempting to set a dynamic value for a token outside of a
 * `container.run()` scope. Dynamic registrations are only allowed inside a
 * run scope.
 *
 * @group Errors
 */
export class MethodOutsideOfRunError extends Error {
    constructor(token: DiToken) {
        super(
            `Cannot set dynamic value for registered token ${tokenToString(token)}: registration is only allowed inside a run scope. Call set() within container.run().`,
        );
        this.name = MethodOutsideOfRunError.name;
    }

    static create(token: DiToken): MethodOutsideOfRunError {
        return new MethodOutsideOfRunError(token);
    }
}
