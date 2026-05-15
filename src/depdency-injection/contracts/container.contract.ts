/**
 * @module DepdencyInjection
 */

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
export type IContainerResolver = {
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
    onInit(container: IContainerResolver): Promisable<void>;
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
    onDeInit(container: IContainerResolver): Promisable<void>;
};

/**
 * Contract for registering and exporting modules in the DI container.
 * Extends the base registration contract with module import/export capabilities.
 *
 * @group Contracts
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type IContainerModuleRegister = IContainerRegisterBase & {
    /**
     * Imports a DI module and registers its providers.
     * @param module The module class to import.
     * @param args The arguments to pass to the module constructor.
     */
    import<TParameters extends Array<unknown>>(
        module: Class<TParameters, IContainerModule>,
        args: TParameters,
    ): Promise<void>;

    /**
     * Exports tokens from the module for external consumption.
     * @param tokens The DI tokens to export.
     */
    exports(tokens: DiToken): Promise<void>;
};

/**
 * Base contract for a DI module provider.
 * Modules must implement this to register their providers.
 *
 * @group Contracts
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type IContainerModuleBase = {
    /**
     * Registers providers with the given module register.
     * @param register The module register to use for registration.
     */
    provider(register: IContainerModuleRegister): Promise<void>;
};

/**
 * Contract for a DI module, supporting optional lifecycle hooks.
 *
 * @group Contracts
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type IContainerModule = Partial<IOnServiceDeInit> &
    Partial<IOnServiceInit> &
    IContainerModuleBase;

/**
 * Factory function type for resolving a dependency using the container resolver.
 *
 * @template TType The type produced by the factory.
 * @group Contracts
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type FactoryResolver<TType = unknown> = Invokable<
    [resolver: IContainerResolver],
    Promisable<TType>
>;

/**
 * Contract for registering services and providers in the DI container.
 * Provides methods to register providers, factories, classes, functions, constants, and aliases.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IContainerRegisterBase = {
    /**
     * Registers a factory function for a token.
     * @param token The generic token to register.
     * @param factory The factory function to produce the instance.
     * @param tags Optional tags for grouping or resolving by tag.
     * @returns An object to configure the registration lifetime.
     */
    registerFactory<TType>(
        token: DiToken<TType>,
        factory: FactoryResolver<TType>,
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
    registerClass<TType>(
        class_: Class<[], TType>,
        deps: [],
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
        aliasToken: GenericToken<TType>,
    ): Promise<void>;
};

export type IContainerRegister = IContainerRegisterBase & {
    registerModule<TParameters extends Array<unknown>>(
        module: Class<TParameters, IContainerModule>,
        args: TParameters,
    ): Promise<void>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IContainerScope = {
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
 * The root contract for a DI container, including initialization and de-initialization.
 *
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export type IContainer = IInitizable &
    IDeinitizable &
    IContainerResolver &
    IContainerRegister &
    IContainerScope;
