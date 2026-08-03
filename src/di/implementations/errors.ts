/**
 * Thrown when a node dependency or neighbor was referenced during graph traversal
 * but was not declared in the `nodeIds` list.
 */

export class UndeclaredDependencyError<T = unknown> extends Error {
    public readonly nodeId: T;

    constructor(nodeId: T) {
        super(
            `Node "${String(nodeId)}" was referenced as a neighbor/dependency but not listed in nodeIds.`,
        );
        this.name = "UndeclaredDependencyError";
        this.nodeId = nodeId;
    }
}

export * from "@/di/contracts/container.errors.js";

/**
 * Base error for illegal container lifecycle method calls.
 *
 * @group Errors
 */
export class ContainerLifecycleError extends Error {
    /**
     * @param args - Contains the name of the illegally called method and a
     * function that produces the specific lifecycle error message.
     */
    constructor(args: {
        methodName: string;
        lifeCycleError: (methodName_: string) => string;
    }) {
        super(`Illegal method call: ${args.lifeCycleError(args.methodName)}`);
    }
}

/**
 * Thrown when a container method only valid to call before `container.init()` but was called after `container.init()`.
 *
 * @group Errors
 */
export class ContainerAlreadyInitializedException extends ContainerLifecycleError {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super({
            methodName,
            lifeCycleError: (methodName_) =>
                `"${methodName_}" was called before container.init() was invoked.`,
        });
    }
}

/**
 * Thrown when a container method only valid to call between `container.init()` to `container.deInit()` but called either before  `container.init()` or after `container.deInit()`.
 *
 * @group Errors
 */
export class ContainerNotActiveException extends ContainerLifecycleError {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super({
            methodName,
            lifeCycleError: (methodName_) =>
                `"${methodName_}" was called after container.init() was invoked.`,
        });
    }
}

/**
 * Thrown when a container method only valid to call after `container.deInit()` but was called before `container.deInit()
 *
 * @group Errors
 */
export class ContainerNotTerminatedException extends ContainerLifecycleError {
    /**
     * @param methodName - The name of the method that was called illegally.
     */
    constructor(methodName: string) {
        super({
            methodName,
            lifeCycleError: (methodName_) =>
                `"${methodName_}" was called after container.deInit() was invoked.`,
        });
    }
}
