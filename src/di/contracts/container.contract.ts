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
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type GenericToken<TRegisteredType = unknown> = {
    /**
     * Unique identifier for this token, used internally as the storage key.
     */
    id: symbol;

    /**
     * Phantom type that is only used for type inference.
     * This property is never actually set at runtime and exists only to help TypeScript infer types.
     */
    _type: TRegisteredType | null;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export function genericToken<TValue>(id: string): GenericToken<TValue> {
    return {
        id: Symbol(id),
    } as GenericToken<TValue>;
}

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ClassToken<TInstance = unknown> = Class<Array<any>, TInstance>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DiToken<TRegisteredType = unknown> =
    | ClassToken<TRegisteredType>
    | GenericToken<TRegisteredType>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type FactoryRegisterCallback<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = Invokable<
    [...deps: TDeps, executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DepsTokens<TDeps extends Array<unknown> = Array<unknown>> = {
    [K in keyof TDeps]: DiToken<TDeps[K]>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type FactoryRegistration<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = {
    token: DiToken<TRegisteredType>;
    factory: FactoryRegisterCallback<TDeps, TRegisteredType>;
    deps: DepsTokens<TDeps>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ClassRegistration<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = {
    class_: Class<TDeps, TRegisteredType>;
    deps: DepsTokens<TDeps>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ValueRegistration<TRegisteredType = unknown> = {
    token: DiToken<TRegisteredType>;
    value: TRegisteredType;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceLifetime = {
    singleton(): void;

    scoped(): void;

    transient(): void;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceRegisterBase = {
    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime;

    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime;

    // Registers always as signleton
    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;

    // Registers a dynamic value
    registerDynamic(token: DiToken): void;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DiHook = Invokable<[resolver: IServiceResolver], Promisable<void>>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IContainerHooks = {
    onContainerInit(handler: DiHook): void;

    onContainerDeInit(handler: DiHook): void;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceRegister = IServiceRegisterBase &
    IServiceProviderRegister &
    IContainerHooks;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ServiceProviderFn = InvokableFn<
    [serviceRegister: IServiceRegister],
    Promisable<void>
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceProvider = IInvokableObject<
    [serviceRegister: IServiceRegister],
    void
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type ServiceProvider = ServiceProviderFn | IServiceProvider;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceProviderRegister = {
    registerProvider(provider: ServiceProvider): void;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceResolver = {
    resolve<TType>(token: DiToken<TType>): Promise<TType | null>;

    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType>;

    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicValue<TRegisteredType = unknown> = Invokable<
    [executionContext: IExecutionContext],
    Promisable<TRegisteredType>
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicRegistration<TRegisteredType = unknown> = {
    token: DiToken<TRegisteredType>;
    value: TRegisteredType | DynamicValue<TRegisteredType>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IDynamicServiceRegister = {
    set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): Promise<void>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicServiceProviderFn = InvokableFn<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IDynamicServiceProvider = IInvokableObject<
    [serviceRegister: IDynamicServiceRegister],
    Promisable<void>
>;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type DynamicServiceProvider =
    | DynamicServiceProviderFn
    | IDynamicServiceProvider;

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type RunSettings<TValue = unknown> = {
    registration?: DynamicServiceProvider;
    scope: AsyncLazy<TValue>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IContainerScope = {
    run<TValue = void>(settings: RunSettings<TValue>): Promise<void>;
};

/**
 * @group Contracts
 * IMPORT_PATH: `"@daiso-tech/core/di/contracts"`
 */
export type IServiceOverrider = {
    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
    ): void;

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void;

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void;
};

/**
 * @throws {ServiceNotFoundDiError}
 * @throws {InvalidLifetimeDiError}
 * @throws {CircularDependencyDiError}
 * @throws {ServiceExistsDiError}
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
        fork(): IContainer;
    };
