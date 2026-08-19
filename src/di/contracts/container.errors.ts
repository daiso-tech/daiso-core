/**
 * @module DI
 */

import { type DiToken } from "@/di/contracts/container.contract.js";
import { isClass, UnexpectedError } from "@/utilities/_module.js";

const UNMANAGED_FLAG_ERROR_MESSAGE = "Unmanaged flag";

/**
 * @internal
 */
function tokenToString(diToken: DiToken): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.id.toString();
}

export type InvalidMethodCallFlag =
    (typeof InvalidMethodCallDiError.FLAG)[keyof typeof InvalidMethodCallDiError.FLAG];

/**
 * The object literal `{ flag, ...data }` describing an invalid method call.
 * The `flag` discriminates the remaining fields.
 */
export type InvalidMethodCallData =
    | {
          flag: typeof InvalidMethodCallDiError.FLAG.NOT_ACTIVE;
          methodName: string;
      }
    | {
          flag: typeof InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED;
          methodName: string;
      }
    | {
          flag: typeof InvalidMethodCallDiError.FLAG.INSIDE_RUN;
          methodName: string;
      }
    | {
          flag: typeof InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION;
          methodName: string;
      }
    | {
          flag: typeof InvalidMethodCallDiError.FLAG.OUTSIDE_RUN;
          methodName: string;
          token: DiToken;
      };
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

export type InvalidGraphFlag =
    (typeof InvalidGraphDiError.FLAG)[keyof typeof InvalidGraphDiError.FLAG];

export type EdgeErrorInfo = {
    edge: [DiToken, DiToken];
    edgeType: [string, string];
};

/**
 * The payload of an {@link InvalidGraphDiError} error. The `flag` discriminates the
 * graph problem and works as a type guard: narrowing on `info.flag` exposes
 * the corresponding data field.
 */
