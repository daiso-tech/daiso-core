import {
    genericToken,
    ServiceExistsDiError,
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
import {
    ContainerAlreadyInitializedException,
    ContainerNotActiveException,
    ContainerNotTerminatedException,
    MethodCallInsideOfDynamicRegistrationError,
    MethodCallInsideOfRunError,
    ServiceCanNotBeResolvedError,
} from "@/di/contracts/container.errors.js";
import { DynamicServiceRegister } from "@/di/implementations/dynamic-service-register.js";
import { eagerInitialization } from "@/di/implementations/graph-algorithms.js";
import { GraphManager } from "@/di/implementations/graph-manager.js";
import {
    REGISTER_ELEMENT_TYPE,
    RegistryManager,
} from "@/di/implementations/registry-manager.js";
import { ServiceLifetimeSetter } from "@/di/implementations/service-lifetime.js";
import {
    createFunctionCache,
    tokenToString,
    type LIFESPAN,
    type TNode,
} from "@/di/implementations/utils.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { callInvokable, UnexpectedError } from "@/utilities/_module.js";

/**
 * @group Implementations
 */
export type ContainerSettings = {
    executionContext: IExecutionContext;
    maxInvalidEdgeInError?: number;
    maxCyclesInError?: number;
    maxUndeclaredDependenciesInError?: number;
};

/**
 * @group Implementations
 */

// TODO improve description of states
const BEFORE_ACTIVE_STATE = Symbol("container.init not called yet");
const IN_ACTIVE_STATE = Symbol(
    "container.init called but deInit not called yet",
);
const AFTER_ACTIVE_STATE = Symbol("container.deInit called");

type TState =
    | typeof BEFORE_ACTIVE_STATE
    | typeof IN_ACTIVE_STATE
    | typeof AFTER_ACTIVE_STATE;

// TODO NodeProps EdgeProps in folder named common since shared between multiple classes?
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

/**
 * TODO remove this error
 * Thrown when one or more registered services are missing a lifetime
 * configuration when the container is initialized.
 *
 * @group Errors
 */
export class NodesMissingLifetimePropertyError extends UnexpectedError {
    /**
     * The tokens that are missing a lifetime property.
     */
    public readonly nodes: ReadonlySet<DiToken>;

    private constructor(nodes: Set<DiToken>) {
        const nodeList = [...nodes].map(tokenToString).join(", ");
        super(
            `Missing lifetime property for nodes: "${nodeList}". Each registered service must have a lifetime (singleton, scoped, or transient) configured before init.`,
        );
        this.name = NodesMissingLifetimePropertyError.name;
        this.nodes = nodes;
    }

    /**
     * Creates a new {@link NodesMissingLifetimePropertyError} error.
     *
     * @param nodes - The tokens missing a lifetime property.
     * @returns A new error instance.
     */
    static create(nodes: Set<DiToken>): NodesMissingLifetimePropertyError {
        return new NodesMissingLifetimePropertyError(nodes);
    }
}

/**
 * TODO make methods that require active container (throwIfContainerNotActive is called at top)
 * to throw unexpected error instead of MethodCallInsideRunError (remove call to throwIfInsideRun) since
 * ContainerNotActiveException will always be thrown first.
 */

export class Container implements IContainer {
    private readonly SCOPE_DEPTH_KEY = genericToken<number>(
        "the depth level associated with current scope",
    );

    private readonly INSIDE_DYNAMIC_SERVICE_PROVIDER_STATUS_KEY =
        genericToken<boolean>(
            "Boolean indicator if container is inside DynamicServiceProvider",
        );
    private graphManager: GraphManager;
    private nodesMissingLifetimeProperty = new Set<DiToken>();
    private initHandlers: Array<DiHook> = [];
    private deInitHandlers: Array<DiHook> = [];
    private registryManager: RegistryManager;
    private currentState: TState = BEFORE_ACTIVE_STATE;

    constructor(private readonly settings: ContainerSettings) {
        this.registryManager = RegistryManager.withExecutionContext(
            this.settings.executionContext,
        );
        this.graphManager = new GraphManager({
            maxCyclesInError: settings.maxCyclesInError,
            maxInvalidEdgeInError: settings.maxInvalidEdgeInError,
            maxUndeclaredDependenciesInError:
                settings.maxUndeclaredDependenciesInError,
        });
    }

    private throwIfContainerAlreadyInitialized(methodName: string) {
        if (this.currentState !== BEFORE_ACTIVE_STATE) {
            throw new ContainerAlreadyInitializedException(methodName);
        }
    }

    private throwIfAnyNodeMissLifetimeProp() {
        if (this.nodesMissingLifetimeProperty.size !== 0) {
            throw NodesMissingLifetimePropertyError.create(
                this.nodesMissingLifetimeProperty,
            );
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
            throw ServiceExistsDiError.create(token);
        }
    }

    private throwIfInsideRunScope(methodName: string) {
        if (this.isInsideRunScope()) {
            throw MethodCallInsideOfRunError.create(methodName);
        }
    }

    private throwIfInsideDynamicServiceProvider(methodName: string) {
        if (this.isInsideDynamicServiceProvider()) {
            throw MethodCallInsideOfDynamicRegistrationError.create(methodName);
        }
    }

    private throwIfNodeNotExistInGraph(token: TNode) {
        const tokenExistInGraph = this.graphManager.hasNodeProperty(token);

        if (!tokenExistInGraph) {
            throw new UnexpectedError("is bro");
        }
    }

    private getRunScopeDepthCounter(): number | null {
        return this.settings.executionContext.get(this.SCOPE_DEPTH_KEY);
    }

    private increaseOrInitRunScopeDepthCounter(): void {
        this.settings.executionContext.putIncrement(this.SCOPE_DEPTH_KEY);
    }

    private isInsideRunScope(): boolean {
        return (
            this.settings.executionContext.get(this.SCOPE_DEPTH_KEY) !== null
        );
    }

    private isInsideDynamicServiceProvider(): boolean {
        return (
            this.settings.executionContext.get(
                this.INSIDE_DYNAMIC_SERVICE_PROVIDER_STATUS_KEY,
            ) ?? false
        );
    }

    private setInsideDynamicServiceProviderStatusTo(status: boolean): void {
        this.settings.executionContext.put(
            this.INSIDE_DYNAMIC_SERVICE_PROVIDER_STATUS_KEY,
            status,
        );
    }

    private isOutsideRunScope(): boolean {
        return (
            this.settings.executionContext.get(this.SCOPE_DEPTH_KEY) === null
        );
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
        this.throwIfInsideRunScope(this.init.name);
        this.throwIfAnyNodeMissLifetimeProp();

        console.log("validating graphs");
        const status = this.graphManager.validateGraph();
        if (!status.valid) {
            throw status.error;
        }

        await this.initSingletonsValues();
        await this.initTransientFactories();

        this.currentState = IN_ACTIVE_STATE;

        if (this.initHandlers.length !== 0) {
            const handlers = this.initHandlers.map(async (hanlder) => {
                await callInvokable(hanlder, this);
            });
            await Promise.all(handlers);
        }
    }

    // TODO check if need clean up for registry or graph or other things
    async deInit(): Promise<void> {
        this.throwIfContainerNotActive(this.deInit.name);
        this.throwIfInsideRunScope(this.deInit.name);

        if (this.deInitHandlers.length !== 0) {
            const handlers = this.deInitHandlers.map(async (hanlder) => {
                await callInvokable(hanlder, this);
            });
            await Promise.all(handlers);
        }
        this.currentState = AFTER_ACTIVE_STATE;
    }

    // TODO make possible  for adding/compounding multiple hooks ?
    onContainerInit(handler: DiHook): void {
        this.throwIfContainerAlreadyInitialized(this.onContainerInit.name);
        this.throwIfInsideRunScope(this.onContainerInit.name);

        this.initHandlers.push(handler);
    }

    // TODO make possible for adding/compounding multiple hooks ?
    onContainerDeInit(handler: DiHook): void {
        this.throwIfContainerAlreadyInitialized(this.onContainerDeInit.name);
        this.throwIfInsideRunScope(this.onContainerDeInit.name);

        this.deInitHandlers.push(handler);
    }

    async run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        this.throwIfContainerNotActive(this.run.name);
        this.throwIfInsideDynamicServiceProvider(this.run.name);

        await this.settings.executionContext.run(async () => {
            const dynamicServiceRegister: IDynamicServiceRegister =
                new DynamicServiceRegister({
                    executionContext: this.settings.executionContext,
                    setValueFor: (token, value) => {
                        this.registryManager.saveInCurrentScopedOrBaseRegistry(
                            token,
                            { value, type: "value" },
                        );
                    },
                    isOutsideRunScope: () => this.isOutsideRunScope(),
                });

            this.increaseOrInitRunScopeDepthCounter();
            this.registryManager.initNewScopedRegistry();

            if (settings.dynamicRegistration !== undefined) {
                this.setInsideDynamicServiceProviderStatusTo(true);
                await callInvokable(
                    settings.dynamicRegistration,
                    dynamicServiceRegister,
                );
                this.setInsideDynamicServiceProviderStatusTo(false);
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
        this.throwIfInsideRunScope(this.registerFactory.name);
        this.throwIfTokenAlreadyRegistered(settings.token);

        this.nodesMissingLifetimeProperty.add(settings.token);

        return new ServiceLifetimeSetter({
            graphManager: this.graphManager,
            notifyLifetimeIsSet: () =>
                this.nodesMissingLifetimeProperty.delete(settings.token),
            settings,
            token: settings.token,
        });
    }

    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime {
        this.throwIfContainerAlreadyInitialized(this.registerClass.name);
        this.throwIfInsideRunScope(this.registerClass.name);

        return this.registerFactory({
            deps: settings.deps,
            token: settings.impl,
            factory: (args) => new settings.impl(...args),
        });
    }

    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.registerValue.name);
        this.throwIfInsideRunScope(this.registerValue.name);

        this.registerFactory({
            deps: [],
            token: settings.token,
            factory: () => settings.value,
        }).singleton();
    }

    registerDynamic(token: DiToken): void {
        this.throwIfContainerAlreadyInitialized(this.registerDynamic.name);
        this.throwIfInsideRunScope(this.registerDynamic.name);
        this.throwIfTokenAlreadyRegistered(token);
        this.graphManager.registerDynamic(token);
    }

    registerProvider(provider: ServiceProvider): void {
        this.throwIfContainerAlreadyInitialized(this.registerProvider.name);
        this.throwIfInsideRunScope(this.registerProvider.name);
        callInvokable(provider, this);
    }

    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfContainerNotActive(this.resolve.name);
        this.throwIfInsideDynamicServiceProvider(this.resolve.name);

        const tokenExistInRegistry = this.registryManager.has(token);

        const tokenExistInGraph = this.graphManager.hasNodeProperty(token);

        if (!tokenExistInGraph && !tokenExistInRegistry) {
            return null;
        }

        if (tokenExistInRegistry && !tokenExistInGraph) {
            throw new UnexpectedError(
                `Token "${tokenToString(token)}" exists in the registry but is missing from the graph. This indicates an internal inconsistency: the graph should always contain every registered token.`,
                { token },
            );
        }

        if (!tokenExistInRegistry) {
            return null;
        }
        if (this.graphManager.isSingleton(token)) {
            return this.resolveSingleton(token);
        }
        if (this.graphManager.isTransient(token)) {
            return this.resolveTransient(token);
        }
        if (this.graphManager.isScoped(token)) {
            return this.resolveScoped(token);
        }
        if (this.graphManager.isDynamic(token)) {
            return this.resolveDynamic(token);
        }

        throw new UnexpectedError("unknown type");
    }

    private assumeType<TType>(value: unknown): TType {
        return value as TType;
    }

    private async resolveSingleton<TType>(
        token: DiToken<TType>,
    ): Promise<TType> {
        await Promise.resolve();
        if (!this.graphManager.isSingleton(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be singleton`,
                {
                    token,
                },
            );
        }
        const value = this.registryManager.getAsValueOrThrow(token);
        return this.assumeType<TType>(value);
    }

    private async resolveTransient<TType>(
        token: DiToken<TType>,
    ): Promise<TType | null> {
        if (!this.graphManager.isTransient(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be transient`,
                {
                    token,
                },
            );
        }

        const canNotResolve =
            this.graphManager.ancestorIncludeScopedNodes(token) &&
            this.isOutsideRunScope();

        const canResolve = !canNotResolve;

        if (canResolve) {
            const factory = this.registryManager.getAsFunctionOrThrow(token);
            const value = await factory();
            return this.assumeType<TType>(value);
        } else {
            return null;
        }
    }

    private async resolveScoped<TType>(
        token: DiToken<TType>,
    ): Promise<TType | null> {
        if (!this.graphManager.isScoped(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be scoped`,
                {
                    token,
                },
            );
        }

        await Promise.resolve();
        const canResolve = this.isInsideRunScope();
        if (canResolve) {
            const value = this.registryManager.getAsValueOrThrow(token);
            return this.assumeType<TType>(value);
        }
        return null;
    }

    private async resolveDynamic<TType>(
        token: DiToken<TType>,
    ): Promise<TType | null> {
        await Promise.resolve();
        if (!this.graphManager.isDynamic(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be dynamic`,
                {
                    token,
                },
            );
        }
        const canResolve = this.isInsideRunScope();
        if (canResolve) {
            const value = this.registryManager.getAsValueOrThrow(token);
            return this.assumeType<TType>(value);
        }
        return null;
    }

    async resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOr.name);
        this.throwIfInsideDynamicServiceProvider(this.resolveOr.name);

        const value = await this.resolve(token);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }

    async resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOrFail.name);
        this.throwIfInsideDynamicServiceProvider(this.resolveOrFail.name);

        const value = await this.resolve(token);
        if (value === null) {
            throw ServiceCanNotBeResolvedError.create(token);
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
        this.throwIfInsideRunScope(this.overrideFactory.name);

        const status = this.graphManager.overrideFactory(settings);
        if (!status.success) {
            throw status.error;
        }
    }

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideClass.name);
        this.throwIfInsideRunScope(this.overrideClass.name);

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
        this.throwIfInsideRunScope(this.overrideValue.name);

        this.overrideFactory({
            deps: [],
            token: settings.token,
            factory: () => settings.value,
        });
    }

    // TODO decide if copying handlers is good idea.
    // currently it does copy
    fork(): IContainer {
        this.throwIfContainerAlreadyInitialized(this.fork.name);
        this.throwIfInsideRunScope(this.fork.name);

        if (this.nodesMissingLifetimeProperty.size !== 0) {
            throw NodesMissingLifetimePropertyError.create(
                this.nodesMissingLifetimeProperty,
            );
        }

        const copy = new Container(this.settings);
        copy.initHandlers.push(...this.initHandlers);
        copy.deInitHandlers.push(...this.deInitHandlers);
        copy.graphManager = this.graphManager.copy();
        return copy;
    }
}
