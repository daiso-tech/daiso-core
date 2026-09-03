/**
 * @module DI
 */

import { isClass, UnexpectedError } from "@/utilities/_module.js";

import type { DiToken } from "@/di/contracts/container.contract.js";
import type { InternalLifetime } from "@/di/implementations/eager/_shared.js";

/**
 * @internal
 */
const UNMANAGED_FLAG_ERROR_MESSAGE = "Unmanaged flag";

/**
 * @internal
 */
const SEE_INFO_FIELD_DETAILS = " See the `info` field for details.";

/**
 * @internal
 */
function tokenToString(diToken: DiToken): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.id;
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
export type InvalidMethodCallDiErrorCreateData =
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
          token: string;
      };

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
    edgeType: [InternalLifetime, InternalLifetime];
};

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Errors
 */
export type InvalidGraphData =
    | {
          flag: typeof InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP;
          edges: Array<{
              edge: [string, string];
              type: [InternalLifetime, InternalLifetime];
          }>;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY;
          cycles: Array<{ cycle: Array<string> }>;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES;
          dependencies: Array<{
              dependency: string;
              referencedBy: Array<string>;
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
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY;
          cycles: Array<Array<DiToken>>;
      }
    | {
          flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES;
          undeclaredDependencies: Array<UndeclaredDependencyInfo>;
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
        const { edgeErrorInfos } = settings;

        const edgeErrors = edgeErrorInfos.map(
            (
                item,
            ): {
                edge: [string, string];
                type: [InternalLifetime, InternalLifetime];
            } => ({
                edge: [
                    tokenToString(item.edge[0]),
                    tokenToString(item.edge[1]),
                ],
                type: [item.edgeType[0], item.edgeType[1]],
            }),
        );

        const message =
            "One or more invalid edge relationship found." +
            SEE_INFO_FIELD_DETAILS +
            "\nThe following edge relationships are invalid:" +
            "\n - singleton → transient" +
            "\n - singleton → scoped" +
            "\n - singleton → dynamic" +
            "\n - scoped → transient" +
            "\n - transient → dynamic" +
            "\n - dynamic → singleton" +
            "\n - dynamic → transient" +
            "\n - dynamic → scoped" +
            "\n - dynamic → dynamic";

        return new InvalidGraphDiError(message, {
            flag: settings.flag,
            edges: edgeErrors,
        });
    }

    private static createCycleDependencyError(
        settings: Extract<
            InvalidGraphCreateData,
            { flag: typeof InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY }
        >,
    ): InvalidGraphDiError {
        const { cycles } = settings;
        const cyclesData = cycles.map((cycle) => {
            const firstToken = cycle.at(0);
            if (firstToken === undefined) {
                throw new UnexpectedError("First token is undefined");
            }
            return {
                cycle: [...cycle, firstToken].map((node) =>
                    tokenToString(node),
                ),
            };
        });

        return new InvalidGraphDiError(
            "One or more cycle found." + SEE_INFO_FIELD_DETAILS,
            {
                flag: settings.flag,
                cycles: cyclesData,
            },
        );
    }

    private static createUndeclaredDependenciesError(
        settings: Extract<
            InvalidGraphCreateData,
            { flag: typeof InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES }
        >,
    ): InvalidGraphDiError {
        const { undeclaredDependencies } = settings;

        const undeclaredDependencyStrings = undeclaredDependencies.map(
            (undeclaredDependency) => ({
                dependency: tokenToString(
                    undeclaredDependency.missingDependency,
                ),
                referencedBy: undeclaredDependency.dependents.map((item) =>
                    tokenToString(item),
                ),
            }),
        );

        return new InvalidGraphDiError(
            "One or more undeclared dependency found." + SEE_INFO_FIELD_DETAILS,
            {
                flag: settings.flag,
                dependencies: undeclaredDependencyStrings,
            },
        );
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

    /**
     * Creates a new {@link InvalidMethodCallDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: InvalidMethodCallDiErrorCreateData,
    ): InvalidMethodCallDiError {
        const messageStart = "Illegal method call";
        const info: InvalidMethodCallDiErrorData =
            data.flag === InvalidMethodCallDiError.FLAG.OUTSIDE_RUN
                ? {
                      flag: data.flag,
                      methodName: data.methodName,
                      token: tokenToString(data.token),
                  }
                : {
                      flag: data.flag,
                      methodName: data.methodName,
                  };
        switch (data.flag) {
            case InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED:
                return new InvalidMethodCallDiError(
                    `${messageStart}: the container is already initialized.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case InvalidMethodCallDiError.FLAG.INSIDE_RUN:
                return new InvalidMethodCallDiError(
                    `${messageStart}: the method cannot be called inside a run scope.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION:
                return new InvalidMethodCallDiError(
                    `${messageStart}: the method cannot be called inside the dynamicRegistration callback.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case InvalidMethodCallDiError.FLAG.OUTSIDE_RUN:
                return new InvalidMethodCallDiError(
                    `${messageStart}: setting a dynamic value is only allowed inside a run scope.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case InvalidMethodCallDiError.FLAG.NOT_ACTIVE:
                return new InvalidMethodCallDiError(
                    `${messageStart}: the container is not active.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
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
export type CanNotResolveServiceDiErrorCreateData =
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
          flag: typeof CanNotResolveServiceDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN;
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
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN;
          token: DiToken;
      };

/**
 * @internal
 */
export type CanNotResolveServiceDiErrorData =
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN;
          requestedToken: string;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN;
          requestedToken: string;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN;
          requestedToken: string;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN;
          requestedToken: string;
          scopedTokens: Array<string>;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL;
          token: string;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKENS;
          requestedToken: Array<string>;
      }
    | {
          flag: typeof CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN;
          token: string;
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
        IDIError<CanNotResolveServiceFlag, CanNotResolveServiceDiErrorData>
{
    /**
     * The reasons why a service cannot be resolved.
     *
     * - {@link CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN}: The token is not registered.
     * - {@link CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN}: A scoped service is resolved outside a run scope.
     * - {@link CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN}: A dynamic service is resolved outside a run scope without a set value.
     * - {@link CanNotResolveServiceDiError.FLAG.TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN}: A transient service depends on a scoped service.
     * - {@link CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL}: The resolved value is null.
     * - {@link CanNotResolveServiceDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKENS}: Registered dynamic tokens have no value set.
     * - {@link CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN}: The token is not a dynamic token.
     */
    static readonly FLAG = {
        NOT_REGISTERED_TOKEN: "NOT_REGISTERED_TOKEN",
        SCOPED_SERVICE_OUTSIDE_RUN: "SCOPED_SERVICE_OUTSIDE_RUN",
        DYNAMIC_SERVICE_OUTSIDE_RUN: "DYNAMIC_SERVICE_OUTSIDE_RUN",
        TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN:
            "TRANSIENT_SERVICE_DEPEND_ON_SCOPED_SERVICE_WHO_CALLED_OUTSIDE_RUN",
        RESOLVED_VALUE_IS_NULL: "RESOLVED_VALUE_IS_NULL",
        NO_DYNAMIC_VALUE_SET_FOR_TOKENS: "NO_DYNAMIC_VALUE_SET_FOR_TOKENS",
        DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN:
            "DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN",
    } as const;

    get flag(): CanNotResolveServiceFlag {
        return this.info.flag;
    }

    readonly info: CanNotResolveServiceDiErrorData;

    /**
     * Note: Do not instantiate {@link CanNotResolveServiceDiError} directly via the constructor. Use the static {@link CanNotResolveServiceDiError.create} factory method instead.
     * The constructor remains only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        message: string,
        data: CanNotResolveServiceDiErrorData,
        cause?: unknown,
    ) {
        super(message, {
            cause,
        });
        this.name = CanNotResolveServiceDiError.name;
        this.info = data;
    }

    /**
     * Creates a new {@link CanNotResolveServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: CanNotResolveServiceDiErrorCreateData,
    ): CanNotResolveServiceDiError {
        const messageStart = "Failed to resolve service";
        switch (data.flag) {
            case CanNotResolveServiceDiError.FLAG.NOT_REGISTERED_TOKEN:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the token is not registered.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        requestedToken: tokenToString(data.token),
                    },
                );
            case CanNotResolveServiceDiError.FLAG.SCOPED_SERVICE_OUTSIDE_RUN:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the service is scoped and can only be resolved inside a run scope.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        requestedToken: tokenToString(data.token),
                    },
                );
            case CanNotResolveServiceDiError.FLAG.DYNAMIC_SERVICE_OUTSIDE_RUN:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the service is dynamic and requires a value to be set inside a run scope.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        requestedToken: tokenToString(data.token),
                    },
                );
            case CanNotResolveServiceDiError.FLAG
                .TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the service is transient and depends on a scoped service, so it can only be resolved inside a run scope.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        requestedToken: tokenToString(data.transientToken),
                        scopedTokens: data.scopedTokens.map((token) =>
                            tokenToString(token),
                        ),
                    },
                );
            case CanNotResolveServiceDiError.FLAG.RESOLVED_VALUE_IS_NULL:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the resolved value is null.${SEE_INFO_FIELD_DETAILS}`,
                    { flag: data.flag, token: tokenToString(data.token) },
                );
            case CanNotResolveServiceDiError.FLAG
                .NO_DYNAMIC_VALUE_SET_FOR_TOKENS:
                return new CanNotResolveServiceDiError(
                    `Failed to resolve service: no dynamic value has been set for the registered token.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        requestedToken: data.dynamicTokens.map((token) =>
                            tokenToString(token),
                        ),
                    },
                );
            case CanNotResolveServiceDiError.FLAG
                .DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN:
                return new CanNotResolveServiceDiError(
                    `${messageStart}: the provided token to dynamic service provider is not a dynamic token.${SEE_INFO_FIELD_DETAILS}`,
                    {
                        flag: data.flag,
                        token: tokenToString(data.token),
                    },
                );
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
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
export type CanNotRegisterServiceDiErrorCreateData =
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED;
          token: DiToken;
      }
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC;
          token: DiToken;
      }
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST;
          token: DiToken;
      };

/**
 * @internal
 */
export type CanNotRegisterServiceDiErrorData =
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED;
          tokenArg: string;
      }
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC;
          tokenArg: string;
      }
    | {
          flag: typeof CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST;
          tokenArg: string;
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
     * - {@link CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC}: The provided token to dynamic service provider is not a dynamic token, so a dynamic value cannot be registered for it.
     * - {@link CanNotRegisterServiceDiError.FLAG.DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST}: The provided  dynamic token to dynamic service provider  does not exist.
     */
    static readonly FLAG = {
        ALREADY_REGISTERED: "ALREADY_REGISTERED",
        DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC:
            "DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC",
        DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST:
            "DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST",
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
     * The constructor remains only to maintain compatibility with error types and prevent type errors.
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

    /**
     * Creates a new {@link CanNotRegisterServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: CanNotRegisterServiceDiErrorCreateData,
    ): CanNotRegisterServiceDiError {
        const messageStart = "Failed to register service";
        const info: CanNotRegisterServiceDiErrorData = {
            flag: data.flag,
            tokenArg: tokenToString(data.token),
        };
        switch (data.flag) {
            case CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED:
                return new CanNotRegisterServiceDiError(
                    `${messageStart}: Token already registered and cannot be replaced.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case CanNotRegisterServiceDiError.FLAG
                .DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC:
                return new CanNotRegisterServiceDiError(
                    `${messageStart}: Token provided to dynamic service provider  does not have a dynamic lifetime, so a dynamic value cannot be registered for it.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case CanNotRegisterServiceDiError.FLAG
                .DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST:
                return new CanNotRegisterServiceDiError(
                    `${messageStart}: Token provided to dynamic service provider do not exist so a dynamic value cannot be registered for it.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );

            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
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
export type CanNotOverrideServiceDiErrorCreateData =
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
 * @internal
 */
export type CanNotOverrideServiceDiErrorData =
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN;
          tokenArg: string;
      }
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED;
          tokenArg: string;
      }
    | {
          flag: typeof CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN;
          tokenArg: string;
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

    /**
     * Creates a new {@link CanNotOverrideServiceDiError} instance.
     *
     * @param data - The error data.
     * @returns A new error instance.
     */
    static create(
        data: CanNotOverrideServiceDiErrorCreateData,
    ): CanNotOverrideServiceDiError {
        const messageStart = "Failed to override service";
        const info: CanNotOverrideServiceDiErrorData = {
            flag: data.flag,
            tokenArg: tokenToString(data.token),
        };
        switch (data.flag) {
            case CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN:
                return new CanNotOverrideServiceDiError(
                    `${messageStart}: the token is registered as dynamic and cannot be overridden.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED:
                return new CanNotOverrideServiceDiError(
                    `${messageStart}: the token is not registered.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            case CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN:
                return new CanNotOverrideServiceDiError(
                    `${messageStart}: the service has already been overridden.${SEE_INFO_FIELD_DETAILS}`,
                    info,
                );
            default:
                throw new UnexpectedError(UNMANAGED_FLAG_ERROR_MESSAGE);
        }
    }
}