export type InvalidGraphInfo =
    | {
          flag: typeof InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP;
          edgeErrors: Array<{ edge: string; edgeType: string }>;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY;
          cycles: Array<{ cycle: string }>;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES;
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
 * The settings accepted by {@link InvalidGraphDiError.create}. The `flag` selects the
 * graph problem and works as a type guard for the remaining arguments.
 */
export type InvalidGraphCreateSettings =
    | {
          flag: typeof InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP;
          edgeErrorInfos: Array<EdgeErrorInfo>;
          totalDetected?: number;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY;
          cycles: Array<Array<DiToken>>;
          totalDetected?: number;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES;
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
export class InvalidGraphDiError extends Error {
    /**
     * The kinds of graph problems that can be detected.
     */
    public static readonly FLAG = {
        INVALID_EDGE_RELATIONSHIP: "INVALID_EDGE_RELATIONSHIP",
        CYCLE_DEPENDENCY: "CYCLE_DEPENDENCY",
        UNDECLARED_DEPENDENCIES: "UNDECLARED_DEPENDENCIES",
    } as const;

    /**
     * The graph problem details, discriminated by `flag`.
     */
    public readonly info: InvalidGraphInfo;

    /**
     * The kind of graph problem.
     */
    public get flag(): InvalidGraphFlag {
        return this.info.flag;
    }

    /**
     * Creates a new {@link InvalidGraphDiError} instance.
     *
     * @param settings - A discriminated union of settings. The `flag` selects
     * which graph problem occurred and acts as a type guard for the remaining
     * fields.
     * @returns A new error instance.
     */
    static create(settings: InvalidGraphCreateSettings): InvalidGraphDiError {
        switch (settings.flag) {
            case InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP:
                return InvalidGraphDiError.createInvalidEdgeRelationshipError(
                    settings,
                );
            case InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY:
                return InvalidGraphDiError.createCycleDependencyError(settings);
            case InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES:
                return InvalidGraphDiError.createUndeclaredDependenciesError(
                    settings,
                );
        }
    }

    private static createInvalidEdgeRelationshipError(
        settings: Extract<
            InvalidGraphCreateSettings,
            { flag: typeof InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP }
        >,
    ): InvalidGraphDiError {
        const { edgeErrorInfos, totalDetected } = settings;
        const totalEdgesDetected = totalDetected ?? edgeErrorInfos.length;

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

        return new InvalidGraphDiError(message, {
            flag: settings.flag,
            edgeErrors,
        });
    }

    private static createCycleDependencyError(
        settings: Extract<
            InvalidGraphCreateSettings,
            { flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY }
        >,
    ): InvalidGraphDiError {
        const { cycles, totalDetected } = settings;
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

        const message = buildGraphMessage({
            count: totalCyclesDetected,
            shownCount: cycles.length,
            singularNoun: "cycle",
            pluralNoun: "cycles",
            items: cyclesStrings.map(({ cycle }) => cycle),
        });

        return new InvalidGraphDiError(message, {
            flag: settings.flag,
            cycles: cyclesStrings,
        });
    }

    private static createUndeclaredDependenciesError(
        settings: Extract<
            InvalidGraphCreateSettings,
            { flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES }
        >,
    ): InvalidGraphDiError {
        const { undeclaredDependencies, totalNodes } = settings;
        const totalUnDeclaredNodes =
            totalNodes ?? undeclaredDependencies.length;

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

        return new InvalidGraphDiError(message, {
            flag: settings.flag,
            undeclaredDependencies: undeclaredDependencyStrings,
        });
    }

    /**
     * Note: Do not instantiate `InvalidGraphDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param info - The graph problem details, discriminated by `flag`.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, info: InvalidGraphInfo, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidGraphDiError.name;
        this.info = info;
    }
}

/**
 * Thrown when a container method is called at an invalid time or context.
 * The `flag` identifies which rule was violated.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class InvalidMethodCallDiError extends Error {
    /**
     * The reasons why a container method call can be invalid.
     */
    public static readonly FLAG = {
        NOT_ACTIVE: "CONTAINER_NOT_ACTIVE",
        ALREADY_INITIALIZED: "CONTAINER_ALREADY_INITIALIZED",
        INSIDE_RUN: "METHOD_CALL_INSIDE_RUN",
        INSIDE_DYNAMIC_REGISTRATION: "METHOD_CALL_INSIDE_DYNAMIC_REGISTRATION",
        OUTSIDE_RUN: "METHOD_CALL_OUTSIDE_OF_RUN",
    } as const;

    /**
     * The details of the invalid call, discriminated by `flag`.
     */
    public readonly info: InvalidMethodCallData;

    /**
     * The reason why the method call is invalid.
     */
    public get flag(): InvalidMethodCallFlag {
        return this.info.flag;
    }

    /**
     * Creates a new {@link InvalidMethodCallDiError} instance.
     *
     * @param settings - An object literal `{ flag, ...data }`. The `flag`
     * selects which rule was violated and acts as a type guard for the
     * remaining fields.
     * @returns A new error instance.
     */
    static create(settings: InvalidMethodCallData): InvalidMethodCallDiError {
        const message = InvalidMethodCallDiError.createMessage(settings);
        return new InvalidMethodCallDiError(message, settings);
    }

    /**
     * Note: Do not instantiate `InvalidMethodCallDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param settings - An object literal `{ flag, ...data }` describing the
     * invalid call.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        message: string,
        settings: InvalidMethodCallData,
        cause?: unknown,
    ) {
        super(message, {
            cause,
        });
        this.name = InvalidMethodCallDiError.name;
        this.info = settings;
    }

    private static createMessage(settings: InvalidMethodCallData): string {
        switch (settings.flag) {
            case InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED:
                return `Illegal method call: "${settings.methodName}" was called after container.init() was invoked.`;
            case InvalidMethodCallDiError.FLAG.INSIDE_RUN:
                return `Illegal method call: "${settings.methodName}" was called inside container.run(). Move the call outside of the run scope.`;
            case InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION:
                return `Illegal method call: "${settings.methodName}" was called inside the dynamicRegistration callback of container.run(). Use the IDynamicServiceRegister to set dynamic values instead.`;
            case InvalidMethodCallDiError.FLAG.OUTSIDE_RUN:
                return `Cannot set dynamic value for registered token "${tokenToString(settings.token)}": registration is only allowed inside a run scope. Call set() within container.run().`;
            case InvalidMethodCallDiError.FLAG.NOT_ACTIVE:
                return `Illegal method call: "${settings.methodName}" was called before container.init() or after container.deInit() was invoked.`;
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
    }
}

export type ServiceCanNotBeResolvedErrorFlag =
    (typeof ServiceCanNotBeResolvedDiError.FLAG)[keyof typeof ServiceCanNotBeResolvedDiError.FLAG];

/**
 * The object literal `{ flag, data }` describing why a service could not be
 * resolved. The `flag` discriminates the shape of `data`:
 * - `GENERAL` - no further details.
 * - `NOT_REGISTERED`, `SCOPED_SERVICE`, `DYNAMIC_SERVICE` - `data` is the
 *   offending {@link DiToken}.
 * - `TRANSIENT_SERVICE_DEPEND_ON_SCOPED` - `data` holds both the transient
 *   and the scoped tokens.
 * - `RESOLVED_VALUE_IS_NULL` - `data` is the offending {@link DiToken}.
 * - `NO_DYNAMIC_VALUE_SET_FOR_TOKEN` - `data` is the offending
 *   {@link DiToken}.
 */
export type ServiceCanNotBeResolvedErrorData =
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.NOT_REGISTERED_TOKEN;
          token: DiToken;
      }
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN;
          token: DiToken;
      }
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN;
          token: DiToken;
      }
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED;
          transientToken: DiToken;
          scopedTokens: Array<DiToken>;
      }
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL;
          token: DiToken;
      }
    | {
          flag: typeof ServiceCanNotBeResolvedDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKEN;
          token: DiToken;
      };

