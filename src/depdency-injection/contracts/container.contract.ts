/**
 * @module DepdencyInjection
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type InvalidDepdencyError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ServiceResolutionError,
} from "@/depdency-injection/contracts/container.errors.js";
import { type Enhance, type Use } from "@/middleware/contracts/_module.js";
import {
    type AnyObjectWithMethods,
    type AnyFunction,
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
    type OneOrArray,
    type OneOrMore,
    type Promisable,
    type Invokable,
    type AnyClass,
    type Class,
} from "@/utilities/_module.js";

/**
 * @group Contracts
 */
export type ClassToken<TInstance = unknown> = {
    new (...parameters: Array<unknown>): TInstance;
};

/**
 * @group Contracts
 */
export type FuncToken<TReturn> = InvokableFn<Array<unknown>, TReturn>;

/**
 * @group Contracts
 */
export type GenericToken<TType = unknown> = {
    /**
     * Unique identifier for this token, used internally as the storage key
     */
    id: string;

    /**
     * Phantom type that is only used for type inference.
     * This property is never actually set at runtime and exists only to help
     */
    __type: TType | null;
};

/**
 * @group Contracts
 */
export type DiToken<TType = unknown> =
    | ClassToken<TType>
    | GenericToken<TType>
    | FuncToken<TType>;

/**
 * @group Contracts
 */
export type IServiceContainerResolver = {
    resolve<TType>(token: DiToken<TType>): Promise<TType | null>;

    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: TType,
    ): Promise<TType>;

    /**
     * @throws {ServiceResolutionError}
     */
    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType>;

    resolveTag<TType>(token: DiToken<TType>): Promise<Array<TType>>;
};

/**
 * @group Contracts
 */
export type BindFactorySettings<TType = unknown> = {
    token: DiToken<TType>;
    factory: () => Promisable<TType>;
    tags?: OneOrArray<GenericToken<TType>>;
};

/**
 * @group Contracts
 */
export type BindConstantSettings<TType = unknown> = {
    token: DiToken<TType>;
    value: TType;
    tags?: OneOrArray<GenericToken<TType>>;
};

/**
 * @group Contracts
 */
export type ClassDependencies<TClass extends AnyClass = AnyClass> = {
    [K in Extract<keyof ConstructorParameters<TClass>, `${number}`>]: DiToken<
        ConstructorParameters<TClass>[K]
    >;
} & {
    length: ConstructorParameters<TClass>["length"];
};

/**
 * @group Contracts
 */
export type ClassBindingSettings<TClass extends AnyClass = AnyClass> = {
    class_: TClass;
    deps: ClassDependencies<TClass>;
    tags?: OneOrArray<GenericToken<[]>>;
};

/**
 * @group Contracts
 */
export type FuncDependencies<TFunc extends AnyFunction = AnyFunction> = {
    [K in Extract<keyof Parameters<TFunc>, `${number}`>]: DiToken<
        Parameters<TFunc>[K]
    >;
} & {
    length: Parameters<TFunc>["length"];
};

/**
 * @group Contracts
 */
export type FuncBindingSettings<TFunc extends AnyFunction = AnyFunction> = {
    func: TFunc;
    deps: FuncDependencies<TFunc>;
    tags?: OneOrArray<GenericToken<[]>>;
};

/**
 * @group Contracts
 */
export type AliasSettings<TType = unknown> = {
    originalToken: DiToken<TType>;
    aliasToken: DiToken<TType>;
    tags?: OneOrArray<GenericToken<TType>>;
};

/**
 * @group Contracts
 */
export type ContextualBindFactorySettings<TType = unknown> = {
    factory: () => Promisable<TType>;
    tags?: OneOrArray<GenericToken<TType>>;
};

/**
 * @group Contracts
 */
export type ContextualBindConstantSettings<TType> = {
    value: TType;
    tags?: OneOrArray<GenericToken<TType>>;
};

/**
 * @group Contracts
 */
