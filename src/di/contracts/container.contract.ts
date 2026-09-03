/**
 * @module DI
 */

import type {
    IExecutionContext,
    ContextToken,
} from "@/execution-context/contracts/_module.js";
import type {
    AsyncLazy,
    IDeinitizable,
    IInitizable,
    IInvocableObject,
    Invocable,
    InvocableFn,
    Promisable,
} from "@/utilities/_module.js";

/**
 * Creates a new generic token identified by the given `id`.
 *
 * Each call creates a distinct token, so a token must be created once and
 * exported, then reused for registration and resolution.
 *
 * @param id - A descriptive label for the token.
 * @returns A new {@link DiToken} instance created from the given `id`.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export function genericToken<TRegisteredType>(
    id: string,
): DiToken<TRegisteredType> {
    return {
        id,
    } as ContextToken<TRegisteredType>;
}

/**
 * Token used to identify a registered service in {@link IContainer}.
 *
 * This is a type alias for {@link ContextToken}.
 * @typeParam TRegisteredType - The type of the registered service.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DiToken<TRegisteredType = unknown> = ContextToken<TRegisteredType>;

/**
 * A record that maps dependency argument names to their resolved types.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DepRecord = Partial<Record<string, unknown>>;

/**
 * Empty dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EmptyDepRecord = {};

/**
 * A callback invoked by the container to create a service instance.
 * Receives resolved dependencies followed by the current
 * {@link IExecutionContext}.
 *
 * @typeParam TDeps - Record of dependency names mapped to their types.
 * @typeParam TRegisteredType - The type this factory produces.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ServiceFactory<
    TDeps extends DepRecord = EmptyDepRecord,
    TRegisteredType = unknown,
> = Invocable<
    [deps: TDeps, executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * All possible lifetime options for {@link IServiceRegisterBase.registerFactory}.
 * - SINGLETON: one instance for the container lifetime.
 * - TRANSIENT: new instance per resolution.
 * - SCOPED: one instance per run scope.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export const LIFETIME = {
    SINGLETON: "singleton",
    TRANSIENT: "transient",
    SCOPED: "scoped",
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type Lifetime = (typeof LIFETIME)[keyof typeof LIFETIME];

/**
 * Maps a record of dependency names to a record of {@link DiToken}s.
 *
 * @typeParam TDeps - Record of dependency names mapped to their types.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DepsTokens<TDeps extends DepRecord = EmptyDepRecord> = {
    [K in keyof TDeps]: DiToken<TDeps[K]>;
};

/**
 * Configuration for registering a factory-based service.
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type FactoryRegistration<
    TDeps extends DepRecord = EmptyDepRecord,
    TRegisteredType = unknown,
> = {
    /** The token used to identify and resolve this service. */
    token: DiToken<TRegisteredType>;

    /** The factory function that creates the service instance. */
    factory: ServiceFactory<TDeps, TRegisteredType>;

    /** The dependency tokens to resolve and inject into the factory. */
    deps: DepsTokens<TDeps>;

    /** The lifetime of the service — how its instances are created and shared. */
    lifetime: Lifetime;
};

/**
 * Configuration for overriding a factory-based service.
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type FactoryRegistrationOverride<
    TDeps extends DepRecord = EmptyDepRecord,
    TRegisteredType = unknown,
> = {
    /** The token used to identify and resolve this service. */
    token: DiToken<TRegisteredType>;

    /** The factory function that creates the service instance. */
    factory: ServiceFactory<TDeps, TRegisteredType>;

    /** The dependency tokens to resolve and inject into the factory. */
    deps: DepsTokens<TDeps>;
};

/**
 * Configuration for registering a pre-constructed value as a service.
 * Value registrations are always resolved as singletons.
 *
 * @typeParam TRegisteredType - The type of the value.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ValueRegistration<TRegisteredType = unknown> = {
    /** The token used to identify and resolve this service. */
    token: DiToken<TRegisteredType>;

    /** The pre-constructed value to register. */
    value: TRegisteredType;
};

