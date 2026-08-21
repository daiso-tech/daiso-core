/**
 * @module DI
 */
import {
    genericToken,
    CanNotRegisterServiceDiError,
} from "@/di/contracts/_module-exports.js";
import {
    InvalidMethodCallDiError,
    CanNotBeResolvedDiError,
} from "@/di/contracts/container.errors.js";
import { INTERNAL_LIFETIME } from "@/di/implementations/eager/_shared.js";
import { DynamicServiceRegister } from "@/di/implementations/eager/dynamic-service-register.js";
import { eagerInitialization } from "@/di/implementations/eager/graph-algorithms.js";
import { GraphManager } from "@/di/implementations/eager/graph-manager.js";
import {
    REGISTER_ELEMENT_TYPE,
    RegistryManager,
} from "@/di/implementations/eager/registry-manager.js";
import {
    createFunctionCache,
    tokenToString,
} from "@/di/implementations/eager/utils.js";
import { callInvocable, UnexpectedError } from "@/utilities/_module-exports.js";

import type {
    DiHook,
    DiToken,
    FactoryRegistration,
    FactoryRegistrationOverride,
    IContainer,
    IDynamicServiceRegister,
    IServiceRegister,
    RunSettings,
    ServiceProvider,
    ValueRegistration,
    DepRecord,
    EmptyDepRecord,
} from "@/di/contracts/_module.js";
import type { ServiceCanNotBeResolvedErrorData } from "@/di/contracts/container.errors.js";
import type { Node } from "@/di/implementations/eager/_shared.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/di"`
 * @group Implementations
 */
export type ContainerSettings = {
    /**
     * The execution context used by the container to track and propagate
     * per-scope state (such as the current run-scope depth and the dynamic
     * registration status) across asynchronous boundaries.
     */
    executionContext: IExecutionContext;
};

type TState = (typeof Container.STATE)[keyof typeof Container.STATE];

/**
 * IMPORT_PATH: `"eridu-tech/di"`
 * @group Implementations
 */
export class Container implements IContainer {
    static readonly STATE = {
        ACTIVE: Symbol("Container is active."),
        UNINITIALIZED: Symbol("Container is uninitialized."),
        TERMINATED: Symbol("Container is terminated."),
    } as const;
    private readonly SCOPE_DEPTH_COUNT_KEY = genericToken<number>(
        "The depth level associated with current scope",
    );

    private readonly INSIDE_DYNAMIC_SERVICE_PROVIDER_STATUS_KEY =
        genericToken<boolean>(
            "Boolean indicator if container is inside DynamicServiceProvider",
        );
    private graphManager: GraphManager;
    private initHandlers: Array<DiHook> = [];
    private deInitHandlers: Array<DiHook> = [];
    private registryManager: RegistryManager;
    private currentState: TState = Container.STATE.UNINITIALIZED;

    constructor(private readonly settings: ContainerSettings) {
        this.registryManager = RegistryManager.withExecutionContext(
            this.settings.executionContext,
        );
        this.graphManager = new GraphManager({
            maxCyclesInError: 10,
            maxInvalidEdgeInError: 100,
            maxUndeclaredDependenciesInError: 100,
        });
    }

    private throwIfContainerAlreadyInitialized(methodName: string) {
        if (this.currentState !== Container.STATE.UNINITIALIZED) {
            throw InvalidMethodCallDiError.create({
                methodName,
                flag: InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED,
            });
        }
    }

    private throwIfContainerNotActive(methodName: string) {
        if (this.currentState !== Container.STATE.ACTIVE) {
            throw InvalidMethodCallDiError.create({
                methodName,
                flag: InvalidMethodCallDiError.FLAG.NOT_ACTIVE,
            });
        }
    }

    private throwIfTokenAlreadyRegistered(token: DiToken) {
        if (this.graphManager.hasNodeProperty(token)) {
            throw CanNotRegisterServiceDiError.create({
                flag: CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED,
                token,
            });
        }
    }

    private throwIfInsideRunScope(methodName: string) {
        if (this.isInsideRunScope()) {
            throw InvalidMethodCallDiError.create({
                methodName,
                flag: InvalidMethodCallDiError.FLAG.INSIDE_RUN,
            });
        }
    }

    private throwIfInsideDynamicServiceProvider(methodName: string) {
        if (this.isInsideDynamicServiceProvider()) {
            throw InvalidMethodCallDiError.create({
                methodName,
                flag: InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION,
            });
        }
    }

    private getRunScopeDepthCounter(): number | null {
        return this.settings.executionContext.get(this.SCOPE_DEPTH_COUNT_KEY);
    }

    private transformArrayDepToRecordDep<T>(
        entries: Array<{ key: string | number; value: T }>,
    ): Partial<Record<string, T>> {
        return Object.fromEntries(
            entries.map(({ key, value }) => [key, value]),
        );
    }

    private incOrInitScopeDepthCounter(): void {
        this.settings.executionContext.putIncrement(this.SCOPE_DEPTH_COUNT_KEY);
    }

    private isInsideRunScope(): boolean {
        return (
            this.settings.executionContext.get(this.SCOPE_DEPTH_COUNT_KEY) !==
            null
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
        return !this.isInsideRunScope();
    }

    private async initSingletonsValues(): Promise<void> {
        const singletons = this.graphManager
            .nodes()
            .filter((node) => this.graphManager.isSingleton(node));

        const getSingletonNeighbors = (node: Node) =>
            this.graphManager
                .dependencyOf(node)
                .filter(() => this.graphManager.isSingleton(node));

        const getSingletonPredecessor = (nodeId: Node) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isSingleton(node));

        await eagerInitialization<Node>({
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

                const value = await callInvocable(
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

    private async initTransientFactories(): Promise<void> {
        const transients = this.graphManager
            .nodes()
            .filter((node) => this.graphManager.isTransient(node));

        const getTransientNeighbors = (node: Node) =>
            this.graphManager.dependencyOf(node).filter((dep) => {
                return this.graphManager.isTransient(dep);
            });

        const getTransientPredecessors = (nodeId: Node) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isTransient(node));

        const reuse = createFunctionCache();

        await eagerInitialization<Node>({
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

                    throw new UnexpectedError(
                        `Dependency "${tokenToString(dep)}" of transient node "${tokenToString(nodeId)}" is neither singleton, scoped, nor transient.`,
                        {
                            token: dep,
                        },
                    );
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

                    const value = await callInvocable(
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

        const getScopedNeighbors = (nodeId: Node) =>
            this.graphManager
                .dependencyOf(nodeId)
                .filter((node) => this.graphManager.isScoped(node));

        const getScopedPredecessor = (nodeId: Node) =>
            this.graphManager
                .getPredecessorsOf(nodeId)
                .filter((node) => this.graphManager.isScoped(node));

        await eagerInitialization<Node>({
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

                const value = await callInvocable(
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

    private async runHooks(
        hooks: Array<DiHook>,
        allSettled = false,
    ): Promise<void> {
        const handlers = hooks.map(async (hanlder) => {
            await callInvocable(hanlder, this);
        });
        if (allSettled) {
            const results = await Promise.allSettled(handlers);
            const firstRejected = results.find(
                (result): result is PromiseRejectedResult =>
                    result.status === "rejected",
            );
            if (firstRejected !== undefined) {
                throw firstRejected.reason;
            }
            return;
        }
        await Promise.all(handlers);
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

        this.currentState = Container.STATE.ACTIVE;
        try {
            await this.runHooks(this.initHandlers);
        } catch (error) {
            // A failed init hook means initialization is incomplete. Move to a
            // non-active state so retries and resolve calls cannot use the
            // partially initialized container.
            this.currentState = Container.STATE.TERMINATED;
            throw error;
        }
    }

    async deInit(): Promise<void> {
        this.throwIfContainerNotActive(this.deInit.name);
        this.throwIfInsideRunScope(this.deInit.name);

        try {
            // Run every deInit handler even if one rejects, so all cleanup
            // hooks get a chance to execute.
            await this.runHooks(this.deInitHandlers, true);
        } finally {
            this.registryManager.clear();
            this.currentState = Container.STATE.TERMINATED;
        }
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

    async run<TValue = void>(settings: RunSettings<TValue>): Promise<TValue> {
        this.throwIfContainerNotActive(this.run.name);
        this.throwIfInsideDynamicServiceProvider(this.run.name);

        return this.settings.executionContext.run(async () => {
            const dynamicServiceRegister: IDynamicServiceRegister =
                new DynamicServiceRegister({
                    executionContext: this.settings.executionContext,
                    setValueFor: (token, value) => {
                        this.registryManager.saveInCurrentScopedOrBaseRegistry(
                            token,
                            { value, type: REGISTER_ELEMENT_TYPE.DIRECT },
                        );
                    },
                    isOutsideRunScope: () => this.isOutsideRunScope(),
                });

            this.incOrInitScopeDepthCounter();
            this.registryManager.initNewScopedRegistry();

            if (settings.dynamicRegistration !== undefined) {
                this.setInsideDynamicServiceProviderStatusTo(true);
                await callInvocable(
                    settings.dynamicRegistration,
                    dynamicServiceRegister,
                );
                this.setInsideDynamicServiceProviderStatusTo(false);
            }
            await this.initScopedValues();

            const value = await callInvocable(settings.scope);
            return value;
        });
    }

    registerFactory<
        TDeps extends DepRecord = EmptyDepRecord,
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
            lifetime: INTERNAL_LIFETIME.SINGLETON,
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
        const result = callInvocable<[IServiceRegister], unknown>(
            provider,
            this,
        );
        if (result instanceof Promise) {
            // A promise-returning (async) provider would be fire-and-forgotten:
            // its registrations could be missing at init() and any rejection
            // would be unhandled. Fail loudly instead of ignoring it.
            void result.catch(() => {});
            throw new UnexpectedError(
                "Service providers must be synchronous. Async providers are not supported because their registrations would not complete before init().",
            );
        }
    }

    private async resolveOrGiveExplanation<TType>(
        token: DiToken<TType>,
    ): Promise<
        | { success: true; value: TType }
        | { success: false; explanation: ServiceCanNotBeResolvedErrorData }
    > {
        const tokenExistInRegistry = this.registryManager.has(token);

        const tokenExistInGraph = this.graphManager.hasNodeProperty(token);

        if (!tokenExistInGraph && !tokenExistInRegistry) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG.NOT_REGISTERED_TOKEN,
                    token,
                },
            };
        }

        if (tokenExistInRegistry && !tokenExistInGraph) {
            throw new UnexpectedError(
                `Token "${tokenToString(token)}" exists in the registry but is missing from the graph. This indicates an internal inconsistency: the graph should always contain every registered token.`,
                { token },
            );
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

    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfContainerNotActive(this.resolve.name);
        this.throwIfInsideDynamicServiceProvider(this.resolve.name);

        const res = await this.resolveOrGiveExplanation(token);
        if (res.success) {
            return res.value;
        }
        return null;
    }

    private assumeType<TType>(value: unknown): TType {
        return value as TType;
    }

    private async resolveSingleton<TType>(
        token: DiToken<TType>,
    ): Promise<
        | { success: true; value: TType }
        | { success: false; explanation: ServiceCanNotBeResolvedErrorData }
    > {
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

        if (value === null) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL,
                    token,
                },
            };
        }

        return { success: true, value: this.assumeType<TType>(value) };
    }

    private async resolveTransient<TType>(
        token: DiToken<TType>,
    ): Promise<
        | { success: true; value: TType }
        | { success: false; explanation: ServiceCanNotBeResolvedErrorData }
    > {
        if (!this.graphManager.isTransient(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be transient`,
                {
                    token,
                },
            );
        }
        const includeScopedNodes =
            this.graphManager.ancestorOfTransientNodeIncludeScopedNodes(token);

        const canNotResolve =
            includeScopedNodes.status && this.isOutsideRunScope();

        if (canNotResolve) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG
                        .TRANSIENT_SERVICE_DEPEND_ON_SCOPED,
                    scopedTokens: includeScopedNodes.nodes,
                    transientToken: token,
                },
            };
        }

        const factory = this.registryManager.getAsFunctionOrThrow(token);
        const value = await factory();

        if (value === null) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL,
                    token,
                },
            };
        }
        return { success: true, value: this.assumeType<TType>(value) };
    }

    private async resolveScoped<TType>(
        token: DiToken<TType>,
    ): Promise<
        | { success: true; value: TType }
        | { success: false; explanation: ServiceCanNotBeResolvedErrorData }
    > {
        if (!this.graphManager.isScoped(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be scoped`,
                {
                    token,
                },
            );
        }

        await Promise.resolve();

        const outsideRun = !this.isInsideRunScope();

        if (outsideRun) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG
                        .SCOPED_SERVICE_OUTSIDE_RUN,
                    token,
                },
            };
        }

        const dynamicNodes =
            this.graphManager.getDynamicAncestralNodesOfScopedNode(token);
        const dynamicTokensWithoutValue = dynamicNodes.filter(
            (node) => !this.registryManager.has(node),
        );

        if (dynamicTokensWithoutValue.length > 0) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG
                        .NO_DYNAMIC_VALUE_SET_FOR_TOKENS,
                    dynamicTokens: dynamicTokensWithoutValue,
                },
            };
        }

        const value = this.registryManager.getAsValueOrThrow(token);
        if (value === null) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL,
                    token,
                },
            };
        }
        return { success: true, value: this.assumeType<TType>(value) };
    }

    private async resolveDynamic<TType>(
        token: DiToken<TType>,
    ): Promise<
        | { success: true; value: TType }
        | { success: false; explanation: ServiceCanNotBeResolvedErrorData }
    > {
        await Promise.resolve();
        if (!this.graphManager.isDynamic(token)) {
            throw new UnexpectedError(
                `Excepted token to exist in graph and be dynamic`,
                {
                    token,
                },
            );
        }
        const outsideRun = !this.isInsideRunScope();

        if (outsideRun) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG
                        .DYNAMIC_SERVICE_OUTSIDE_RUN,
                    token,
                },
            };
        }
        if (!this.registryManager.has(token)) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG
                        .NO_DYNAMIC_VALUE_SET_FOR_TOKENS,
                    dynamicTokens: [token],
                },
            };
        }

        const value = this.registryManager.getAsValueOrThrow(token);

        if (value === null) {
            return {
                success: false,
                explanation: {
                    flag: CanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL,
                    token,
                },
            };
        }
        return { success: true, value: this.assumeType<TType>(value) };
    }

    async resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOr.name);
        this.throwIfInsideDynamicServiceProvider(this.resolveOr.name);

        const result = await this.resolveOrGiveExplanation(token);
        if (result.success) {
            return result.value;
        }
        return defaultValue;
    }

    async resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        this.throwIfContainerNotActive(this.resolveOrFail.name);
        this.throwIfInsideDynamicServiceProvider(this.resolveOrFail.name);

        const result = await this.resolveOrGiveExplanation(token);
        if (!result.success) {
            throw CanNotBeResolvedDiError.create(result.explanation);
        }
        return result.value;
    }

    async has(token: DiToken): Promise<boolean> {
        this.throwIfContainerNotActive(this.has.name);
        const res = await this.resolve(token);
        return res !== null;
    }

    overrideFactory<
        TDeps extends DepRecord = EmptyDepRecord,
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

        const forked = new Container(this.settings);
        this.initHandlers.forEach((hook) => {
            forked.onContainerInit(hook);
        });
        this.deInitHandlers.forEach((hook) => {
            forked.onContainerDeInit(hook);
        });
        forked.graphManager = this.graphManager.copy();
        return forked;
    }
}
