/**
 * @module DI
 */

import type { IExecutionContext } from "@/execution-context/contracts/_module.js";
import type {
    AsyncLazy,
    Class,
    IDeinitizable,
    IInitizable,
    IInvocableObject,
    Invocable,
    InvocableFn,
    Promisable,
} from "@/utilities/_module.js";

/**
 * All possible lifetime options for {@link IServiceRegisterBase.registerFactory}.
 * - `"singleton"`: one instance for the container lifetime.
 * - `"transient"`: new instance per resolution.
 * - `"scoped"`: one instance per run scope.
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
 * A token that identifies a registered type via a unique symbol.
 * Use {@link genericToken} to create an instance.
 *
 * @typeParam TRegisteredType - The type of the registered service.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ClassToken<TInstance = unknown> = Class<Array<any>, TInstance>;

/**
 * A union of {@link ClassToken} and {@link GenericToken} — the two ways to
 * identify a registered service in the DI container.
 *
 * @typeParam TRegisteredType - The type of the registered service.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DiToken<TRegisteredType = unknown> =
    ClassToken<TRegisteredType> | GenericToken<TRegisteredType>;

/**
 * A record that maps dependency argument names to their resolved types.
 * This is the shape of the dependencies object that is passed to a service
 * factory at resolution time.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DepRecord = Partial<Record<string, unknown>>;

/**
 * The default dependency record used when a service declares no
 * dependencies. It is the default `TDeps` type parameter for types like
 * {@link ServiceFactory} and {@link FactoryRegistration}.
 */

/**
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
 * Maps a record of dependency names to a record of {@link DiToken}s.
 * Each key K in the input record becomes `DiToken<TDeps[K]>`.
 *
 * @typeParam TDeps - Record of dependency names mapped to their types.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
     * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
     * @throws {CanNotRegisterServiceDiError} When the token already has a registration.
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
     * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
     * @throws {CanNotRegisterServiceDiError} When the token already has a registration.
     */
    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;

    /**
     * Registers a token whose value will be provided dynamically at runtime
     * via {@link IDynamicServiceRegister.set}.
     *
     * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
     * @throws {CanNotRegisterServiceDiError} When the token already has a registration.
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
     * Registers a handler to be invoked after the container is initialized (when `container.init` method is called).
     *
     * Can be called multiple times to register multiple init hooks. All registered hooks run after `container.init()` completes.
     */
    onContainerInit(handler: DiHook): void;

    /**
     * Registers a handler to be invoked before the container is deinitialized (when `container.deInit` method is called).
     *
     * Can be called multiple times to register multiple deinit hooks. All registered hooks run before `container.deInit()` completes.
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
 * An object with an `invoke` method that acts as a service provider,
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
 * or an object with an `invoke` method ({@link IServiceProvider}).
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type ServiceProvider = ServiceProviderFn | IServiceProvider;

/**
 * Interface for registering a {@link ServiceProvider} that can
 * batch-register multiple services at once.
 *
 * Useful for creating reusable, isolated code blocks — similar to Laravel
 * service providers — that encapsulate a group of related registrations.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
     * Resolves a service by token, throwing {@link ServiceCanNotBeResolvedDiError} if not found.
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;

    /**
     * TODO find better name?
     * Checks whether a token can be resolved.
     *
     * Note: this does NOT check whether the token is registered. It only
     * returns `true` if the token can be resolved to a value. A
     * registered token with that can not resolved to value yet
     * will return `false`.
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

    /** A static value or a {@link DynamicValue} callback. */
    value: TRegisteredType | DynamicValue<TRegisteredType>;
};

/**
 * Interface for setting dynamic values at runtime for tokens previously
 * registered via {@link IServiceRegisterBase.registerDynamic}.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type DynamicServiceProviderFn = InvocableFn<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * An object with an `invoke` method that provides dynamic service
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
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
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IServiceOverrider = {
    /**
     * Overrides an existing factory registration with a new factory.
     *
     * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
     * @throws {CanNotOverrideServiceDiError} When the token is not registered, is registered as dynamic, or has already been overridden.
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
     * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
     * @throws {CanNotOverrideServiceDiError} When the token is not registered, is registered as dynamic, or has already been overridden.
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
 * @throws {ServiceCanNotBeResolvedDiError} When a required service cannot be resolved.
 * @throws {InvalidGraphDiError} When the service graph is invalid, e.g. an invalid
 *   lifetime configuration (singleton depending on transient), a circular
 *   dependency, or an undeclared dependency.
 * @throws {CanNotRegisterServiceDiError} When attempting to register a duplicate token.
 *
 * IMPORT_PATH: `"eridu-tech/di/contracts"`
 * @group Contracts
 */
export type IContainer = IInitizable &
    IDeinitizable &
    IContainerScope &
    IServiceRegister &
    IServiceResolver &
    IServiceOverrider & {
        /**
         * Creates a child container that inherits all registrations and overrides from this
         * container.
         *
         * @throws {InvalidMethodCallDiError} When called after `container.init()` or inside a `container.run()` scope.
         */
        fork(): IContainer;
    };
