/**
 * @module DI
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ServiceNotFoundDiError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    InvalidLifetimeDiError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    CircularDependencyDiError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ServiceExistsDiError,
} from "@/di/contracts/container.errors.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type AsyncLazy,
    type Class,
    type IDeinitizable,
    type IInitizable,
    type IInvokableObject,
    type Invokable,
    type InvokableFn,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * A token that identifies a registered type via a unique symbol.
 * Use {@link genericToken} to create an instance.
 *
 * @typeParam TRegisteredType - The type of the registered service.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type GenericToken<TRegisteredType = unknown> = {
    /**
     * Unique identifier for this token, used internally as the storage key.
     */
    readonly id: symbol;

    /**
     * Phantom type that is only used for type inference.
     * This property is never actually set at runtime and exists only to help TypeScript infer types.
     */
    readonly _type: TRegisteredType | null;
};

/**
 * Creates a new generic token identified by the given `id`.
 *
 * @param id - A unique string identifier for the token.
 * @returns A new {@link GenericToken} instance.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export function genericToken<TValue>(id: string): GenericToken<TValue> {
    return {
        id: Symbol(id),
    } as GenericToken<TValue>;
}

/**
 * A class constructor used as a DI token. The class itself serves as the
 * registration key — no separate token object is needed.
 *
 * @typeParam TInstance - The type of the class instance.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ClassToken<TInstance = unknown> = Class<Array<any>, TInstance>;

/**
 * A union of {@link ClassToken} and {@link GenericToken} — the two ways to
 * identify a registered service in the DI container.
 *
 * @typeParam TRegisteredType - The type of the registered service.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DiToken<TRegisteredType = unknown> =
    | ClassToken<TRegisteredType>
    | GenericToken<TRegisteredType>;

/**
 * A callback invoked by the container to create a service instance.
 * Receives resolved dependencies followed by the current
 * {@link IExecutionContext}.
 *
 * @typeParam TDeps - Tuple of dependency types.
 * @typeParam TRegisteredType - The type this factory produces.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ServiceFactory<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = Invokable<
    [...deps: TDeps, executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * Maps a tuple of dependency types to a tuple of {@link DiToken}s.
 * Each position K in the input tuple becomes `DiToken<TDeps[K]>`.
 *
 * @typeParam TDeps - Tuple of dependency types to map.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DepsTokens<TDeps extends Array<unknown> = Array<unknown>> = {
    [K in keyof TDeps]: DiToken<TDeps[K]>;
};

/**
 * Configuration for registering a factory-based service.
 *
 * @typeParam TDeps - Tuple of dependency types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type FactoryRegistration<
    TDeps extends Array<unknown> = Array<unknown>,
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
 * Configuration for registering a class-based service.
 * The container will construct the class, injecting its dependencies.
 *
 * @typeParam TDeps - Tuple of constructor dependency types.
 * @typeParam TRegisteredType - The type of the class instance.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ClassRegistration<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = {
    /** The class constructor to instantiate. */
    impl: Class<TDeps, TRegisteredType>;

    /** The dependency tokens to resolve and inject into the constructor. */
    deps: DepsTokens<TDeps>;
};

/**
 * Configuration for registering a pre-constructed value as a service.
 * Value registrations are always resolved as singletons.
 *
 * @typeParam TRegisteredType - The type of the value.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ValueRegistration<TRegisteredType = unknown> = {
    /** The token used to identify and resolve this service. */
    token: DiToken<TRegisteredType>;

    /** The pre-constructed value to register. */
    value: TRegisteredType;
};

/**
 * Fluent interface for configuring the lifetime of a registered service.
 * Returned by {@link IServiceRegisterBase.registerFactory} and
 * {@link IServiceRegisterBase.registerClass}.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceLifetime = {
    /**
     * A single instance is created and shared across all resolutions.
     */
    singleton(): void;

    /**
     * A single instance is created per {@link IContainerScope.run | scope} execution.
     */
    scoped(): void;

    /**
     * A new instance is created every time the service is resolved.
     */
    transient(): void;
};

