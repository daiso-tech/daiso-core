import {
    genericToken,
    ServiceAlreadyRegisteredDiError,
    type DiHook,
    type DiToken,
    type FactoryRegistration,
    type FactoryRegistrationOverride,
    type IContainer,
    type IDynamicServiceRegister,
    type RunSettings,
    type ServiceProvider,
    type ValueRegistration,
} from "@/di/contracts/_module.js";
import {
    InvalidMethodCall,
    METHOD_CALL_FLAG,
    ServiceCanNotBeResolvedError,
} from "@/di/contracts/container.errors.js";
import { type TNode, INTERNAL_LIFESPAN } from "@/di/implementations/common.js";
import { DynamicServiceRegister } from "@/di/implementations/dynamic-service-register.js";
import { eagerInitialization } from "@/di/implementations/graph-algorithms.js";
import { GraphManager } from "@/di/implementations/graph-manager.js";
import {
    REGISTER_ELEMENT_TYPE,
    RegistryManager,
} from "@/di/implementations/registry-manager.js";
import {
    createFunctionCache,
    tokenToString,
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

const BEFORE_ACTIVE_STATE = Symbol("container.init not called yet");
const IN_ACTIVE_STATE = Symbol(
    "container.init called but deInit not called yet",
);
const AFTER_ACTIVE_STATE = Symbol("container.deInit called");

type TState =
    | typeof BEFORE_ACTIVE_STATE
    | typeof IN_ACTIVE_STATE
    | typeof AFTER_ACTIVE_STATE;

export class Container implements IContainer {
    private readonly SCOPE_DEPTH_KEY = genericToken<number>(
        "the depth level associated with current scope",
    );

    private readonly INSIDE_DYNAMIC_SERVICE_PROVIDER_STATUS_KEY =
        genericToken<boolean>(
            "Boolean indicator if container is inside DynamicServiceProvider",
        );
    private graphManager: GraphManager;
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
            throw InvalidMethodCall.create({
                methodName,
                flag: METHOD_CALL_FLAG.ALREADY_INITIALIZED,
            });
        }
    }

    private throwIfContainerNotActive(methodName: string) {
        if (this.currentState !== IN_ACTIVE_STATE) {
            throw InvalidMethodCall.create({
                methodName,
                flag: METHOD_CALL_FLAG.NOT_ACTIVE,
            });
        }
    }

    private throwIfTokenAlreadyRegistered(token: DiToken) {
        if (this.graphManager.hasNodeProperty(token)) {
            throw ServiceAlreadyRegisteredDiError.create(token);
        }
    }

    private throwIfInsideRunScope(methodName: string) {
        if (this.isInsideRunScope()) {
            throw InvalidMethodCall.create({
                methodName,
                flag: METHOD_CALL_FLAG.INSIDE_RUN,
            });
        }
    }

    private throwIfInsideDynamicServiceProvider(methodName: string) {
        if (this.isInsideDynamicServiceProvider()) {
            throw InvalidMethodCall.create({
                methodName,
                flag: METHOD_CALL_FLAG.INSIDE_DYNAMIC_REGISTRATION,
            });
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

    private transformArrayDepToRecordDep<T>(
        entries: Array<{ key: string | number; value: T }>,
    ): Partial<Record<string, T>> {
        return Object.fromEntries(
            entries.map(({ key, value }) => [key, value]),
        );
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
                const factoryArrayArgs = this.graphManager
                    .dependencyOf(nodeId)
                    .map((dep) => ({
                        key: this.graphManager.getArgKey([nodeId, dep]),
                        value: this.registryManager.getAsValueOrThrow(dep),
                    }));

                const factoryArgs =
                    this.transformArrayDepToRecordDep(factoryArrayArgs);

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
                const factoryArrayArgs: Array<{
                    key: string | number;
                    value: () => Promise<unknown>;
                }> = this.graphManager.dependencyOf(nodeId).map((dep) => {
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

                        return {
                            key: this.graphManager.getArgKey([nodeId, dep]),
                            value: cachedFunction,
                        };
                    } else if (this.graphManager.isTransient(dep)) {
                        const valueAsAsyncFunc =
                            this.registryManager.getAsFunctionOrThrow(dep);
                        return {
                            key: this.graphManager.getArgKey([nodeId, dep]),
                            value: valueAsAsyncFunc,
                        };
                    }

                    throw new Error();
                });

                const serviceFactory =
                    this.graphManager.getTransientNodeOrThrow(nodeId).service;

                const zeroArgsServiceFactory = async () => {
                    const resolvedInputs = await Promise.all(
                        factoryArrayArgs.map(async (entry) => ({
                            key: entry.key,
                            value: await entry.value(),
                        })),
                    );

                    const resolvedFactoryArgs =
                        this.transformArrayDepToRecordDep(resolvedInputs);

                    const value = await callInvokable(
                        serviceFactory,
                        resolvedFactoryArgs,
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
                const factoryArrayArgs = this.graphManager
                    .dependencyOf(nodeId)
                    .map((dep) => ({
                        key: this.graphManager.getArgKey([nodeId, dep]),
                        value: this.registryManager.getAsValueOrThrow(dep),
                    }));

                const factoryArgs =
                    this.transformArrayDepToRecordDep(factoryArrayArgs);

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

    async deInit(): Promise<void> {
        this.throwIfContainerNotActive(this.deInit.name);
        this.throwIfInsideRunScope(this.deInit.name);

        if (this.deInitHandlers.length !== 0) {
            const handlers = this.deInitHandlers.map(async (hanlder) => {
                await callInvokable(hanlder, this);
            });
            await Promise.all(handlers);
        }
        this.registryManager.clear();
        this.currentState = AFTER_ACTIVE_STATE;
    }

    onContainerInit(handler: DiHook): void {
        this.throwIfContainerAlreadyInitialized(this.onContainerInit.name);
        this.throwIfInsideRunScope(this.onContainerInit.name);

        this.initHandlers.push(handler);
    }

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
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        TDeps extends Partial<Record<string, unknown>> = {},
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        this.throwIfContainerAlreadyInitialized(this.registerFactory.name);
        this.throwIfInsideRunScope(this.registerFactory.name);
        this.throwIfTokenAlreadyRegistered(settings.token);

        this.graphManager.registerFactory(settings);
    }

    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.registerValue.name);
        this.throwIfInsideRunScope(this.registerValue.name);

        this.registerFactory({
            deps: {},
            token: settings.token,
            factory: () => settings.value,
            lifetime: INTERNAL_LIFESPAN.SINGLETON,
        });
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
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        TDeps extends Partial<Record<string, unknown>> = {},
        TRegisteredType = unknown,
    >(settings: FactoryRegistrationOverride<TDeps, TRegisteredType>): void {
        this.throwIfContainerAlreadyInitialized(this.overrideFactory.name);
        this.throwIfInsideRunScope(this.overrideFactory.name);

        const status = this.graphManager.overrideFactory(settings);
        if (!status.success) {
            throw status.error;
        }
    }

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideValue.name);
        this.throwIfInsideRunScope(this.overrideValue.name);

        this.overrideFactory({
            deps: {},
            token: settings.token,
            factory: () => settings.value,
        });
    }

    fork(): IContainer {
        this.throwIfContainerAlreadyInitialized(this.fork.name);
        this.throwIfInsideRunScope(this.fork.name);

        const copy = new Container(this.settings);
        copy.initHandlers.push(...this.initHandlers);
        copy.deInitHandlers.push(...this.deInitHandlers);
        copy.graphManager = this.graphManager.copy();
        return copy;
    }
}