export type IContextualBindingRegister<TType = unknown> = {
    /**
     * @throws {InvalidDepdencyError}
     */
    bindConstant(
        settings: ContextualBindConstantSettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFactorySingleton(
        settings: ContextualBindFactorySettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindClassSingleton<TClass extends Class<Array<any>, TType>>(
        settings: ClassBindingSettings<TClass>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFuncSingleton<TFunc extends InvokableFn<Array<any>, TType>>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFactoryTransient(
        settings: ContextualBindFactorySettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindClassTransient<TClass extends Class<Array<any>, TType>>(
        settings: ClassBindingSettings<TClass>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFuncTransient<TFunc extends InvokableFn<Array<any>, TType>>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;
};

/**
 * @group Contracts
 */
export type IContextualBindingBuilder = {
    needs<TType>(token: DiToken<TType>): IContextualBindingRegister<TType>;
};

/**
 * @group Contracts
 */
export type InferMethodNames<TType> = {
    [K in keyof TType]: TType[K] extends AnyFunction ? K : never;
}[keyof TType];

/**
 * @group Contracts
 */
export type MethodsDecoratorSettings<TType = unknown> = {
    container: IServiceContainerResolver;
    enhance: Enhance;
    instance: TType;
    methods: Array<InferMethodNames<TType>>;
};

/**
 * @group Contracts
 */
export type MethodsDecorator<TType = unknown> = InvokableFn<
    [settings: MethodsDecoratorSettings<TType>],
    Promisable<void>
>;

/**
 * @group Contracts
 */
export type FunctionDecoratorSettings<TType = unknown> = {
    container: IServiceContainerResolver;
    use: Use;
    function: TType;
};

/**
 * @group Contracts
 */
export type FunctionDecorator<TType = unknown> = InvokableFn<
    [settings: FunctionDecoratorSettings<TType>],
    Promisable<void>
>;

/**
 * @group Contracts
 */
export type InferDecorator<TType> = TType extends AnyObjectWithMethods
    ? MethodsDecorator<TType>
    : TType extends AnyFunction
      ? FunctionDecorator<TType>
      : never;

/**
 * @group Contracts
 */
export type IServiceContainerRegister = {
    /**
     * @throws {InvalidDepdencyError}
     */
    bindProvier(provider: IServiceProvider): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindConstant<TType>(settings: BindConstantSettings<TType>): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFactorySingleton<TType>(
        settings: BindFactorySettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindClassSingleton<TClass extends AnyClass>(
        settings?: ClassBindingSettings<TClass>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindFuncSingleton<TFunc extends AnyFunction>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;

    bindFactoryTransient<TType>(
        settings: BindFactorySettings<TType>,
    ): Promise<void>;

    bindClassTransient<TClass extends AnyClass>(
        settings?: ClassBindingSettings<TClass>,
    ): Promise<void>;

    bindFuncTransient<TFunc extends AnyFunction>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;

    alias<TType>(settings: AliasSettings<TType>): Promise<void>;

    when<TType>(token: DiToken<TType>): IContextualBindingBuilder;

    decorate<TType>(
        token: DiToken<TType>,
        decorators: OneOrMore<InferDecorator<TType>>,
    ): void;
};

/**
 * @group Contracts
 */
export type IServiceContainer = IServiceContainerRegister &
    IServiceContainerResolver;

/**
 * @group Contracts
 */
export type IOnServiceInit = {
    onInit(container: IServiceContainerResolver): Promisable<void>;
};

/**
 * @group Contracts
 */
export type IOnServiceDeInit = {
    onDeInit(container: IServiceContainerResolver): Promisable<void>;
};

/**
 * @group Contracts
 */
export type IServiceProvider = Partial<IOnServiceInit> &
    Partial<IOnServiceDeInit> & {
        register(container: IServiceContainer): Promisable<void>;
    };

/**
 * @group Contracts
 */
export type IScopedContextualBindingRegister<TType = unknown> = {
    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedConstant(
        settings: ContextualBindConstantSettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedFactory(
        settings: ContextualBindFactorySettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedClass<TClass extends Class<Array<any>, TType>>(
        settings: ClassBindingSettings<TClass>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedFunc<TFunc extends InvokableFn<Array<any>, TType>>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;
};

/**
 * @group Contracts
 */
export type IScopedContextualBindingBuilder = {
    needs<TType>(token: DiToken<TType>): IContextualBindingRegister<TType>;
};

/**
 * @group Contracts
 */
export type IScopedRegister = {
    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedConstant<TType>(
        settings: BindConstantSettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedFactory<TType>(
        settings: BindFactorySettings<TType>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedClass<TClass extends AnyClass>(
        settings: ClassBindingSettings<TClass>,
    ): Promise<void>;

    /**
     * @throws {InvalidDepdencyError}
     */
    bindScopedFunc<TFunc extends AnyFunction>(
        settings?: FuncBindingSettings<TFunc>,
    ): Promise<void>;

    alias<TType>(settings: AliasSettings<TType>): Promise<void>;

    when<TType>(token: DiToken<TType>): IScopedContextualBindingBuilder;

    decorate<TType>(
        token: DiToken<TType>,
        decorators: OneOrMore<InferDecorator<TType>>,
    ): void;
};

/**
 * @group Contracts
 */
export type IRunScoped = {
    runScoped<TReturn>(
        register: Invokable<[register: IScopedRegister], Promisable<void>>,
        invokable: Invokable<[resolver: IServiceContainerResolver], TReturn>,
    ): Promise<TReturn>;
};

/**
 * @group Contracts
 */
export type IContainer = IInitizable &
    IDeinitizable &
    IServiceContainer &
    IRunScoped;