/**
 * Core service registration interface providing factory, class, value,
 * and dynamic registration methods.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceRegisterBase = {
    /**
     * Registers a factory function that creates the service instance.
     *
     * @param settings - The registration settings.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init} or inside a {@link IContainer.run} scope.
     * @throws {@link CanNotRegisterServiceDiError} When the token already has a registration.
     */
    registerFactory<
        TDeps extends DepRecord = EmptyDepRecord,
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
    ): void;

    /**
     * Registers a pre-constructed value that is always resolved as a singleton.
     *
     * @param settings - The value registration setting.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     * @throws {@link CanNotRegisterServiceDiError} When the token already has a registration.
     */
    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;

    /**
     * Registers a token whose value will be provided dynamically at runtime
     * via {@link IDynamicServiceRegister.set}.
     *
     * @param token - The token to register as dynamic.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     * @throws {@link CanNotRegisterServiceDiError} When the token already has a registration.
     */
    registerDynamic(token: DiToken): void;
};

/**
 * A hook callback invoked during container lifecycle events.
 * Receives an {@link IServiceResolver} to resolve services during the hook.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DiHook = Invocable<[resolver: IServiceResolver], Promisable<void>>;

/**
 * Interface for registering lifecycle hooks that run on container
 * initialization and deinitialization.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IContainerHooks = {
    /**
     * Registers a handler to be invoked after the container is initialized (when {@link IContainer.init} method is called).
     * Can be called multiple times to register multiple hooks. All registered hooks run after {@link IContainer.init} completes.
     *
     * @param handler - The hook to invoke after the container is initialized.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     */
    onContainerInit(handler: DiHook): void;

    /**
     * Registers a handler to be invoked before the container is deinitialized (when {@link IContainer.deInit} method is called).
     * Can be called multiple times to register multiple hooks. All registered hooks run before {@link IContainer.deInit} completes.
     *
     * @param handler - The hook to invoke before the container is deinitialized.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     */
    onContainerDeInit(handler: DiHook): void;
};

/**
 * The full service registration interface, combining base registration,
 * provider registration, and container lifecycle hooks.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceRegister = IServiceRegisterBase &
    IServiceProviderRegister &
    IContainerHooks;

/**
 * A plain function that acts as a service provider, receiving an
 * {@link IServiceRegister} to register services.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ServiceProviderFn = InvocableFn<
    [serviceRegister: IServiceRegister],
    void
>;

/**
 * An object with an {@link IInvocableObject.invoke} method that acts as a service provider,
 * receiving an {@link IServiceRegister} to register services.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceProvider = IInvocableObject<
    [serviceRegister: IServiceRegister],
    void
>;

/**
 * A service provider, either as a plain function ({@link ServiceProviderFn})
 * or an object with an {@link IInvocableObject.invoke} method ({@link IServiceProvider}).
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ServiceProvider = ServiceProviderFn | IServiceProvider;

/**
 * Interface for registering a {@link ServiceProvider} that can
 * batch-register multiple services at once.
 *
 * Useful for creating reusable, isolated code blocks.
 * service providers — that encapsulate a group of related registrations.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceProviderRegister = {
    /**
     * Registers a {@link ServiceProvider} that can register multiple services
     * via the provided {@link IServiceRegister}.
     *
     * @param provider - The service provider to register.
     *
     * @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after {@link IContainer.deInit}).
     */
    registerProvider(provider: ServiceProvider): void;
};

