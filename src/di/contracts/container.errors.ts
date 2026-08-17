/**
 * @module DI
 */

import { type DiToken } from "@/di/contracts/container.contract.js";
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
 * @internal
 */
function buildGraphMessage(args: {
    count: number;
    shownCount: number;
    singularNoun: string;
    pluralNoun: string;
    items: Array<string>;
    trailer?: string;
}): string {
    const noun = args.count === 1 ? args.singularNoun : args.pluralNoun;
    const shortenedNote =
        args.shownCount !== args.count
            ? ` Only ${args.shownCount.toString()} are shown.`
            : "";
    return (
        `${args.count.toString()} ${noun} detected in the service graph.` +
        shortenedNote +
        `\n` +
        args.items.map((item) => ` - ${item}`).join("\n") +
        (args.trailer === undefined ? "" : `\n${args.trailer}`)
    );
}

export type EdgeErrorInfo = {
    edge: [DiToken, DiToken];
    edgeType: [string, string];
};

export const INVALID_GRAPH_FLAG = {
    INVALID_EDGE_RELATIONSHIP: "invalid_edge_relationship",
    CYCLE_DEPENDENCY: "cycle_dependency",
    UNDECLARED_DEPENDENCIES: "undeclared_dependencies",
} as const;

export type InvalidGraphFlag =
    (typeof INVALID_GRAPH_FLAG)[keyof typeof INVALID_GRAPH_FLAG];

/**
 * The payload of an {@link InvalidGraph} error. The `flag` discriminates the
 * graph problem and works as a type guard: narrowing on `info.flag` exposes
 * the corresponding data field.
 */
export type InvalidGraphInfo =
    | {
          flag: typeof INVALID_GRAPH_FLAG.INVALID_EDGE_RELATIONSHIP;
          edgeErrors: Array<{ edge: string; edgeType: string }>;
      }
    | {
          flag: typeof INVALID_GRAPH_FLAG.CYCLE_DEPENDENCY;
          cycles: Array<{ cycle: string }>;
      }
    | {
          flag: typeof INVALID_GRAPH_FLAG.UNDECLARED_DEPENDENCIES;
          undeclaredDependencies: Array<{
              missingDependency: string;
              dependents: Array<string>;
          }>;
      };

export type UndeclaredDependencyInfo<T = DiToken> = {
    missingDependency: T;
    dependents: Array<T>;
};

/**
 * The settings accepted by {@link InvalidGraph.create}. The `flag` selects the
 * graph problem and works as a type guard for the remaining arguments.
 */
export type InvalidGraphCreateSettings =
    | {
          flag: typeof INVALID_GRAPH_FLAG.INVALID_EDGE_RELATIONSHIP;
          edgeErrorInfos: Array<EdgeErrorInfo>;
          totalDetected?: number;
      }
    | {
          flag: typeof INVALID_GRAPH_FLAG.CYCLE_DEPENDENCY;
          cycles: Array<Array<DiToken>>;
          totalDetected?: number;
      }
    | {
          flag: typeof INVALID_GRAPH_FLAG.UNDECLARED_DEPENDENCIES;
          undeclaredDependencies: Array<UndeclaredDependencyInfo>;
          totalNodes?: number;
      };

