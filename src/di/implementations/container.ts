import {
    type ClassRegistration,
    type DiHook,
    type DiToken,
    type FactoryRegistration,
    type IContainer,
    type IDynamicServiceRegister,
    type IServiceLifetime,
    type RunSettings,
    type ServiceFactory,
    type ServiceProvider,
    type ValueRegistration,
} from "@/di/contracts/_module.js";
import { DynamicServiceRegister } from "@/di/implementations/dynamic-service-register.js";
import {
    ContainerAlreadyInitializedException,
    ContainerNotActiveException,
    ContainerNotTerminatedException,
} from "@/di/implementations/errors.js";
import { eagerInitialization } from "@/di/implementations/graph-algorithms.js";
import { GraphManager } from "@/di/implementations/graph-manager.js";
import {
    REGISTER_ELEMENT_TYPE,
    RegistryManager,
} from "@/di/implementations/registry-manager.js";
import { ServiceLifetimeSetter } from "@/di/implementations/service-lifetime.js";
import {
    createFunctionCache,
    LIFESPAN,
    type TNode,
} from "@/di/implementations/utils.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * @group Implementations
 */
export type ContainerSettings = {
    executionContext: IExecutionContext;
};

/**
 * @group Implementations
 */

const BEFORE_ACTIVE_STATE = Symbol("container.init not called yet");
const IN_ACTIVE_STATE = Symbol(
    "container.init called but deInit not called yet",
);
const AFTER_ACTIVE_STATE = Symbol("container.deInit called");

export type DynamicNodeProps = {
    lifespan: typeof LIFESPAN.DYNAMIC;
};

export type ScopedNodeProps = {
    lifespan: typeof LIFESPAN.SCOPED;
    service: ServiceFactory;
};

export type TransientNodeProps = {
    lifespan: typeof LIFESPAN.TRANSIENT;
    service: ServiceFactory;
};

export type SingletonNodeProps = {
    lifespan: typeof LIFESPAN.SINGLETON;
    service: ServiceFactory;
};

export type NodeProps =
    | DynamicNodeProps
    | ScopedNodeProps
    | TransientNodeProps
    | SingletonNodeProps;

export type EdgeProps = {
    argIndex: number;
};

type TState =
    | typeof BEFORE_ACTIVE_STATE
    | typeof IN_ACTIVE_STATE
    | typeof AFTER_ACTIVE_STATE;

export class Container implements IContainer {
    private graphManager: GraphManager = new GraphManager();
    private nodesMissingLifetimeProp = new Set<DiToken>();
    private initHandler?: DiHook;
    private deInitHandler?: DiHook;
    private registryManager: RegistryManager;
    private currentState: TState = BEFORE_ACTIVE_STATE;

    // TODO make privat constructor ?
    constructor(private readonly settings: ContainerSettings) {
        this.registryManager = RegistryManager.withExecutionContext(
            this.settings.executionContext,
        );
    }

    private throwIfContainerAlreadyInitialized(methodName: string) {
        if (this.currentState !== BEFORE_ACTIVE_STATE) {
            throw new ContainerAlreadyInitializedException(methodName);
        }
    }

    private throwIfAnyNodeMissLifetimeProp() {
        if (this.nodesMissingLifetimeProp.size !== 0) {
            throw new Error();
        }
    }

    private throwIfContainerNotActive(methodName: string) {
        if (this.currentState !== IN_ACTIVE_STATE) {
            throw new ContainerNotActiveException(methodName);
        }
    }

    private throwIfContainerNotTerminated(methodName: string) {
        if (this.currentState !== AFTER_ACTIVE_STATE) {
            throw new ContainerNotTerminatedException(methodName);
        }
    }

    private throwIfTokenAlreadyRegistered(token: DiToken) {
        if (this.graphManager.hasNodeProperty(token)) {
            throw new Error("double registered node");
        }
    }

    private async initSingletonsValues(): Promise<void> {
        const singletons = this.graphManager
            .nodes()
            .filter((node) => this.graphManager.isSingleton(node));

        const getSingletonNeighbors = (node: TNode) =>
            this.graphManager
                .dependencyOf(node)
                .filter(() => this.graphManager.isSingleton(node));

        const getSingletonPredecessor = (nodeId: TNode) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isSingleton(node));