/**
 * Interface for resolving registered services by token, with nullable,
 * default-value, and throw-on-missing variants.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceResolver = {
    /**
     * Resolves a service by token, returning `null` if not found.
     *
     * @param token - The token of the service to resolve.
     *
     * @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after {@link IContainer.deInit}).
     * @returns The resolved service, or `null` if not found.
     */
    resolve<TType>(token: DiToken<TType>): Promise<TType | null>;

    /**
     * Resolves a service by token, returning the `defaultValue` if not found.
     *
     * @param token - The token of the service to resolve.
     * @param defaultValue - The value to return when the service cannot be resolved.
     *
     * @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after {@link IContainer.deInit}).
     * @returns The resolved service, or `defaultValue` if not found.
     */
    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType>;

    /**
     * Resolves a service by token throwing {@link CanNotResolveServiceDiError} if not found.
     *
     * @param token - The token of the service to resolve.
     *
     *  @throws {@link CanNotResolveServiceDiError} If not found.
     *  @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after {@link IContainer.deInit}).
     * @returns The resolved service.
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;

    /**
     * Checks whether a token can be resolved by calling {@link IContainer.resolve}.
     *
     * Note: this does NOT check whether the token is registered. It only
     * returns `true` if the token can be resolved to a value; a registered
     * token that cannot be resolved to a value yet returns `false`.
     *
     * Because it resolves the token, calling {@link IContainer.has} may invoke service
     * factories (for example, transient factories) as a side effect — the
     * service is created as part of the check.
     *
     * @param token - The token whose resolvability to check.
     *
     * @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after {@link IContainer.deInit}).
     * @returns `true` if the token can be resolved, `false` otherwise.
     */
    has(token: DiToken): Promise<boolean>;
};

/**
 * A callback that provides a dynamic value for a token at runtime,
 * receiving the current {@link IExecutionContext}.
 *
 * @typeParam TRegisteredType - The type of the dynamic value.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DynamicValue<TRegisteredType = unknown> = Invocable<
    [executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * Configuration for setting a dynamic value at runtime via
 * {@link IDynamicServiceRegister.set}.
 *
 * @typeParam TRegisteredType - The type of the value.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DynamicRegistration<TRegisteredType = unknown> = {
    /** The token whose dynamic value is being set. */
    token: DiToken<TRegisteredType>;

    /**
     * A static value, or a {@link DynamicValueWrapper} wrapping a callback
     * that computes the value from the execution context.
     */
    value: TRegisteredType;
};

/**
 * Interface for setting dynamic values at runtime for tokens previously
 * registered via {@link IServiceRegisterBase.registerDynamic}.
 *
 * @remarks
 * All methods in this interface operate directly on {@link IExecutionContext}
 * rather than the isolated dependency container registry. Operations here can interfere with data in the execution context and vice versa.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IDynamicServiceRegister = {
    /**
     * Sets the value for a token previously registered via
     * {@link IServiceRegisterBase.registerDynamic}.
     *
     * @param args - The dynamic registration settings.
     * @throws {@link CanNotRegisterServiceDiError} When the token is not registered as a dynamic token with {@link IContainer.registerDynamic}
     *
     * @remarks
     * This method sets the token directly on the execution context. If the token already exists in the execution context, it will be implicitly overwritten.
     * If the token do not exists in the execution context it will be put inside execution context with token as key.
     */
    set<TRegisteredType = unknown>(
        args: DynamicRegistration<TRegisteredType>,
    ): void;

    /**
     * Retrieves the registered value from the execution context for a given dynamic token.
     *
     * @param token - The dynamic token to look up.
     * @returns The registered value for the dynamic token or `null` if token is not registered as dynamic with {@link IContainer.registerDynamic} or do not exist in the execution context.
     *
     */
    get<TRegisteredType>(
        token: DiToken<TRegisteredType>,
    ): Promise<TRegisteredType | null>;

    /**
     * Retrieves the registered value from the execution context for a given dynamic token, throwing an error if it cannot be resolved.
     *
     * @param token - The dynamic token to look up.
     * @returns The registered value for the dynamic token
     * @throws {@link CanNotResolveServiceDiError} When token is not registered as dynamic with {@link IContainer.registerDynamic} or do not exist in the execution context.
     *
     */
    getOrFail<TRegisteredType>(
        token: DiToken<TRegisteredType>,
    ): Promise<TRegisteredType>;

    /**
     * Checks whether a value can be resolved for a given dynamic token.
     *
     * @param token - The dynamic token to check.
     * @returns `true` if the token exists in the execution context and is registered as dynamic in the graph; otherwise, `false`.
     *
     */
    has<TRegisteredType>(token: DiToken<TRegisteredType>): Promise<boolean>;
};