/**
 * Configuration for contextual binding — when a specific consumer (`when`)
 * depends on a generic identifier (`needs`), provide a specific
 * implementation (`give`).
 *
 * This enables swapping implementations on a per-consumer basis without
 * changing the consumer's own registration.
 *
 * @typeParam TWhen - The consuming type that needs a contextual dependency.
 * @typeParam TNeeds - The abstract dependency being satisfied.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ContextRegistration<TWhen, TNeeds> = {
    /** The consumer token whose dependency is being contextually overridden. */
    when: DiToken<TWhen>;

    /** The di token representing the dependency to satisfy. */
    needs: DiToken<TNeeds>;

    /** The concrete token to provide in place of `needs` for the given `when`. */
    give: DiToken<TNeeds>;
};

/**
 * Core service registration interface providing factory, class, value,
 * and dynamic registration methods.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceRegisterBase = {
    /**
     * Registers a factory function that creates the service instance.
     *
     * @returns An {@link IServiceLifetime} to configure the service lifetime.
     */
    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime;

    /**
     * Registers a class whose instance will be constructed by the container.
     *
     * @returns An {@link IServiceLifetime} to configure the service lifetime.
     */
    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime;

    /**
     * Registers a pre-constructed value that is always resolved as a singleton.
     */
    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;

    /**
     * Registers a token whose value will be provided dynamically at runtime
     * via {@link IDynamicServiceRegister.set}.
     */
    registerDynamic(token: DiToken): void;

    /**
     * Registers a contextual binding so that when the specified consumer
     * (`when`) requires an abstract dependency (`needs`), a specific
     * implementation (`give`) is provided instead.
     *
     * Useful for targeting overrides to a single consumer without affecting
     * other consumers of the same abstract dependency.
     */
    registerContext<TWhen = unknown, TNeeds = unknown>(
        settings: ContextRegistration<TWhen, TNeeds>,
    ): void;
};

/**
 * A hook callback invoked during container lifecycle events.
 * Receives an {@link IServiceResolver} to resolve services during the hook.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DiHook = Invokable<[resolver: IServiceResolver], Promisable<void>>;

/**
 * Interface for registering lifecycle hooks that run on container
 * initialization and deinitialization.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IContainerHooks = {
    /**
     * Registers a handler to be invoked after the container is initialized (when `container.init` method is called).
     */
    onContainerInit(handler: DiHook): void;

    /**
     * Registers a handler to be invoked before the container is deinitialized (when `container.deInit` method is called).
     */
    onContainerDeInit(handler: DiHook): void;
};

/**
 * The full service registration interface, combining base registration,
 * provider registration, and container lifecycle hooks.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceRegister = IServiceRegisterBase &
    IServiceProviderRegister &
    IContainerHooks;

/**
 * A plain function that acts as a service provider, receiving an
 * {@link IServiceRegister} to register services.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ServiceProviderFn = InvokableFn<
    [serviceRegister: IServiceRegister],
    Promisable<void>
>;

/**
 * An object with an `invoke` method that acts as a service provider,
 * receiving an {@link IServiceRegister} to register services.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceProvider = IInvokableObject<
    [serviceRegister: IServiceRegister],
    void
>;

/**
 * A service provider, either as a plain function ({@link ServiceProviderFn})
 * or an object with an `invoke` method ({@link IServiceProvider}).
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ServiceProvider = ServiceProviderFn | IServiceProvider;

/**
 * Interface for registering a {@link ServiceProvider} that can
 * batch-register multiple services at once.
 *
 * Useful for creating reusable, isolated code blocks — similar to Laravel
 * service providers — that encapsulate a group of related registrations.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceProviderRegister = {
    /**
     * Registers a {@link ServiceProvider} that can register multiple services
     * via the provided {@link IServiceRegister}.
     */
    registerProvider(provider: ServiceProvider): void;
};