/**
 * Thrown when a service cannot be resolved.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class ServiceCanNotBeResolvedDiError extends Error {
    /**
     * The reasons why a service cannot be resolved.
     */
    public static readonly FLAG = {
        NOT_REGISTERED_TOKEN: "NOT_REGISTERED_TOKEN",
        SCOPED_SERVICE_OUTSIDE_RUN: "SCOPED_SERVICE_OUTSIDE_RUN",
        DYNAMIC_SERVICE_OUTSIDE_RUN: "DYNAMIC_SERVICE_OUTSIDE_RUN",
        TRANSIENT_SERVICE_DEPEND_ON_SCOPED:
            "TRANSIENT_SERVICE_DEPEND_ON_SCOPED_SERVICE",
        RESOLVED_VALUE_IS_NULL: "RESOLVED_VALUE_IS_NULL",
        NO_DYNAMIC_VALUE_SET_FOR_TOKEN: "NO_DYNAMIC_VALUE_SET_FOR_TOKEN",
    } as const;

    /**
     * The reason why the service could not be resolved together with the
     * related data. The `flag` acts as a type guard: narrowing on
     * `info.flag` exposes the corresponding `data` field.
     */
    public readonly info: ServiceCanNotBeResolvedErrorData;

    /**
     * The reason why the service could not be resolved.
     */
    public get flag(): ServiceCanNotBeResolvedErrorFlag {
        return this.info.flag;
    }

    /**
     * Creates a new {@link ServiceCanNotBeResolvedDiError} instance.
     *
     * @param settings - An object literal `{ flag, data }`. The `flag` selects
     * which failure occurred and acts as a type guard for the `data` field.
     * @returns A new error instance.
     */
    static create(
        settings: ServiceCanNotBeResolvedErrorData,
    ): ServiceCanNotBeResolvedDiError {
        const message = this.createMessage(settings);
        return new ServiceCanNotBeResolvedDiError(message, settings);
    }

    /**
     * Note: Do not instantiate `ServiceCanNotBeResolvedDiError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param settings - An object literal `{ flag, data }` describing why the
     * service could not be resolved.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        message: string,
        data: ServiceCanNotBeResolvedErrorData,
        cause?: unknown,
    ) {
        super(message, {
            cause,
        });
        this.name = ServiceCanNotBeResolvedDiError.name;
        this.info = data;
    }

    private static createMessage(
        settings: ServiceCanNotBeResolvedErrorData,
    ): string {
        switch (settings.flag) {
            case ServiceCanNotBeResolvedDiError.FLAG.NOT_REGISTERED_TOKEN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The token is not registered.`;
            case ServiceCanNotBeResolvedDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The service is scoped and can only be resolved inside a run scope.`;
            case ServiceCanNotBeResolvedDiError.FLAG
                .DYNAMIC_SERVICE_OUTSIDE_RUN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The service is dynamic and no value has been set for it within the current run scope.`;
            case ServiceCanNotBeResolvedDiError.FLAG
                .TRANSIENT_SERVICE_DEPEND_ON_SCOPED: {
                const scopedTokensString = settings.scopedTokens
                    .map((token) => tokenToString(token))
                    .join(", ");
                return `Failed to resolve service for token: "${tokenToString(settings.transientToken)}". The service is transient and depends on a scoped service ("${scopedTokensString}"), so it can only be resolved inside a run scope.`;
            }
            case ServiceCanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The resolved value is null.`;
            case ServiceCanNotBeResolvedDiError.FLAG
                .NO_DYNAMIC_VALUE_SET_FOR_TOKEN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The token is registered but no dynamic value has been set for it.`;
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
    }
}

export type CanNotRegisterFlag =
    (typeof CanNotRegisterServiceDiError.FLAG)[keyof typeof CanNotRegisterServiceDiError.FLAG];

/**
 * The object literal `{ flag, token }` describing why a service cannot be
 * registered. The `flag` discriminates the remaining fields.
 */
