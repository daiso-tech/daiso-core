/**
 * @module DI
 */

import { isClass, UnexpectedError } from "@/utilities/_module.js";

import type { DiToken } from "@/di/contracts/container.contract.js";

/**
 * @internal
 */
const UNMANAGED_FLAG_ERROR_MESSAGE = "Unmanaged flag";

/**
 * @internal
 */
function tokenToString(diToken: DiToken): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.id.description ?? String(diToken.id);
}

/**
 * The common shape of every DI error: a `flag` identifying the failure
 * reason and an `info` object carrying the related data.
 *
 * @internal
 */
interface IDIError<T1 extends string, T2> {
    /**
     * The reason why the error occurred.
     */
    get flag(): T1;

    /**
     * The details of the error, discriminated by `flag`.
     */
    get info(): T2;
}

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 *
 */
export type InvalidMethodCallFlag =
    (typeof InvalidMethodCallDiError.FLAG)[keyof typeof InvalidMethodCallDiError.FLAG];

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type InvalidMethodCallDiErrorData =
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
            ? ` Only ${args.shownCount.toString()} ${
                  args.shownCount === 1 ? "is" : "are"
              } shown.`
            : "";
    return (
        `${args.count.toString()} ${noun} detected in the service graph.` +
        shortenedNote +
        `\n` +
        args.items.map((item) => ` - ${item}`).join("\n") +
        (args.trailer === undefined ? "" : `\n${args.trailer}`)
    );
}

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type InvalidGraphFlag =
    (typeof InvalidGraphDiError.FLAG)[keyof typeof InvalidGraphDiError.FLAG];

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type EdgeErrorInfo = {
    edge: [DiToken, DiToken];
    edgeType: [string, string];
};

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type InvalidGraphData =
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

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type UndeclaredDependencyInfo<T = DiToken> = {
    missingDependency: T;
    dependents: Array<T>;
};

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type InvalidGraphCreateData =
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
          totalDetected?: number;
      };