/**
 * Interface for resolving registered services by token, with nullable,
 * default-value, and throw-on-missing variants.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceResolver = {
    /**
     * Resolves a service by token, returning `null` if not found.
     */
    resolve<TType>(token: DiToken<TType>): Promise<TType | null>;

    /**
     * Resolves a service by token, returning the `defaultValue` if not found.
     */
    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType>;

    /**
     * Resolves a service by token, throwing {@link ServiceNotFoundDiError} if not found.
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;

    /**
     * Checks whether a token exists.
     */
    has(token: DiToken): Promise<boolean>;
};

/**
 * A callback that provides a dynamic value for a token at runtime,
 * receiving the current {@link IExecutionContext}.
 *
 * @typeParam TRegisteredType - The type of the dynamic value.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicValue<TRegisteredType = unknown> = Invokable<
    [executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * Configuration for setting a dynamic value at runtime via
 * {@link IDynamicServiceRegister.set}.
 *
 * @typeParam TRegisteredType - The type of the value.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicRegistration<TRegisteredType = unknown> = {
    /** The token whose dynamic value is being set. */
    token: DiToken<TRegisteredType>;

    /** A static value or a {@link DynamicValue} callback. */
    value: TRegisteredType | DynamicValue<TRegisteredType>;
};

/**
 * Interface for setting dynamic values at runtime for tokens previously
 * registered via {@link IServiceRegisterBase.registerDynamic}.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IDynamicServiceRegister = {
    /**
     * Sets the value for a token previously registered via
     * {@link IServiceRegisterBase.registerDynamic}.
     */
    set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): Promise<void>;
};

/**
 * A plain function that provides dynamic service registrations,
 * receiving an {@link IDynamicServiceRegister} to set values.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicServiceProviderFn = InvokableFn<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * An object with an `invoke` method that provides dynamic service
 * registrations, receiving an {@link IDynamicServiceRegister}.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IDynamicServiceProvider = IInvokableObject<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * A dynamic service provider, either as a plain function
 * ({@link DynamicServiceProviderFn}) or an object ({@link IDynamicServiceProvider}).
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicServiceProvider =
    | DynamicServiceProviderFn
    | IDynamicServiceProvider;

/**
 * Configuration for a scoped container execution via
 * {@link IContainerScope.run}.
 *
 * @typeParam TValue - The return type of the scope body.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type RunSettings<TValue = unknown> = {
    /**
     * Optional dynamic service provider to register before the scope executes.
     */
    dynamicRegistration?: DynamicServiceProvider;

    /**
     * The lazily-evaluated scope body to execute within the container scope.
     */
    scope: AsyncLazy<TValue>;
};

/**
 * Interface for executing code within a scoped container context.
 * Scoped services are resolved only once per {@link run} invocation.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IContainerScope = {
    /**
     * Runs a callback within a scoped container context.
     * Scoped services are resolved once per `run()` invocation.
     */
    run<TValue = void>(settings: RunSettings<TValue>): Promise<void>;
};

/**
 * Interface for overriding existing service registrations, is meant for
 * testing.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceOverrider = {
    /**
     * Overrides an existing factory registration with a new factory.
     */
    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
    ): void;

    /**
     * Overrides an existing class registration with a new class.
     */
    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void;

    /**
     * Overrides an existing value registration with a new value.
     */
    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;
};

/**
 * The top-level DI container interface. Combines initialization, scope
 * management, registration, resolution, overriding, and forking into a
 * single cohesive API.
 *
 * The following errors can be thrown any method listed in `IContainer` dependent on the algorithm used:
 * @throws {ServiceNotFoundDiError} When a required service cannot be resolved.
 * @throws {InvalidLifetimeDiError} When a lifetime configuration is invalid
 *   (e.g. singleton depending on transient).
 * @throws {CircularDependencyDiError} When a circular dependency is detected
 *   in the service graph.
 * @throws {ServiceExistsDiError} When attempting to register a duplicate token.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IContainer = IInitizable &
    IDeinitizable &
    IContainerScope &
    IServiceRegister &
    IServiceResolver &
    IServiceOverrider & {
        /**
         * Creates a child container that inherits all registrations from this
         * container. The child container can override registrations without
         * affecting the parent.
         */
        fork(): IContainer;
    };
