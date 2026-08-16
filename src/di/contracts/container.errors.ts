/**
 * @module DI
 */

import { type DiToken } from "@/di/contracts/container.contract.js";
import { LIFESPAN, type TLifespan } from "@/di/implementations/utils.js";
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

export type EdgeErrorInfo = {
    edge: [DiToken, DiToken];
    edgeType: [TLifespan, TLifespan];
};

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
export class InvalidEdgeRelationshipDiError extends Error {
    /**
     * Creates a new {@link InvalidEdgeRelationshipDiError} instance.
     *
     * @param token - The DI token with an invalid lifetime configuration.
     * @returns A new error instance.
     */
    static create(
        edgeErrorInfos: Array<EdgeErrorInfo>,
        totalDetected?: number,
    ): InvalidEdgeRelationshipDiError {
        const totalEdgesDetected = totalDetected ?? edgeErrorInfos.length;
        const listIsShortened = edgeErrorInfos.length !== totalEdgesDetected;

        const edgeErrorInfoStrings = edgeErrorInfos.map((item) => ({
            edge: `${tokenToString(item.edge[0])} → ${tokenToString(item.edge[1])}`,
            edgeType: `${item.edgeType[0]} → ${item.edgeType[1]}`,
        }));

        const message = listIsShortened
            ? `${totalEdgesDetected.toString()} invalid edge relationships detected in graph. Only ${edgeErrorInfos.length.toString()} are shown.`
            : `${totalEdgesDetected.toString()} invalid  edge relationships detected in graph.`;

        const withRulesDescription =
            message +
            `\n\x1b[36mThe following edge relationship type count as invalid:\x1b[0m` +
            `\n` +
            `\n\x1b[36m \x1b[3m${LIFESPAN.SINGLETON} → ${LIFESPAN.TRANSIENT}\x1b[0m` +
            `\n\x1b[36m \x1b[3m${LIFESPAN.SINGLETON} → ${LIFESPAN.SCOPED}\x1b[0m` +
            `\n\x1b[36m \x1b[3m${LIFESPAN.SINGLETON} → ${LIFESPAN.DYNAMIC}\x1b[0m` +
            `\n\x1b[36m \x1b[3m${LIFESPAN.SCOPED} → ${LIFESPAN.TRANSIENT}\x1b[0m` +
            `\n\x1b[36m \x1b[3m${LIFESPAN.TRANSIENT} → ${LIFESPAN.DYNAMIC}\x1b[0m` +
            `\n`;

        return new InvalidEdgeRelationshipDiError(
            withRulesDescription,
            edgeErrorInfoStrings,
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
 * Thrown when a cycle dependency is detected in the service graph.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CycleDependencyDiError extends Error {
    /**
     * Creates a new {@link CycleDependencyDiError} instance.
     *
     * @param tokenA - The first token in the dependency cycle.
     * @param tokenB - The second token in the dependency cycle.
     * @returns A new error instance.
     */
    static create(
        cycles: Array<Array<DiToken>>,
        totalDetected?: number,
    ): CycleDependencyDiError {
        if (cycles.length === 0) {
            throw new UnexpectedError(
                "Tokens should contain at least two tokens.",
            );
        }

        const cyclesStrings = cycles
            .map((cycle) => {
                const firstToken = cycle.at(0);
                if (firstToken === undefined) {
                    throw new UnexpectedError("First token is undefined");
                }
                return [...cycle, firstToken]
                    .map((node) => tokenToString(node))
                    .join(" → ");
            })
            .map((cycle) => ({ cycle }));

        const totalCyclesDetected = totalDetected ?? cycles.length;
        const listIsShortened = cycles.length !== totalCyclesDetected;

        const message = listIsShortened
            ? `${totalCyclesDetected.toString()} cycles detected in graph. Only ${cycles.length.toString()} are shown.`
            : `${totalCyclesDetected.toString()} cycles detected in graph`;
        return new CycleDependencyDiError(message, cyclesStrings);
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

export type UndeclaredDependencyInfo<T = DiToken> = {
    missingDependency: T;
    dependents: Array<T>;
};
/**
 * Thrown when a node dependency or neighbor was referenced during graph traversal
 * but was not declared in the `nodeIds` list.
 */
export class UndeclaredDependenciesDiError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }

    // private constructor(message: string) {
    //     super(
    //         `Node was referenced as a neighbor/dependency but not listed in nodeIds.`,
    //     );
    //     this.name = "UndeclaredDependencyError";
    //     this.nodeId = nodeId;
    // }

    /**
     * Creates a new {@link UndeclaredDependenciesDiError} instance.
     *
     * @param nodeId - The node that was referenced but not declared.
     * @returns A new error instance.
     */
    static create(
        undeclaredDependencies: Array<UndeclaredDependencyInfo>,
        totalNodes?: number,
    ): UndeclaredDependenciesDiError {
        const totalUnDeclaredNodes =
            totalNodes ?? undeclaredDependencies.length;
        const listIsShortened =
            undeclaredDependencies.length !== totalUnDeclaredNodes;

        const message = listIsShortened
            ? `${totalUnDeclaredNodes.toString()} undeclared dependencies detected in graph. Only ${undeclaredDependencies.length.toString()} are shown.`
            : `${totalUnDeclaredNodes.toString()} undeclared dependencies detected in graph`;

        const undeclaredDependencyStrings = undeclaredDependencies.map(
            (undeclaredDependency) => ({
                missingDependency: tokenToString(
                    undeclaredDependency.missingDependency,
                ),
                dependents: undeclaredDependency.dependents.map((item) =>
                    tokenToString(item),
                ),
            }),
        );
        return new UndeclaredDependenciesDiError(
            message,
            undeclaredDependencyStrings,
        );
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

export class MethodCallInsideOfRunError extends UnexpectedError {
    /**
     * The name of the method that was called illegally.
     */
    public readonly methodName: string;

    constructor(methodName: string) {
        super(`the method ${methodName} was called inside run block`);
        this.name = MethodCallInsideOfRunError.name;
        this.methodName = methodName;
    }

    /**
     * Creates a new {@link MethodCallInsideOfRunError} error.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(methodName: string): MethodCallInsideOfRunError {
        return new MethodCallInsideOfRunError(methodName);
    }
}

/**
 * Thrown when a container method that is forbidden inside a run scope is
 * called from within `container.run()`.
 *
 * @group Errors
 */

export class MethodCallInsideOfDynamicRegistrationError extends UnexpectedError {
    /**
     * The name of the method that was called illegally.
     */
    public readonly methodName: string;

    constructor(methodName: string) {
        super(
            `the method ${methodName} was called inside DynamicRegistration in run block`,
        );
        this.name = MethodCallInsideOfDynamicRegistrationError.name;
        this.methodName = methodName;
    }

    /**
     * Creates a new {@link MethodCallInsideOfRunError} error.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(
        methodName: string,
    ): MethodCallInsideOfDynamicRegistrationError {
        return new MethodCallInsideOfDynamicRegistrationError(methodName);
    }
}

/**
 * Thrown when attempting to set a dynamic value for a token outside of a
 * `container.run()` scope. Dynamic registrations are only allowed inside a
 * run scope.
 *
 * @group Errors
 */
export class MethodCallOutsideOfRunError extends Error {
    constructor(token: DiToken) {
        super(
            `Cannot set dynamic value for registered token ${tokenToString(token)}: registration is only allowed inside a run scope. Call set() within container.run().`,
        );
        this.name = MethodCallOutsideOfRunError.name;
    }

    static create(token: DiToken): MethodCallOutsideOfRunError {
        return new MethodCallOutsideOfRunError(token);
    }
}

/**
 * Thrown when a service cannot be resolved.
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
            `Failed to resolve service for token: "${tokenToString(token)}".`,
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
 * Thrown when a service cannot be overridden, either because its type does
 * not support overriding (e.g., dynamic nodes) or because the service has
 * already been overridden.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CanNotOverrideService extends Error {
    /**
     * Creates a new {@link CanNotOverrideService} instance.
     *
     * @param token - The DI token that cannot be overridden.
     * @returns A new error instance.
     */
    static create(token: DiToken): CanNotOverrideService {
        return new CanNotOverrideService(
            `Failed to override service for token: "${tokenToString(token)}". Either the service is not registered, the service type cannot be overridden (e.g., dynamic nodes), or the service has already been overridden.`,
        );
    }

    /**
     * Note: Do not instantiate `CanNotOverrideService` directly via the constructor. Use the static {@link CanNotOverrideService.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = CanNotOverrideService.name;
    }
}
