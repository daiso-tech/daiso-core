/**
 * @module DepdencyInjection
 */

import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
import {
    type OneOrMore,
    type Promisable,
    type Class,
    type IInitizable,
    type IDeinitizable,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * Represents a class token for dependency injection.
 * Used to uniquely identify a class type in the DI container.
 *
 * @template TInstance The instance type produced by the class.
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type ClassToken<TInstance = unknown> = Class<Array<any>, TInstance>;

/**
 * Represents a generic token for dependency injection.
 * Used for non-class, non-function types (e.g., interfaces, types).
 *
 * @template TType The type associated with this token.
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type GenericToken<TType = unknown> = {
    /**
     * Unique identifier for this token, used internally as the storage key.
     */
    id: string;

    /**
     * Phantom type that is only used for type inference.
     * This property is never actually set at runtime and exists only to help TypeScript infer types.
     */
    __type: TType | null;
};

/**
 * Union type for all supported dependency injection tokens.
 * Can be a class, function, or generic token.
 *
 * @template TType The type associated with the token.
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type DiToken<TType = unknown> = ClassToken<TType> | GenericToken<TType>;

/**
 * Contract for resolving dependencies from the DI container.
 * Provides methods to resolve services by token, with or without defaults, and by tag.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IServiceContainerResolver = {
    /**
     * Resolves a service by its token.
     * @param token The DI token to resolve.
     * @returns The instance or null if not found.
     */
    resolve<TType>(token: DiToken<TType>): Promise<TType | null>;

    /**
     * Resolves a service by its token, or returns the provided default value if not found.
     * @param token The DI token to resolve.
     * @param defaultValue The value to return if the service is not found.
     * @returns The resolved service or the default value.
     */
    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType>;

    /**
     * Resolves a service by its token, or throws if not found.
     * @param token The DI token to resolve.
     * @returns The resolved service.
     * @throws {ServiceResolutionError} If the service cannot be resolved.
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;

    /**
     * Resolves all services registered under a given tag.
     * @param token The DI token representing the tag.
     * @returns An array of resolved services.
     */
    resolveTag<TType>(token: DiToken<TType>): Promise<Array<TType>>;
};

/**
 * Contract for configuring the lifetime of a service registration.
 * Allows marking a registration as singleton, transient, or scoped.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IRegistrationLifetime = {
    /**
     * Registers the service as a singleton (one instance for the app lifetime).
     * @throws {InvalidDepdencyError} If the dependency graph is invalid for singleton.
     * @returns A promise that resolves when registration is complete.
     */
    asSingleton(): Promise<void>;

    /**
     * Registers the service as transient (new instance per resolution).
     * @returns A promise that resolves when registration is complete.
     */
    asTransient(): Promise<void>;

    /**
     * Registers the service as scoped (one instance per scope, e.g., request).
     * @throws {InvalidDepdencyError} If the dependency graph is invalid for scoped.
     * @returns A promise that resolves when registration is complete.
     */
    asScoped(): Promise<void>;
};

/**
 * Maps constructor or function parameter positions to DI tokens.
 * Used to specify dependencies for classes/functions in registration.
 *
 * @template TParameters The tuple of parameter types.
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type ParameterTokens<TParameters extends Array<unknown>> = {
    [K in Extract<keyof TParameters, `${number}`>]: DiToken<TParameters[K]>;
} & {
    length: TParameters["length"];
};

/**
 * Contract for registering services and providers in the DI container.
 * Provides methods to register providers, factories, classes, functions, constants, and aliases.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IServiceContainerRegister = {
    /**
     * Registers a context-bound factory for a token. The factory receives the current execution context and produces the instance for the scope.
     *
     * @param token The DI token to register.
     * @param factory The factory function that receives the current {@link IExecutionContext | `IExecutionContext`} and returns the instance.
     * @returns A promise that resolves when registration is complete.
     */
    registerContextFactory<TType>(
        token: DiToken<TType>,
        factory: Invokable<
            [executionContext: IExecutionContext],
            Promisable<TType>
        >,
    ): Promise<void>;

    /**
     * Registers a service provider, which can register multiple services.
     * @param provider The service provider to register.
     * @returns A promise that resolves when registration is complete.
     */
    registerProvider(provider: IServiceProvider): Promise<void>;

    /**
     * Registers a factory function for a token.
     * @param token The generic token to register.
     * @param factory The factory function to produce the instance.
     * @param tags Optional tags for grouping or resolving by tag.
     * @returns An object to configure the registration lifetime.
     */
    registerFactory<TType>(
        token: DiToken<TType>,
        factory: (resolver: IServiceContainerResolver) => Promisable<TType>,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime;

    /**
     * Registers a class for dependency injection.
     * @param class_ The class to register.
     * @param deps The parameter tokens for the constructor.
     * @param tags Optional tags for grouping or resolving by tag.
     * @returns An object to configure the registration lifetime.
     */
    registerClass<TParameters extends Array<unknown>, TType>(
        class_: Class<TParameters, TType>,
        deps: ParameterTokens<TParameters>,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime;

    /**
     * Registers a value for a token.
     * @param token The generic token to register.
     * @param value The value to associate with the token.
     * @param tags Optional tags for grouping or resolving by tag.
     * @returns An object to configure the registration lifetime.
     */
    registerValue<TType>(
        token: DiToken<TType>,
        value: TType,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime;

    /**
     * Creates an alias from one token to another.
     * @param originalToken The original DI token.
     * @param aliasToken The alias DI token.
     * @returns A promise that resolves when registration is complete.
     */
    alias<TType>(
        originalToken: DiToken<TType>,
        aliasToken: DiToken<TType>,
    ): Promise<void>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IScopedContainer = {
    /**
     * Runs an async function within the scope of the container resolver.
     * @param asyncFn The {@link AsyncLazyable | `AsyncLazyable`} to run, receiving the container resolver.
     * @returns The result of the async function.
     */
    run<TValue = void>(
        asyncFn: Invokable<[], Promise<TValue>>,
    ): Promise<TValue>;
};

/**
 * The main contract for a dependency injection container.
 * Combines both resolving and registering capabilities.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IServiceContainer = IServiceContainerResolver &
    IServiceContainerRegister &
    IScopedContainer;

/**
 * Contract for objects that need initialization after being resolved from the container.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IOnServiceInit = {
    /**
     * Called after the service is initialized and resolved from the container.
     * @param container The DI container resolver.
     */
    onInit(container: IServiceContainerResolver): Promisable<void>;
};

/**
 * Contract for objects that need de-initialization before being disposed by the container.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IOnServiceDeInit = {
    /**
     * Called before the service is disposed by the container.
     * @param container The DI container resolver.
     */
    onDeInit(container: IServiceContainerResolver): Promisable<void>;
};

/**
 * Contract for service providers that can register services and handle lifecycle hooks.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IServiceProvider = Partial<IOnServiceInit> &
    Partial<IOnServiceDeInit> & {
        /**
         * Called to register services with the container.
         * @param container The DI container to register services with.
         */
        provide(container: IServiceContainer): Promisable<void>;
    };

/**
 * The root contract for a DI container, including initialization and de-initialization.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IContainer = IInitizable & IDeinitizable & IServiceContainer;