/**
 * Thrown when the service graph is invalid. The `flag` (and matching `info`
 * field) identifies the specific problem:
 * - Invalid edge relationship (invalid lifetime configuration).
 * - Cycle dependency.
 * - Undeclared dependencies.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class InvalidGraph extends Error {
    /**
     * The graph problem details, discriminated by `flag`.
     */
    public readonly info: InvalidGraphInfo;

    /**
     * Creates a new {@link InvalidGraph} instance.
     *
     * @param settings - A discriminated union of settings. The `flag` selects
     * which graph problem occurred and acts as a type guard for the remaining
     * fields.
     * @returns A new error instance.
     */
    static create(settings: InvalidGraphCreateSettings): InvalidGraph {
        switch (settings.flag) {
            case INVALID_GRAPH_FLAG.INVALID_EDGE_RELATIONSHIP: {
                const { edgeErrorInfos, totalDetected } = settings;
                const totalEdgesDetected =
                    totalDetected ?? edgeErrorInfos.length;

                const edgeErrors = edgeErrorInfos.map((item) => ({
                    edge: `${tokenToString(item.edge[0])} → ${tokenToString(item.edge[1])}`,
                    edgeType: `${item.edgeType[0]} → ${item.edgeType[1]}`,
                }));

                const message = buildGraphMessage({
                    count: totalEdgesDetected,
                    shownCount: edgeErrorInfos.length,
                    singularNoun: "invalid edge relationship",
                    pluralNoun: "invalid edge relationships",
                    items: edgeErrors.map(
                        ({ edge, edgeType }) => `${edge} (${edgeType})`,
                    ),
                    trailer:
                        "The following edge relationships are invalid:" +
                        "\n - singleton → transient" +
                        "\n - singleton → scoped" +
                        "\n - singleton → dynamic" +
                        "\n - scoped → transient" +
                        "\n - transient → dynamic" +
                        "\n - dynamic → singleton" +
                        "\n - dynamic → transient" +
                        "\n - dynamic → scoped" +
                        "\n - dynamic → dynamic",
                });

                return new InvalidGraph(message, {
                    flag: settings.flag,
                    edgeErrors,
                });
            }
            case INVALID_GRAPH_FLAG.CYCLE_DEPENDENCY: {
                const { cycles, totalDetected } = settings;
                const cyclesStrings = cycles
                    .map((cycle) => {
                        const firstToken = cycle.at(0);
                        if (firstToken === undefined) {
                            throw new UnexpectedError(
                                "First token is undefined",
                            );
                        }
                        return [...cycle, firstToken]
                            .map((node) => tokenToString(node))
                            .join(" → ");
                    })
                    .map((cycle) => ({ cycle }));

                const totalCyclesDetected = totalDetected ?? cycles.length;

                const message = buildGraphMessage({
                    count: totalCyclesDetected,
                    shownCount: cycles.length,
                    singularNoun: "cycle",
                    pluralNoun: "cycles",
                    items: cyclesStrings.map(({ cycle }) => cycle),
                });

                return new InvalidGraph(message, {
                    flag: settings.flag,
                    cycles: cyclesStrings,
                });
            }
            case INVALID_GRAPH_FLAG.UNDECLARED_DEPENDENCIES: {
                const { undeclaredDependencies, totalNodes } = settings;
                const totalUnDeclaredNodes =
                    totalNodes ?? undeclaredDependencies.length;

                const undeclaredDependencyStrings = undeclaredDependencies.map(
                    (undeclaredDependency) => ({
                        missingDependency: tokenToString(
                            undeclaredDependency.missingDependency,
                        ),
                        dependents: undeclaredDependency.dependents.map(
                            (item) => tokenToString(item),
                        ),
                    }),
                );

                const message = buildGraphMessage({
                    count: totalUnDeclaredNodes,
                    shownCount: undeclaredDependencies.length,
                    singularNoun: "undeclared dependency",
                    pluralNoun: "undeclared dependencies",
                    items: undeclaredDependencyStrings.map(
                        ({ missingDependency, dependents }) =>
                            `"${missingDependency}" referenced by [${dependents.join(", ")}]`,
                    ),
                });

                return new InvalidGraph(message, {
                    flag: settings.flag,
                    undeclaredDependencies: undeclaredDependencyStrings,
                });
            }
        }
    }

    /**
     * Note: Do not instantiate `InvalidGraph` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param info - The graph problem details, discriminated by `flag`.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, info: InvalidGraphInfo, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidGraph.name;
        this.info = info;
    }
}

export const METHOD_CALL_FLAG = {
    NOT_ACTIVE: "container_not_active",
    ALREADY_INITIALIZED: "container_already_initialized",
    INSIDE_RUN: "method_call_inside_run",
    INSIDE_DYNAMIC_REGISTRATION: "method_call_inside_dynamic_registration",
    OUTSIDE_RUN: "method_call_outside_of_run",
} as const;

export type MethodCallFlag =
    (typeof METHOD_CALL_FLAG)[keyof typeof METHOD_CALL_FLAG];

/**
 * Thrown when a container method is called at an invalid time or context.
 * The `flag` identifies which rule was violated.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class InvalidMethodCall extends Error {
    /**
     * The name of the method that was called illegally.
     */
    public readonly methodName: string;

    /**
     * The reason why the method call is invalid.
     */
    public readonly flag: MethodCallFlag;

    /**
     * The token involved in the invalid call, if any.
     */
    public readonly token: DiToken | null;

    /**
     * Creates a new {@link InvalidMethodCall} instance.
     *
     * @param settings - The method name, the reason why the call is invalid,
     * and the token involved in the invalid call, if any.
     * @returns A new error instance.
     */
    static create(settings: {
        methodName: string;
        flag: MethodCallFlag;
        token?: DiToken;
    }): InvalidMethodCall {
        return new InvalidMethodCall(
            settings.methodName,
            settings.flag,
            settings.token,
        );
    }

    /**
     * Note: Do not instantiate `InvalidMethodCall` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param methodName - The name of the method that was called illegally.
     * @param flag - The reason why the method call is invalid.
     * @param token - The token involved in the invalid call, if any.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        methodName: string,
        flag: MethodCallFlag,
        token?: DiToken,
        cause?: unknown,
    ) {
        super(InvalidMethodCall.createMessage(methodName, flag, token), {
            cause,
        });
        this.name = InvalidMethodCall.name;
        this.methodName = methodName;
        this.flag = flag;
        this.token = token ?? null;
    }

    private static createMessage(
        methodName: string,
        flag: MethodCallFlag,
        token?: DiToken,
    ): string {
        switch (flag) {
            case METHOD_CALL_FLAG.ALREADY_INITIALIZED:
                return `Illegal method call: "${methodName}" was called after container.init() was invoked.`;
            case METHOD_CALL_FLAG.INSIDE_RUN:
                return `Illegal method call: "${methodName}" was called inside container.run(). Move the call outside of the run scope.`;
            case METHOD_CALL_FLAG.INSIDE_DYNAMIC_REGISTRATION:
                return `Illegal method call: "${methodName}" was called inside the dynamicRegistration callback of container.run(). Use the IDynamicServiceRegister to set dynamic values instead.`;
            case METHOD_CALL_FLAG.OUTSIDE_RUN:
                return token === undefined
                    ? `Illegal method call: "${methodName}" was called outside of a run scope. Dynamic values can only be set within container.run().`
                    : `Cannot set dynamic value for registered token "${tokenToString(token)}": registration is only allowed inside a run scope. Call set() within container.run().`;
            case METHOD_CALL_FLAG.NOT_ACTIVE:
            default:
                return `Illegal method call: "${methodName}" was called before container.init() or after container.deInit() was invoked.`;
        }
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
     * The DI token that could not be resolved.
     */
    public readonly token: DiToken;

    /**
     * Creates a new {@link ServiceCanNotBeResolvedError} instance.
     *
     * @param token - The DI token that could not be resolved.
     * @returns A new error instance.
     */
    static create(token: DiToken): ServiceCanNotBeResolvedError {
        return new ServiceCanNotBeResolvedError(token);
    }

    /**
     * Note: Do not instantiate `ServiceCanNotBeResolvedError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param token - The DI token that could not be resolved.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(token: DiToken, cause?: unknown) {
        super(
            `Failed to resolve service for token: "${tokenToString(token)}".`,
            { cause },
        );
        this.name = ServiceCanNotBeResolvedError.name;
        this.token = token;
    }
}

/**
 * Thrown when attempting to register a service with a token that already
 * has an existing registration.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceAlreadyRegisteredDiError extends Error {
    /**
     * The DI token that already has a registration.
     */
    public readonly token: DiToken;

    /**
     * Creates a new {@link ServiceAlreadyRegisteredDiError} instance.
     *
     * @param token - The DI token that already has a registration.
     * @returns A new error instance.
     */
    static create(token: DiToken): ServiceAlreadyRegisteredDiError {
        return new ServiceAlreadyRegisteredDiError(token);
    }

    /**
     * Note: Do not instantiate `ServiceAlreadyRegisteredDiError` directly via the constructor. Use the static {@link ServiceAlreadyRegisteredDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with error types and prevent type errors.
     *
     * @param token - The DI token that already has a registration.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(token: DiToken, cause?: unknown) {
        super(
            `Failed to register service for token: "${tokenToString(token)}". A registration with this token already exists and cannot be replaced.`,
            { cause },
        );
        this.name = ServiceAlreadyRegisteredDiError.name;
        this.token = token;
    }
}

export const CAN_NOT_OVERRIDE_CAUSE_FLAG = {
    UNKNOWN: "UNKNOWN_CAUSE",
    DYNAMIC_TOKEN: "TOKEN_REGISTERED_AS_DYNAMIC",
    TOKEN_NOT_REGISTERED: "NOT_REGISTERED",
    ALREADY_OVERRIDDEN: "ALREADY_OVERRIDDEN",
};

export type CanNotOverrideFlag =
    (typeof CAN_NOT_OVERRIDE_CAUSE_FLAG)[keyof typeof CAN_NOT_OVERRIDE_CAUSE_FLAG];
/**
 * Thrown when a service cannot be overridden, either because its type does
 * not support overriding (e.g., dynamic nodes) or because the service has
 * already been overridden.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CanNotOverrideServiceDiError extends Error {
    /**
     * The DI token that cannot be overridden.
     */
    public readonly token: DiToken;

    /**
     * The reason why the service cannot be overridden.
     */
    public readonly flag: CanNotOverrideFlag;

    /**
     * Creates a new {@link CanNotOverrideServiceDiError} instance.
     *
     * @param settings - The token that cannot be overridden and the reason why,
     * if known.
     * @returns A new error instance.
     */
    static create(settings: {
        token: DiToken;
        flag?: CanNotOverrideFlag;
    }): CanNotOverrideServiceDiError {
        return new CanNotOverrideServiceDiError(settings.token, settings.flag);
    }

    /**
     * Note: Do not instantiate `CanNotOverrideServiceDiError` directly via the constructor. Use the static {@link CanNotOverrideServiceDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param token - The DI token that cannot be overridden.
     * @param flag - The reason why the service cannot be overridden. Defaults to {@link CAN_NOT_OVERRIDE_CAUSE_FLAG.UNKNOWN}.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        token: DiToken,
        flag: CanNotOverrideFlag = CAN_NOT_OVERRIDE_CAUSE_FLAG.UNKNOWN,
        cause?: unknown,
    ) {
        const tokenName = tokenToString(token);
        const message = (() => {
            switch (flag) {
                case CAN_NOT_OVERRIDE_CAUSE_FLAG.DYNAMIC_TOKEN:
                    return `Failed to override service for token: "${tokenName}". The token is registered as dynamic and cannot be overridden.`;
                case CAN_NOT_OVERRIDE_CAUSE_FLAG.TOKEN_NOT_REGISTERED:
                    return `Failed to override service for token: "${tokenName}". The token is not registered.`;
                case CAN_NOT_OVERRIDE_CAUSE_FLAG.ALREADY_OVERRIDDEN:
                    return `Failed to override service for token: "${tokenName}". The service has already been overridden.`;
                default:
                    return `Failed to override service for token: "${tokenName}". Either the service is not registered, the service type cannot be overridden (e.g., dynamic nodes), or the service has already been overridden.`;
            }
        })();
        super(message, { cause });
        this.name = CanNotOverrideServiceDiError.name;
        this.token = token;
        this.flag = flag;
    }
}