        await eagerInitialization<TNode>({
            getSuccessors: getSingletonNeighbors,
            getPredecessors: getSingletonPredecessor,
            initNode: async (nodeId) => {
                const factoryArgs = this.graphManager
                    .dependencyOf(nodeId)
                    .map((dep) => this.registryManager.getAsValueOrThrow(dep));

                const serviceFactory =
                    this.graphManager.getSingletonNodeOrThrow(nodeId).service;

                const value = await callInvokable(
                    serviceFactory,
                    factoryArgs,
                    this.settings.executionContext,
                );

                this.registryManager.saveInBaseRegistry(nodeId, {
                    value,
                    type: REGISTER_ELEMENT_TYPE.DIRECT,
                });
            },
            nodeIds: singletons,
        });
    }

    // TODO check function for memory leaks
    private async initTransientFactories(): Promise<void> {
        const transients = this.graphManager
            .nodes()
            .filter((node) => this.graphManager.isTransient(node));

        const getTransientNeighbors = (node: TNode) =>
            this.graphManager.dependencyOf(node).filter((dep) => {
                return this.graphManager.isTransient(dep);
            });

        const getTransientPredecessors = (nodeId: TNode) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isTransient(node));

        const reuse = createFunctionCache();

        await eagerInitialization<TNode>({
            getSuccessors: getTransientNeighbors,
            getPredecessors: getTransientPredecessors,
            initNode: (nodeId) => {
                const factoryArgs: Array<() => Promise<unknown>> =
                    this.graphManager.dependencyOf(nodeId).map((dep) => {
                        if (
                            this.graphManager.isSingleton(dep) ||
                            this.graphManager.isScoped(dep)
                        ) {
                            const getValueLazy = async () =>
                                Promise.resolve(
                                    this.registryManager.getAsValueOrThrow(dep),
                                );

                            const cachedFunction = reuse({
                                func: getValueLazy,
                                nodeId: dep,
                            });

                            return cachedFunction;
                        } else if (this.graphManager.isTransient(dep)) {
                            const valueAsAsyncFunc =
                                this.registryManager.getAsFunctionOrThrow(dep);
                            return valueAsAsyncFunc;
                        }

                        throw new Error();
                    });

                const serviceFactory =
                    this.graphManager.getTransientNodeOrThrow(nodeId).service;

                const zeroArgsServiceFactory = async () => {
                    const resolvedInputs = await Promise.all(
                        factoryArgs.map((getValueFromReg) => getValueFromReg()),
                    );

                    const value = await callInvokable(
                        serviceFactory,
                        resolvedInputs,
                        this.settings.executionContext,
                    );

                    return value;
                };

                this.registryManager.saveInBaseRegistry(nodeId, {
                    value: zeroArgsServiceFactory,
                    type: REGISTER_ELEMENT_TYPE.FUNC,
                });
            },
            nodeIds: transients,
        });
    }

    private async initScopedValues(): Promise<void> {
        const scoped = this.graphManager
            .nodes()
            .filter((node) => this.graphManager.isScoped(node));

        const getScopedNeighbors = (nodeId: TNode) =>
            this.graphManager
                .dependencyOf(nodeId)
                .filter((node) => this.graphManager.isScoped(node));

        const getScopedPredecessor = (nodeId: TNode) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isScoped(node));

        await eagerInitialization<TNode>({
            getSuccessors: getScopedNeighbors,
            getPredecessors: getScopedPredecessor,
            initNode: async (nodeId) => {
                const factoryArgs = this.graphManager
                    .dependencyOf(nodeId)
                    .map((dep) => this.registryManager.getAsValueOrThrow(dep));

                const serviceFactory =
                    this.graphManager.getScopedNodeOrThrow(nodeId).service;

                const value = await callInvokable(
                    serviceFactory,
                    factoryArgs,
                    this.settings.executionContext,
                );

                this.registryManager.saveInCurrentScopedOrBaseRegistry(nodeId, {
                    value,
                    type: REGISTER_ELEMENT_TYPE.DIRECT,
                });
            },
            nodeIds: scoped,
        });
    }

    async init(): Promise<void> {
        this.throwIfContainerAlreadyInitialized(this.init.name);
        this.throwIfAnyNodeMissLifetimeProp();

        await this.initSingletonsValues();
        await this.initTransientFactories();

        this.currentState = IN_ACTIVE_STATE;

        if (this.initHandler !== undefined) {
            await callInvokable(this.initHandler, this);
        }
    }

    async deInit(): Promise<void> {
        this.throwIfContainerNotActive(this.deInit.name);

        if (this.deInitHandler !== undefined) {
            await callInvokable(this.deInitHandler, this);
        }
        this.currentState = AFTER_ACTIVE_STATE;
    }

    onContainerInit(handler: DiHook): void {
        this.throwIfContainerAlreadyInitialized(this.onContainerInit.name);
        this.initHandler = handler;
    }

    onContainerDeInit(handler: DiHook): void {
        this.throwIfContainerAlreadyInitialized(this.onContainerDeInit.name);
        this.deInitHandler = handler;
    }

    async run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        this.throwIfContainerNotActive(this.run.name);

        await this.settings.executionContext.run(async () => {
            const dynamicServiceRegister: IDynamicServiceRegister =
                new DynamicServiceRegister((token, value) => {
                    this.registryManager.saveInCurrentScopedOrBaseRegistry(
                        token,
                        { value, type: "value" },
                    );
                });

            this.registryManager.initNewScope();

            if (settings.dynamicRegistration !== undefined) {
                await callInvokable(
                    settings.dynamicRegistration,
                    dynamicServiceRegister,
                );
            }

            await this.initScopedValues();

            const value = await callInvokable(settings.scope);
            return value;
        });
    }

    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): IServiceLifetime {
        this.throwIfContainerAlreadyInitialized(this.registerFactory.name);
        this.throwIfTokenAlreadyRegistered(settings.token);
        this.nodesMissingLifetimeProp.add(settings.token);

        return new ServiceLifetimeSetter({
            graphManager: this.graphManager,
            notifyLifetimeIsSet: () =>
                this.nodesMissingLifetimeProp.delete(settings.token),
            settings,
        });
    }

    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime {
        return this.registerFactory({
            deps: settings.deps,
            token: settings.impl,
            factory: (args) => new settings.impl(...args),
        });
    }

    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.registerFactory({
            deps: [],
            token: settings.token,
            factory: () => settings.value,
        }).singleton();
    }

    registerDynamic(token: DiToken): void {
        this.throwIfContainerAlreadyInitialized(this.registerDynamic.name);
        this.graphManager.registerDynamic(token);
    }

    registerProvider(provider: ServiceProvider): void {
        this.throwIfContainerAlreadyInitialized(this.registerProvider.name);
        callInvokable(provider, this);
    }

    // TODO for lazy: throw if graph is invalid here
    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfContainerNotActive(this.resolve.name);
        //this.throwIfTokenNotRegistered(token);
        if (!this.registryManager.has(token)) {
            return null;
        }

        // const canResolveTransient = createCanResolveTransientFunc<TNode>({
        //     getLifespan: (node) =>
        //         this.graphManager.getNodePropertyOrThrow(node).lifespan,
        //     getNeighbors: (node) => {
        //         return this.graphManager.getSuccessorsOf(node);
        //     },
        // });

        const scopeDepth = this.registryManager.currentScopeDepthOrZero();

        const lifespan =
            this.graphManager.getNodePropertyOrThrow(token).lifespan;
        if (lifespan === LIFESPAN.SINGLETON) {
            return await Promise.resolve(
                (this.registryManager.get(token)?.value ??
                    null) as TType | null,
            );
        } else if (lifespan === LIFESPAN.TRANSIENT) {
            if (
                !this.graphManager.createCanResolveTransientFunc(
                    token,
                    scopeDepth === 0,
                )
            ) {
                return null;
            }
            const valueWrapper = this.registryManager.get(token);
            if (valueWrapper === null) {
                throw new Error();
            }
            if (valueWrapper.type !== REGISTER_ELEMENT_TYPE.FUNC) {
                throw new Error();
            }

            const factory = valueWrapper.value;

            return (await factory()) as TType | null;
        } else if (lifespan === LIFESPAN.SCOPED && scopeDepth > 0) {
            return this.registryManager.get(token)?.value as TType | null;
        }

        if (scopeDepth > 0 && lifespan === LIFESPAN.DYNAMIC) {
            return this.registryManager.get(token)?.value as TType | null;
        }

        throw new Error("Method not implemented.");
    }

    async resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOr.name);
        const value = await this.resolve(token);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }

    async resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOrFail.name);
        const value = await this.resolve(token);
        if (value === null) {
            throw Error();
        }
        return value;
    }

    async has(token: DiToken): Promise<boolean> {
        this.throwIfContainerNotActive(this.has.name);
        const res = await this.resolve(token);
        return res !== null;
    }

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        this.throwIfContainerAlreadyInitialized(this.overrideFactory.name);

        // can be called at top level unscoped
        if (this.registryManager.currentScopeDepthOrZero() !== 0) {
            throw new Error();
        }

        this.graphManager.overrideFactory(settings);
    }

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideClass.name);
        this.overrideFactory({
            deps: settings.deps,
            token: settings.impl,
            factory: (deps) => new settings.impl(...deps),
        });
    }

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideValue.name);
        this.overrideFactory({
            deps: [],
            token: settings.token,
            factory: () => settings.value,
        });
    }

    // TODO check every registmanager creates new key so iexecution coontext not populated
    fork(): IContainer {
        this.throwIfContainerAlreadyInitialized(this.fork.name);
        if (this.nodesMissingLifetimeProp.size !== 0) {
            throw new Error();
        }

        const copy = new Container(this.settings);
        copy.initHandler = this.initHandler;
        copy.deInitHandler = this.deInitHandler;
        copy.graphManager = this.graphManager.copy();
        return copy;
    }
}