/**
 * A plain function that provides dynamic service registrations,
 * receiving an {@link IDynamicServiceRegister} to set values.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DynamicServiceProviderFn = InvocableFn<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * An object with an {@link IInvocableObject} method that provides dynamic service
 * registrations, receiving an {@link IDynamicServiceRegister}.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IDynamicServiceProvider = IInvocableObject<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * A dynamic service provider, either as a plain function
 * ({@link DynamicServiceProviderFn}) or an object ({@link IDynamicServiceProvider}).
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DynamicServiceProvider =
    DynamicServiceProviderFn | IDynamicServiceProvider;

/**
 * Configuration for a scoped container execution via
 * {@link IContainerScope.run}.
 *
 * @typeParam TValue - The return type of the scope body.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type RunSettings<TValue = unknown> = {
    /**
     * Optional dynamic service provider to register before the scope executes.
     */
    registration?: DynamicServiceProvider;

    /**
     * The lazily-evaluated scope body to execute within the container scope.
     */
    scope: AsyncLazy<TValue>;
};

/**
 * Interface for executing code within a scoped container context.
 * Scoped services are resolved only once per {@link run} invocation.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IContainerScope = {
    /**
     * Runs a callback within a scoped container context.
     * Scoped services are resolved once per {@link IContainer.run} invocation.
     * Resolves to the value returned by the scope callback.
     *
     * @param settings - The run settings.
     *
     * @throws {@link InvalidMethodCallDiError} When called inside  {@link DynamicServiceProvider}.
     * @throws {@link InvalidMethodCallDiError} If the container is inactive (e.g., called before {@link IContainer.init} or after  {@link IContainer.deInit}).
     * @returns The value returned by the scope callback.
     */
    run<TValue = void>(settings: RunSettings<TValue>): Promise<TValue>;
};

/**
 * Interface for overriding existing service registrations, is meant for
 * testing.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceOverrider = {
    /**
     * Overrides an existing factory registration with a new factory.
     *
     * @param settings - The factory override settings.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     * @throws {@link CanNotOverrideServiceDiError} When can not override the service.
     */
    overrideFactory<
        TDeps extends DepRecord = EmptyDepRecord,
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistrationOverride<TDeps, TRegisteredType>,
    ): void;

    /**
     * Overrides an existing value registration with a new value.
     *
     * @param settings - The value override settings.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     * @throws {@link CanNotOverrideServiceDiError} When can not override the service.
     */
    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;
};

/**
 * Interface for creating a child container that inherits all registrations
 * and overrides from the parent container.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IContainerFork = {
    /**
     * Creates a child container that inherits all registrations and overrides from this
     * container.
     *
     * @throws {@link InvalidMethodCallDiError} When called after {@link IContainer.init}.
     * @returns A new child {@link IContainer}.
     */
    fork(): IContainer;
};

/**
 * The top-level DI container interface. Combines initialization, scope
 * management, registration, resolution, overriding, and forking into a
 * single cohesive API.
 *
 * @throws {@link InvalidMethodCallDiError} When {@link IContainer.init} called again after {@link IContainer.init}, {@link IContainer.deInit}  
 * called again after {@link IContainer.deInit}, or {@link IContainer.deInit} called before {@link IContainer.init}.
 
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IContainer = IInitizable &
    IDeinitizable &
    IContainerScope &
    IContainerFork &
    IServiceRegister &
    IServiceResolver &
    IServiceOverrider;
