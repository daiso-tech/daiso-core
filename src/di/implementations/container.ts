import {
    type ClassRegistration,
    type ContextRegistration,
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
} from "@/di/implementations/errors.js";
import { eagerInitialization } from "@/di/implementations/graph-utils.js";
import { GraphManager } from "@/di/implementations/graph.js";
import { setUpRegistryMangerWithExecutionContext } from "@/di/implementations/registery-utils.js";
import { type RegistryManager } from "@/di/implementations/registry.js";
import {
    createFunctionCache,
    LIFESPAN,
    type TEdge,
    type TLifespan,
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

type NodeProps =
    | {
          lifespan: Exclude<TLifespan, typeof LIFESPAN.DYNAMIC>;
          service: ServiceFactory;
      }
    | {
          lifespan: typeof LIFESPAN.DYNAMIC;
      };

type EdgeProps = {
    argIndex: number;
};

type TState =
    | typeof BEFORE_ACTIVE_STATE
    | typeof IN_ACTIVE_STATE
    | typeof AFTER_ACTIVE_STATE;

export async function initEagerlySingletons<T>(args: {
    createSingletonNodeValue: (
        singletonNodeIds: T,
        inputValues: Array<unknown>,
    ) => Promise<unknown>;
    saveSingletonValue: (nodeId: T, value: unknown) => void;
    getSingletonNeighbors: (nodeId: T) => Array<T>;
    getAllNeighbors: (nodeId: T) => Array<T>;
    getValue: (nodeId: T) => unknown;
    getArgIndexOfNode(nodeId: T, depsId: T): number;
    getSingletonPredecessors: (nodeId: T) => Array<T>;
    singletonNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization<T>({
        getSuccessors: args.getSingletonNeighbors,
        getPredecessors: args.getSingletonPredecessors,
        initNode: async (nodeId) => {
            const neighborNodeIds = args
                .getSingletonNeighbors(nodeId)
                .map((neighborId) => ({
                    neighborId,
                    argIndex: args.getArgIndexOfNode(nodeId, neighborId),
                }));

            const argsWithIndex = neighborNodeIds.map((item) => ({
                index: item.argIndex,
                value: args.getValue(item.neighborId),
            }));

            const correctlySortedArgs = argsWithIndex
                .sort((itemA, itemB) => itemA.index - itemB.index)
                .map((item) => item.value);

            const value = await args.createSingletonNodeValue(
                nodeId,
                correctlySortedArgs,
            );
            args.saveSingletonValue(nodeId, value);
        },
        nodeIds: args.singletonNodeIds,
    });
}

export async function initEagerlyTransients<T>(args: {
    createTransientFactoryFunc: (
        transientNodeIds: T,
        inputFuncs: Array<() => Promise<unknown>>,
    ) => () => Promise<unknown>;
    saveTransientFactoryFunc: (
        nodeId: T,
        zeroArgsFunc: () => Promise<unknown>,
    ) => void;
    getValueGetter: (nodeId: T) => () => Promise<unknown>;
    getAllNeighbors: (nodeId: T) => Array<T>;
    getTransientNeighbors: (nodeId: T) => Array<T>;
    getArgIndexOfNode(nodeId: T, depsId: T): number;
    getTransientPredecessors: (nodeId: T) => Array<T>;

    transientNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization({
        getSuccessors: args.getTransientNeighbors,
        getPredecessors: args.getTransientPredecessors,
        initNode: (nodeId) => {
            const allNeighbors = args.getAllNeighbors(nodeId);

            const valueGettersWithIndex = allNeighbors.map((depsId) => {
                return {
                    index: args.getArgIndexOfNode(nodeId, depsId),
                    get: args.getValueGetter(depsId),
                };
            });

            const correctlySortedArgsGetter = valueGettersWithIndex
                .sort((itemA, itemB) => itemA.index - itemB.index)
                .map((item) => item.get);

            const func = args.createTransientFactoryFunc(
                nodeId,
                correctlySortedArgsGetter,
            );
            args.saveTransientFactoryFunc(nodeId, func);
        },

        nodeIds: args.transientNodeIds,
    });
}

export async function initEagerlyScoped<T>(args: {
    createScopedValue: (
        singletonNodeIds: T,
        inputValues: Array<unknown>,
    ) => Promise<unknown>;
    saveScopedValue: (nodeId: T, value: unknown) => void;
    getValue: (nodeId: T) => unknown;
    getAllNeighbors: (nodeId: T) => Array<T>;
    getScopedNeighbors: (nodeId: T) => Array<T>;
    getArgIndexOfNode(nodeId: T, depsId: T): number;
    getScopedPredecessors: (nodeId: T) => Array<T>;

    scopedNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization({
        getSuccessors: args.getScopedNeighbors,
        getPredecessors: args.getScopedPredecessors,
        initNode: async (nodeId) => {
            const singletonNeighbors = args.getAllNeighbors(nodeId);

            const singletonValuesWithIndex = singletonNeighbors.map(
                (depsId) => {
                    return {
                        index: args.getArgIndexOfNode(nodeId, depsId),
                        value: args.getValue(depsId),
                    };
                },
            );

            const correctlySortedArgsGetter = singletonValuesWithIndex
                .sort((itemA, itemB) => itemA.index - itemB.index)
                .map((item) => item.value);

            const func = await args.createScopedValue(
                nodeId,
                correctlySortedArgsGetter,
            );
            args.saveScopedValue(nodeId, func);
        },

        nodeIds: args.scopedNodeIds,
    });
}

export type RegistryValue =
    | {
          type: "direct";
          value: unknown;
          lifespan: Exclude<TLifespan, typeof LIFESPAN.TRANSIENT>;
      }
    | {
          type: "function";
          value: () => Promise<unknown>;
          lifespan: Extract<TLifespan, typeof LIFESPAN.TRANSIENT>;
      };

export function createNeighborFilter(
    graph: GraphManager<NodeProps, EdgeProps>,
    lifeSpan: TLifespan,
): (x: TNode) => Array<TNode> {
    const getSingletonNeighbors = (nodeId: TNode) =>
        graph
            .getSuccessorsOf(nodeId)
            .filter(
                (successor) =>
                    graph.getNodePropertyOrThrow(successor).lifespan ===
                    lifeSpan,
            );

    return getSingletonNeighbors;
}

export function getArgIndexOfNode(graph: GraphManager<NodeProps, EdgeProps>) {
    return (nodeId: TNode, depsId: TNode): number => {
        const edges = graph
            .getSuccessorEdgesOf(nodeId)
            .filter(
                ([fromNode, toNode]) =>
                    nodeId === fromNode && toNode === depsId,
            );

        if (edges.length !== 1) {
            throw new Error();
        }
        const edge = edges[0];

        if (edge === undefined) {
            throw new Error();
        }

        const argIndex = graph.getEdgePropertyOrThrow(edge).argIndex;

        return argIndex;
    };
}

export function createCanResolveTransientFunc<T>(args: {
    getLifespan: (node: T) => TLifespan;
    getNeighbors: (node: T) => Array<T>;
}) {
    return (nodeId: T, depthIsZero: boolean): boolean => {
        if (args.getLifespan(nodeId) !== LIFESPAN.TRANSIENT) {
            throw new Error();
        }
        const nodesVisited = visitedNodes({
            getNeighbors: args.getNeighbors,
            node: nodeId,
        });
        const scopedNodeVisited = nodesVisited.some(
            (visited) => args.getLifespan(visited) === LIFESPAN.SCOPED,
        );
        if (depthIsZero && scopedNodeVisited) {
            return false;
        }

        return true;
    };
}

function visitedNodes<T>(args: {
    node: T;
    getNeighbors: (node: T) => Array<T>;
}): Array<T> {
    const { node, getNeighbors } = args;

    const visited = new Set<T>();

    function dfs(current: T): void {
        if (visited.has(current)) {
            return;
        }

        visited.add(current);

        for (const neighbor of getNeighbors(current)) {
            dfs(neighbor);
        }
    }

    dfs(node);

    return Array.from(visited);
}

export function createNodeFilter(
    graph: GraphManager<NodeProps, EdgeProps>,
    lifeSpan: TLifespan,
): Array<TNode> {
    const nodes = graph
        .nodes()
        .filter(
            (nodeId) =>
                graph.getNodePropertyOrThrow(nodeId).lifespan === lifeSpan,
        );

    return nodes;
}

function throwIfNodeHaveIncorrectLifespan(
    node: NodeProps,
    correctLifespans: Array<TLifespan>,
) {
    if (!correctLifespans.includes(node.lifespan)) {
        throw new Error();
    }
}

const REGISTER_VALUE_TYPE = {
    DIRECT: "value",
    FUNC: "func",
} as const;

type TRegisterValue =
    | {
          type: typeof REGISTER_VALUE_TYPE.DIRECT;
          value: unknown;
      }
    | {
          type: typeof REGISTER_VALUE_TYPE.FUNC;
          value: () => Promise<unknown>;
      };

type TRegisterValueType =
    (typeof REGISTER_VALUE_TYPE)[keyof typeof REGISTER_VALUE_TYPE];

function throwIfValueIsStoredIncorrect(
    registerValue: TRegisterValue,
    correctValueType: TRegisterValueType,
) {
    if (registerValue.type !== correctValueType) {
        throw new Error();
    }
}

export class Container implements IContainer {
    private graphManager = new GraphManager<NodeProps, EdgeProps>();
    private registryManager: RegistryManager<TRegisterValue>;
    private initHandler: DiHook | null = null;
    private deInitHandler: DiHook | null = null;
    private state: TState = BEFORE_ACTIVE_STATE;

    constructor(private readonly settings: ContainerSettings) {
        this.registryManager =
            setUpRegistryMangerWithExecutionContext<TRegisterValue>(
                this.settings.executionContext,
            );
    }

    private throwIfContainerAlreadyInitialized(methodName: string) {
        if (this.state !== BEFORE_ACTIVE_STATE) {
            throw new ContainerAlreadyInitializedException(methodName);
        }
    }
    private throwIfContainerNotActive(methodName: string) {
        if (this.state !== IN_ACTIVE_STATE) {
            throw new ContainerNotActiveException(methodName);
        }
    }

    private throwIfContainerNotTerminated(methodName: string) {
        if (this.state !== AFTER_ACTIVE_STATE) {
            throw new ContainerNotTerminatedException(methodName);
        }
    }

    private throwIfTokenAlreadyRegistered(token: DiToken) {
        if (this.graphManager.hasNodeProperty(token)) {
            throw new Error("double registered node");
        }
    }

    private throwIfTokenNotRegistered(token: DiToken) {
        if (!this.graphManager.hasNodeProperty(token)) {
            throw new Error("no such token exist");
        }
    }

    private async initSingletonsValues() {
        const singletonNodes = createNodeFilter(
            this.graphManager,
            LIFESPAN.SINGLETON,
        );

        const getSingletonNeighbors = createNeighborFilter(
            this.graphManager,
            LIFESPAN.SINGLETON,
        );

        await initEagerlySingletons<TNode>({
            getSingletonPredecessors: (nodeId) => {
                return this.graphManager
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.getNodePropertyOrThrow(p)
                                .lifespan === LIFESPAN.SINGLETON,
                    );
            },
            createSingletonNodeValue: async (nodeId, args) => {
                const nodeProp =
                    this.graphManager.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.SINGLETON) {
                    throw new Error();
                }

                return await callInvokable(
                    nodeProp.service,
                    args,
                    this.settings.executionContext,
                );
            },
            singletonNodeIds: singletonNodes,
            getValue: (nodeId) => {
                const entry = this.registryManager.getOrThrow(nodeId);

                const node = this.graphManager.getNodePropertyOrThrow(nodeId);
                throwIfNodeHaveIncorrectLifespan(node, [LIFESPAN.SINGLETON]);

                if (entry.type !== REGISTER_VALUE_TYPE.DIRECT) {
                    throw new Error();
                }

                return entry.value;
            },
            saveSingletonValue: (nodeId, value) => {
                this.registryManager.currentScopedOrBaseRegistry().set(nodeId, {
                    value,
                    type: REGISTER_VALUE_TYPE.DIRECT,
                });
            },
            getAllNeighbors: (nodeId) => {
                return this.graphManager.getSuccessorsOf(nodeId);
            },
            getSingletonNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(this.graphManager),
        });
    }

    private async initTransientFactories() {
        const transientNodes = createNodeFilter(
            this.graphManager,
            LIFESPAN.TRANSIENT,
        );

        const getTransientNeighbors = createNeighborFilter(
            this.graphManager,
            LIFESPAN.TRANSIENT,
        );

        const reuse = createFunctionCache();

        await initEagerlyTransients<TNode>({
            getTransientPredecessors: (nodeId) => {
                return this.graphManager
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.getNodePropertyOrThrow(p)
                                .lifespan === LIFESPAN.TRANSIENT,
                    );
            },
            transientNodeIds: transientNodes,
            getArgIndexOfNode: getArgIndexOfNode(this.graphManager),
            createTransientFactoryFunc: (nodeId, inputFuncs) => {
                const nodeProp =
                    this.graphManager.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.TRANSIENT) {
                    throw new Error();
                }

                const func = async () => {
                    const resolvedInputs = await Promise.all(
                        inputFuncs.map((f) => f()),
                    );
                    return await callInvokable(
                        nodeProp.service,
                        resolvedInputs,
                        this.settings.executionContext,
                    );
                };

                return func;
            },
            getTransientNeighbors,
            getAllNeighbors: (nodeId) => {
                return this.graphManager.getSuccessorsOf(nodeId);
            },
            getValueGetter: (nodeId) => {
                const node = this.graphManager.getNodePropertyOrThrow(nodeId);

                throwIfNodeHaveIncorrectLifespan(node, [
                    LIFESPAN.SCOPED,
                    LIFESPAN.TRANSIENT,
                    LIFESPAN.SINGLETON,
                ]);

                if (node.lifespan === LIFESPAN.SCOPED) {
                    return reuse({
                        nodeId,
                        newFunc: async () => {
                            // scoped value do have key registry.manger until container.run is called
                            // so can not call getOrThrow outside
                            const result =
                                this.registryManager.getOrThrow(nodeId);

                            if (result.type !== REGISTER_VALUE_TYPE.DIRECT) {
                                throw new Error();
                            }

                            return Promise.resolve(result.value);
                        },
                    });
                }

                const result = this.registryManager.getOrThrow(nodeId);

                if (node.lifespan === LIFESPAN.SINGLETON) {
                    return reuse({
                        nodeId,
                        newFunc: () => Promise.resolve(result.value),
                    });
                }

                if (result.type !== REGISTER_VALUE_TYPE.FUNC) {
                    throw new Error();
                }
                return result.value;
            },

            saveTransientFactoryFunc: (nodeId, factoryFunc) => {
                this.registryManager.currentScopedOrBaseRegistry().set(nodeId, {
                    value: factoryFunc,
                    type: REGISTER_VALUE_TYPE.FUNC,
                });
            },
        });
    }

    private async initScopedValues() {
        const scopedNodes = createNodeFilter(
            this.graphManager,
            LIFESPAN.SCOPED,
        );

        const getScopedNeighbors = createNeighborFilter(
            this.graphManager,
            LIFESPAN.SCOPED,
        );

        await initEagerlyScoped<TNode>({
            getScopedPredecessors: (nodeId) => {
                return this.graphManager
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.getNodePropertyOrThrow(p)
                                .lifespan === LIFESPAN.SCOPED,
                    );
            },
            createScopedValue: async (nodeId, args) => {
                const nodeProp =
                    this.graphManager.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.SCOPED) {
                    throw new Error();
                }

                throwIfNodeHaveIncorrectLifespan(nodeProp, [LIFESPAN.SCOPED]);
                return await callInvokable(
                    nodeProp.service,
                    args,
                    this.settings.executionContext,
                );
            },

            scopedNodeIds: scopedNodes,

            getValue: (nodeId) => {
                const node = this.graphManager.getNodePropertyOrThrow(nodeId);
                const result = this.registryManager.getOrThrow(nodeId);

                throwIfNodeHaveIncorrectLifespan(node, [
                    LIFESPAN.SINGLETON,
                    LIFESPAN.SCOPED,
                    LIFESPAN.DYNAMIC,
                ]);

                throwIfValueIsStoredIncorrect(
                    result,
                    REGISTER_VALUE_TYPE.DIRECT,
                );

                return result.value;
            },
            saveScopedValue: (nodeId, value) => {
                this.registryManager
                    .currentScopedOrBaseRegistry()
                    .set(nodeId, { value, type: REGISTER_VALUE_TYPE.DIRECT });
            },
            getAllNeighbors: (nodeId) => {
                return this.graphManager.getSuccessorsOf(nodeId);
            },
            getScopedNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(this.graphManager),
        });
    }

    async init(): Promise<void> {
        this.throwIfContainerAlreadyInitialized(this.init.name);
        await this.initSingletonsValues();
        await this.initTransientFactories();
        this.state = IN_ACTIVE_STATE;

        if (this.initHandler !== null) {
            await callInvokable(this.initHandler, this);
        }
    }

    async deInit(): Promise<void> {
        this.throwIfContainerNotActive(this.deInit.name);

        if (this.deInitHandler !== null) {
            await callInvokable(this.deInitHandler, this);
        }
        this.state = AFTER_ACTIVE_STATE;
    }

    onContainerInit(handler: DiHook): void {
        if (this.state !== BEFORE_ACTIVE_STATE) {
            throw new Error("state not 0");
        }
        this.initHandler = handler;
    }

    onContainerDeInit(handler: DiHook): void {
        if (this.state !== BEFORE_ACTIVE_STATE) {
            throw new Error("state not 0");
        }
        this.deInitHandler = handler;
    }

    async run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        //this.throwIfContainerAlreadyInitialized(this.run.name);

        this.throwIfContainerNotActive(this.run.name);

        await this.settings.executionContext.run(async () => {
            const dynamicServiceRegister: IDynamicServiceRegister = {
                set: (dynSettings): Promise<void> => {
                    const currentScopedOrBaseRegistry =
                        this.registryManager.currentScopedOrBaseRegistry();

                    if (currentScopedOrBaseRegistry.has(dynSettings.token)) {
                        throw new Error();
                    }

                    currentScopedOrBaseRegistry.set(dynSettings.token, {
                        value: dynSettings.value,
                        type: REGISTER_VALUE_TYPE.DIRECT,
                    });

                    return Promise.resolve();
                },
            };

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

        const factory = settings.factory as ServiceFactory;

        const deps: Array<[TEdge, EdgeProps]> = [...settings.deps].map(
            (to, argIndex) => [[settings.token, to], { argIndex }],
        );

        let scope: undefined | Exclude<TLifespan, typeof LIFESPAN.DYNAMIC>;

        const throwErrorIfScopedAlreadySet = () => {
            if (scope !== undefined) {
                throw Error();
            }
        };

        return {
            scoped: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.SCOPED;

                this.graphManager.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.setEdgeProperty(edge, value);
                });
            },
            singleton: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.SINGLETON;

                this.graphManager.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.setEdgeProperty(edge, value);
                });
            },

            transient: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.TRANSIENT;

                this.graphManager.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.setEdgeProperty(edge, value);
                });
            },
        };
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
        this.graphManager.setNodeProperty(token, {
            lifespan: LIFESPAN.DYNAMIC,
        });
    }

    registerContext<TWhen = unknown, TNeeds = unknown>(
        settings: ContextRegistration<TWhen, TNeeds>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.registerContext.name);
        throw new Error("Method not implemented.");
    }

    registerProvider(provider: ServiceProvider): void {
        this.throwIfContainerAlreadyInitialized(this.registerProvider.name);
        throw new Error("Method not implemented.");
    }

    // TODO for lazy: throw if graph is invalid here
    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfContainerNotActive(this.resolve.name);
        //this.throwIfTokenNotRegistered(token);
        if (!this.registryManager.has(token)) {
            return null;
        }

        const canResolveTransient = createCanResolveTransientFunc<TNode>({
            getLifespan: (node) =>
                this.graphManager.getNodePropertyOrThrow(node).lifespan,
            getNeighbors: (node) => {
                return this.graphManager.getSuccessorsOf(node);
            },
        });

        const scopeDepth = this.registryManager.currentScopeDepthOrZero();

        const lifespan =
            this.graphManager.getNodePropertyOrThrow(token).lifespan;
        if (lifespan === LIFESPAN.SINGLETON) {
            return await Promise.resolve(
                (this.registryManager.get(token)?.value ??
                    null) as TType | null,
            );
        } else if (lifespan === LIFESPAN.TRANSIENT) {
            if (!canResolveTransient(token, scopeDepth === 0)) {
                return null;
            }
            const valueWrapper = this.registryManager.get(token);
            if (valueWrapper === null) {
                throw new Error();
            }
            if (valueWrapper.type !== REGISTER_VALUE_TYPE.FUNC) {
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
        // TODO ask yousef correct behavior?
        // should be enable to call has before and after init since only looking up nodes and not values?
        this.throwIfContainerNotActive(this.resolveOrFail.name);
        // TODO remove later
        await Promise.resolve();

        return this.graphManager.hasNodeProperty(token);
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

        const possibleToOverride = this.graphManager.hasNodeProperty(
            settings.token,
        );

        // TODO check new graph is good (no cycle, edge valid and so on)
        if (!possibleToOverride) {
            throw new Error();
        }

        const nodeProps = this.graphManager.getNodePropertyOrThrow(
            settings.token,
        );

        if (nodeProps.lifespan === LIFESPAN.DYNAMIC) {
            throw new Error();
        }

        const factory = settings.factory as ServiceFactory;

        this.graphManager.setNodePropertyInOverrideLayer(settings.token, {
            lifespan: nodeProps.lifespan,
            service: factory,
        });

        const edgesToBeDeleted = this.graphManager.getSuccessorEdgesOf(
            settings.token,
        );

        // remove old edges
        edgesToBeDeleted.forEach((edge) => {
            this.graphManager.removeEdgeFromOverrideLayer(edge);
        });

        const newEdgesToBeAdded: Array<[TEdge, EdgeProps]> = [
            ...settings.deps,
        ].map((to, argIndex) => [[settings.token, to], { argIndex }]);

        // new edges added
        newEdgesToBeAdded.forEach(([edge, value]) => {
            this.graphManager.setEdgePropertyInOverrideLayer(edge, value);
        });
    }

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideClass.name);
        throw new Error("Method not implemented.");
    }

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfContainerAlreadyInitialized(this.overrideValue.name);
        throw new Error("Method not implemented.");
    }

    fork(): IContainer {
        // this.throwIfContainerNotActive(this.fork.name);
        throw new Error("Method not implemented.");
    }
}