export type CanNotRegisterServiceDiErrorData = {
    flag: typeof CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED;
    token: DiToken;
};

/**
 * Thrown when a service cannot be registered, because a registration with
 * the token already exists.
 *
 * @group Errors
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export class CanNotRegisterServiceDiError extends Error {
    /**
     * The reasons why a service cannot be registered.
     */
    public static readonly FLAG = {
        ALREADY_REGISTERED: "ALREADY_REGISTERED",
    } as const;

    /**
     * The reason why the service cannot be registered together with the
     * related data. The `flag` acts as a type guard.
     */
    public readonly info: CanNotRegisterServiceDiErrorData;

    /**
     * The reason why the service cannot be registered.
     */
    public get flag(): CanNotRegisterFlag {
        return this.info.flag;
    }

    /**
     * Creates a new {@link CanNotRegisterServiceDiError} instance.
     *
     * @param settings - An object literal `{ flag, token }`. The `flag`
     * selects which rule was violated and acts as a type guard for the
     * remaining fields.
     * @returns A new error instance.
     */
    static create(
        settings: CanNotRegisterServiceDiErrorData,
    ): CanNotRegisterServiceDiError {
        const message = CanNotRegisterServiceDiError.createMessage(settings);
        return new CanNotRegisterServiceDiError(message, settings);
    }

    /**
     * Note: Do not instantiate `CanNotRegisterServiceDiError` directly via the constructor. Use the static {@link CanNotRegisterServiceDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with error types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param settings - An object literal `{ flag, token }` describing why the
     * service cannot be registered.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        message: string,
        settings: CanNotRegisterServiceDiErrorData,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = CanNotRegisterServiceDiError.name;
        this.info = settings;
    }

    private static createMessage(
        settings: CanNotRegisterServiceDiErrorData,
    ): string {
        return `Failed to register service for token: "${tokenToString(settings.token)}". A registration with this token already exists and cannot be replaced.`;
    }
}

export type CanNotOverrideFlag =
    (typeof CanNotOverrideServiceDiError.FLAG)[keyof typeof CanNotOverrideServiceDiError.FLAG];

/**
 * The object literal `{ flag, ...data }` describing why a service cannot be
 * overridden. The `flag` discriminates the remaining fields.
 */
export type CanNotOverrideServiceDiErrorData =
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN;
          token: DiToken;
      }
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED;
          token: DiToken;
      }
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN;
          token: DiToken;
      };

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
     * The reasons why a service cannot be overridden.
     */
    public static readonly FLAG = {
        DYNAMIC_TOKEN: "TOKEN_REGISTERED_AS_DYNAMIC",
        TOKEN_NOT_REGISTERED: "NOT_REGISTERED",
        ALREADY_OVERRIDDEN: "ALREADY_OVERRIDDEN",
    } as const;

    /**
     * The reason why the service cannot be overridden together with the
     * related data. The `flag` acts as a type guard.
     */
    public readonly info: CanNotOverrideServiceDiErrorData;

    /**
     * The reason why the service cannot be overridden.
     */
    public get flag(): CanNotOverrideFlag {
        return this.info.flag;
    }

    /**
     * Creates a new {@link CanNotOverrideServiceDiError} instance.
     *
     * @param settings - An object literal `{ flag, ...data }`. The `flag`
     * selects which rule was violated and acts as a type guard for the
     * remaining fields.
     * @returns A new error instance.
     */
    static create(
        settings: CanNotOverrideServiceDiErrorData,
    ): CanNotOverrideServiceDiError {
        const message = CanNotOverrideServiceDiError.createMessage(settings);
        return new CanNotOverrideServiceDiError(message, settings);
    }

    /**
     * Note: Do not instantiate `CanNotOverrideServiceDiError` directly via the constructor. Use the static {@link CanNotOverrideServiceDiError.create | `create()`} factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     *
     * @param message - A descriptive error message.
     * @param settings - An object literal `{ flag, ...data }` describing why the
     * service cannot be overridden.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(
        message: string,
        settings: CanNotOverrideServiceDiErrorData,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = CanNotOverrideServiceDiError.name;
        this.info = settings;
    }

    private static createMessage(
        settings: CanNotOverrideServiceDiErrorData,
    ): string {
        const tokenName = tokenToString(settings.token);
        switch (settings.flag) {
            case CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN:
                return `Failed to override service for token: "${tokenName}". The token is registered as dynamic and cannot be overridden.`;
            case CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED:
                return `Failed to override service for token: "${tokenName}". The token is not registered.`;
            case CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN:
                return `Failed to override service for token: "${tokenName}". The service has already been overridden.`;
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
    }
}