/**
 * Thrown when the service graph is invalid.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export class InvalidGraphDiError
    extends Error
    implements IDIError<InvalidGraphFlag, InvalidGraphData>
{
    /**
     * The kinds of graph problems that can be detected.
     *
     * - {@link InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP}: An edge violates a lifetime compatibility rule.
     * - {@link InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY}: The graph contains a dependency cycle.
     * - {@link InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES}: The graph references undeclared dependencies.
     */
    static readonly FLAG = {
        INVALID_EDGE_RELATIONSHIP: "INVALID_EDGE_RELATIONSHIP",
        CYCLE_DEPENDENCY: "CYCLE_DEPENDENCY",
        UNDECLARED_DEPENDENCIES: "UNDECLARED_DEPENDENCIES",
    } as const;

    get flag(): InvalidGraphFlag {
        return this.info.flag;
    }

    readonly info: InvalidGraphData;

    private static createInvalidEdgeRelationshipError(
        settings: Extract<
            InvalidGraphCreateData,
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
            InvalidGraphCreateData,
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
            InvalidGraphCreateData,
            { flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES }
        >,
    ): InvalidGraphDiError {
        const { undeclaredDependencies, totalDetected } = settings;
        const totalUnDeclaredNodes =
            totalDetected ?? undeclaredDependencies.length;

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
     * Note: Do not instantiate {@link InvalidGraphDiError} directly via the constructor. Use the static {@link InvalidGraphDiError.create} factory method instead.
     * The constructor remains  only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, info: InvalidGraphData, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidGraphDiError.name;
        this.info = info;
    }

    /**
     * Creates a new {@link InvalidGraphDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(data: InvalidGraphCreateData): InvalidGraphDiError {
        switch (data.flag) {
            case InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP:
                return InvalidGraphDiError.createInvalidEdgeRelationshipError(
                    data,
                );
            case InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY:
                return InvalidGraphDiError.createCycleDependencyError(data);
            case InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES:
                return InvalidGraphDiError.createUndeclaredDependenciesError(
                    data,
                );
        }
    }
}

/**
 * Thrown when a container method is called at an invalid time or context.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export class InvalidMethodCallDiError
    extends Error
    implements IDIError<InvalidMethodCallFlag, InvalidMethodCallDiErrorData>
{
    /**
     * The reasons why a container method call can be invalid.
     *
     * - {@link InvalidMethodCallDiError.FLAG.NOT_ACTIVE}: The container is inactive (before {@link IContainer.init} or after {@link IContainer.deInit}).
     * - {@link InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED}: The container is already initialized.
     * - {@link InvalidMethodCallDiError.FLAG.INSIDE_RUN}: The call happens inside a {@link IContainer.run} scope.
     * - {@link InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION}: The call happens inside the dynamic registration callback.
     * - {@link InvalidMethodCallDiError.FLAG.OUTSIDE_RUN}: A dynamic value is set outside a run scope.
     */
    static readonly FLAG = {
        NOT_ACTIVE: "CONTAINER_NOT_ACTIVE",
        ALREADY_INITIALIZED: "CONTAINER_ALREADY_INITIALIZED",
        INSIDE_RUN: "METHOD_CALL_INSIDE_RUN",
        INSIDE_DYNAMIC_REGISTRATION: "METHOD_CALL_INSIDE_DYNAMIC_REGISTRATION",
        OUTSIDE_RUN: "METHOD_CALL_OUTSIDE_OF_RUN",
    } as const;

    get flag(): InvalidMethodCallFlag {
        return this.info.flag;
    }

    readonly info: InvalidMethodCallDiErrorData;

    /**
     * Note: Do not instantiate {@link InvalidMethodCallDiError} directly via the constructor. Use the static {@link InvalidMethodCallDiError.create} factory method instead.
     * The constructor remains only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        message: string,
        settings: InvalidMethodCallDiErrorData,
        cause?: unknown,
    ) {
        super(message, {
            cause,
        });
        this.name = InvalidMethodCallDiError.name;
        this.info = settings;
    }

    private static createMessage(
        settings: InvalidMethodCallDiErrorData,
    ): string {
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

    /**
     * Creates a new {@link InvalidMethodCallDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: InvalidMethodCallDiErrorData,
    ): InvalidMethodCallDiError {
        const message = InvalidMethodCallDiError.createMessage(data);
        return new InvalidMethodCallDiError(message, data);
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type CanNotResolveServiceFlag =
    (typeof CanNotResolveServiceDiError.FLAG)[keyof typeof CanNotResolveServiceDiError.FLAG];

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type ServiceCanNotResolveServiceErrorData =
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN;
          token: DiToken;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN;
          token: DiToken;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN;
          token: DiToken;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED;
          transientToken: DiToken;
          scopedTokens: Array<DiToken>;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL;
          token: DiToken;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKENS;
          dynamicTokens: Array<DiToken>;
      };

/**
 * Thrown when a service cannot be resolved.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export class CanNotResolveServiceDiError
    extends Error
    implements
        IDIError<CanNotResolveServiceFlag, ServiceCanNotResolveServiceErrorData>
{
    /**
     * The reasons why a service cannot be resolved.
     *
     * - {@link CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN}: The token is not registered.
     * - {@link CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN}: A scoped service is resolved outside a run scope.
     * - {@link CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN}: A dynamic service is resolved outside a run scope without a set value.
     * - {@link CanNotResolveServiceDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED}: A transient service depends on a scoped service.
     * - {@link CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL}: The resolved value is null.
     * - {@link CanNotResolveServiceDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKENS}: Registered dynamic tokens have no value set.
     */
    static readonly FLAG = {
        NOT_REGISTERED_TOKEN: "NOT_REGISTERED_TOKEN",
        SCOPED_SERVICE_OUTSIDE_RUN: "SCOPED_SERVICE_OUTSIDE_RUN",
        DYNAMIC_SERVICE_OUTSIDE_RUN: "DYNAMIC_SERVICE_OUTSIDE_RUN",
        TRANSIENT_SERVICE_DEPEND_ON_SCOPED:
            "TRANSIENT_SERVICE_DEPEND_ON_SCOPED_SERVICE",
        RESOLVED_VALUE_IS_NULL: "RESOLVED_VALUE_IS_NULL",
        NO_DYNAMIC_VALUE_SET_FOR_TOKENS: "NO_DYNAMIC_VALUE_SET_FOR_TOKENS",
    } as const;

    get flag(): CanNotResolveServiceFlag {
        return this.info.flag;
    }

    readonly info: ServiceCanNotResolveServiceErrorData;

    /**
     * Note: Do not instantiate {@link CanNotResolveServiceDiError} directly via the constructor. Use the static {@link CanNotResolveServiceDiError.create} factory method instead.
     * The constructor remains only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        message: string,
        data: ServiceCanNotResolveServiceErrorData,
        cause?: unknown,
    ) {
        super(message, {
            cause,
        });
        this.name = CanNotResolveServiceDiError.name;
        this.info = data;
    }

    private static createMessage(
        settings: ServiceCanNotResolveServiceErrorData,
    ): string {
        switch (settings.flag) {
            case CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The token is not registered.`;
            case CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The service is scoped and can only be resolved inside a run scope.`;
            case CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The service is dynamic and no value has been set for it within the current run scope.`;
            case CanNotResolveServiceDiError.FLAG
                .TRANSIENT_SERVICE_DEPEND_ON_SCOPED: {
                const scopedTokensString = settings.scopedTokens
                    .map((token) => tokenToString(token))
                    .join(", ");
                return `Failed to resolve service for token: "${tokenToString(settings.transientToken)}". The service is transient and depends on a scoped service ("${scopedTokensString}"), so it can only be resolved inside a run scope.`;
            }
            case CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL:
                return `Failed to resolve service for token: "${tokenToString(settings.token)}". The resolved value is null.`;
            case CanNotResolveServiceDiError.FLAG
                .NO_DYNAMIC_VALUE_SET_FOR_TOKENS: {
                const dynamicTokensString = settings.dynamicTokens
                    .map((token) => tokenToString(token))
                    .join(", ");
                return `Failed to resolve service for token: "${dynamicTokensString}". The token is registered but no dynamic value has been set for it.`;
            }
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
    }

    /**
     * Creates a new {@link CanNotResolveServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: ServiceCanNotResolveServiceErrorData,
    ): CanNotResolveServiceDiError {
        const message = this.createMessage(data);
        return new CanNotResolveServiceDiError(message, data);
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type CanNotRegisterServiceFlag =
    (typeof CanNotRegisterServiceDiError.FLAG)[keyof typeof CanNotRegisterServiceDiError.FLAG];

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type CanNotRegisterServiceDiErrorData = {
    flag: typeof CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED;
    token: DiToken;
};

/**
 * Thrown when a service cannot be registered.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export class CanNotRegisterServiceDiError
    extends Error
    implements
        IDIError<CanNotRegisterServiceFlag, CanNotRegisterServiceDiErrorData>
{
    /**
     * The reasons why a service cannot be registered.
     *
     * - {@link CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED}: A registration with this token already exists.
     */
    static readonly FLAG = {
        ALREADY_REGISTERED: "ALREADY_REGISTERED",
    } as const;

    /**
     * The reason why the service cannot be registered.
     */
    get flag(): CanNotRegisterServiceFlag {
        return this.info.flag;
    }

    readonly info: CanNotRegisterServiceDiErrorData;

    /**
     * Note: Do not instantiate {@link CanNotRegisterServiceDiError} directly via the constructor. Use the static {@link CanNotRegisterServiceDiError.create} factory method instead.
     * The constructor remains  only to maintain compatibility with error types and prevent type errors.
     * @internal
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

    /**
     * Creates a new {@link CanNotRegisterServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: CanNotRegisterServiceDiErrorData,
    ): CanNotRegisterServiceDiError {
        const message = CanNotRegisterServiceDiError.createMessage(data);
        return new CanNotRegisterServiceDiError(message, data);
    }
}
/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type CanNotOverrideServiceFlag =
    (typeof CanNotOverrideServiceDiError.FLAG)[keyof typeof CanNotOverrideServiceDiError.FLAG];

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
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
 * Thrown when a service cannot be overridden.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export class CanNotOverrideServiceDiError
    extends Error
    implements
        IDIError<CanNotOverrideServiceFlag, CanNotOverrideServiceDiErrorData>
{
    /**
     * The reasons why a service cannot be overridden.
     *
     * - {@link CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN}: The token is registered as dynamic and cannot be overridden.
     * - {@link CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED}: The token is not registered.
     * - {@link CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN}: The service has already been overridden.
     */
    static readonly FLAG = {
        DYNAMIC_TOKEN: "TOKEN_REGISTERED_AS_DYNAMIC",
        TOKEN_NOT_REGISTERED: "NOT_REGISTERED",
        ALREADY_OVERRIDDEN: "ALREADY_OVERRIDDEN",
    } as const;

    /**
     * The reason why the service cannot be overridden.
     */
    get flag(): CanNotOverrideServiceFlag {
        return this.info.flag;
    }

    readonly info: CanNotOverrideServiceDiErrorData;

    /**
     * Note: Do not instantiate {@link CanNotOverrideServiceDiError} directly via the constructor. Use the static {@link CanNotOverrideServiceDiError.create} factory method instead.
     * The constructor remains only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
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

    /**
     * Creates a new {@link CanNotOverrideServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: CanNotOverrideServiceDiErrorData,
    ): CanNotOverrideServiceDiError {
        const message = CanNotOverrideServiceDiError.createMessage(data);
        return new CanNotOverrideServiceDiError(message, data);
    }
}
