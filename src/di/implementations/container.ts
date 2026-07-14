import {
    type ClassRegistration,
    type DiHook,
    type DiToken,
    type FactoryRegistration,
    type IContainer,
    type IServiceLifetime,
    type RunSettings,
    type ServiceProvider,
    type ValueRegistration,
} from "@/di/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";

/**
 * @group Implementations
 */
export type ContainerSettings = {
    executionContext: IExecutionContext;
};

/**
 * @group Implementations
 */
export class Container implements IContainer {
    constructor(private readonly settings: ContainerSettings) {}

    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    deInit(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): IServiceLifetime {
        throw new Error("Method not implemented.");
    }

    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime {
        throw new Error("Method not implemented.");
    }

    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        throw new Error("Method not implemented.");
    }

    registerDynamic(token: DiToken): void {
        throw new Error("Method not implemented.");
    }

    onContainerInit(handler: DiHook): void {
        throw new Error("Method not implemented.");
    }

    onContainerDeInit(handler: DiHook): void {
        throw new Error("Method not implemented.");
    }

    registerProvider(provider: ServiceProvider): void {
        throw new Error("Method not implemented.");
    }

    resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        throw new Error("Method not implemented.");
    }

    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        throw new Error("Method not implemented.");
    }

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void {
        throw new Error("Method not implemented.");
    }

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        throw new Error("Method not implemented.");
    }

    fork(): IContainer {
        throw new Error("Method not implemented.");
    }
}
