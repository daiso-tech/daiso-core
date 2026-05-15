/**
 * @module DepdencyInjection
 */

import {
    type DiToken,
    type FactoryResolver,
    type GenericToken,
    type IContainer,
    type IContainerModule,
    type IContainerResolver,
    type IRegistrationLifetime,
    type ParameterTokens,
} from "@/depdency-injection/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type OneOrMore,
    type Class,
    type Invokable,
    type InvokableFn,
    type Promisable,
    resolveOneOrMore,
} from "@/utilities/_module.js";

/**
 * Factory function type for registering context-specific dependencies in the DI container.
 * Used to register services or providers that are bound to a particular execution context.
 *
 * @group Implementations
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type RegisterContextFactory = InvokableFn<
    [context: IExecutionContext, resolver: IContainerResolver],
    Promisable<void>
>;

/**
 * Settings for configuring the DI container instance.
 *
 * @property executionContext The execution context to be used by the container.
 * @property contextRegistrations Optional context-specific registration factories.
 *
 * @group Implementations
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection/contracts"
 */
export type ContainerSettings = {
    /**
     * The execution context to be used by the container.
     */
    executionContext: IExecutionContext;
    /**
     * Optional array or single context registration factory for context-specific dependencies.
     */
    contextRegistrations?: OneOrMore<RegisterContextFactory>;
};

/**
 * The main Dependency Injection (DI) container implementation.
 *
 * Provides registration, resolution, and lifecycle management for services and modules.
 * Supports context-specific registrations and integrates with execution contexts.
 *
 * @group Implementations
 * IMPORT_PATH: "@daiso-tech/core/depdency-injection"
 */
export class Container implements IContainer {
    /**
     * The execution context used by the container.
     */
    private readonly executionContext: IExecutionContext;

    /**
     * List of factories for context-specific registrations.
     */
    private readonly contextRegistrations: Array<RegisterContextFactory>;

    /**
     * Creates a new DI container instance.
     * @param settings The container settings.
     */
    constructor(settings: ContainerSettings) {
        const { executionContext, contextRegistrations = [] } = settings;
        this.executionContext = executionContext;
        this.contextRegistrations = resolveOneOrMore(contextRegistrations);
    }

    /**
     * Initializes the container and its registrations.
     */
    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * De-initializes the container and disposes resources.
     */
    deInit(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * Resolves a service by its DI token.
     */
    resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        throw new Error("Method not implemented.");
    }

    /**
     * Resolves a service by its DI token or returns a default value.
     */
    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    /**
     * Resolves a service by its DI token or throws if not found.
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    /**
     * Resolves all services registered under a given tag.
     */
    resolveTag<TType>(token: DiToken<TType>): Promise<Array<TType>> {
        throw new Error("Method not implemented.");
    }

    /**
     * Registers a factory function for a DI token.
     */
    registerFactory<TType>(
        token: DiToken<TType>,
        factory: FactoryResolver<TType>,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    /**
     * Registers a class for dependency injection.
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
    registerClass(
        class_: unknown,
        deps: unknown,
        tags?: unknown,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    /**
     * Registers a value for a DI token.
     */
    registerValue<TType>(
        token: DiToken<TType>,
        value: TType,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    /**
     * Creates an alias from one DI token to another.
     */
    alias<TType>(
        originalToken: DiToken<TType>,
        aliasToken: GenericToken<TType>,
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * Registers a DI module and its providers.
     */
    registerModule<TParameters extends Array<unknown>>(
        module: Class<TParameters, IContainerModule>,
        args: TParameters,
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * Runs an async function within the scope of the container resolver.
     */
    run<TValue = void>(
        asyncFn: Invokable<[], Promise<TValue>>,
    ): Promise<TValue> {
        throw new Error("Method not implemented.");
    }
}
