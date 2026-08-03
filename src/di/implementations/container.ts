import {
    genericToken,
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
    eagerInitialization,
    findEffectedNodes,
    Graph,
    LIFESPAN,
    type TEdge,
    type TLifespan,
    type TNode,
} from "@/di/implementations/graph.js";
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

const BEFORE_READY = Symbol("container.init not called yet");
const READY = Symbol("container.init called but deInit not called yet");
const AFTER_READY = Symbol("container.deInit called");

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

type OverriddenNodeProps = {
    service: ServiceFactory;
};

type TState = typeof BEFORE_READY | typeof READY | typeof AFTER_READY;

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

type JustRegistryValueOf<T extends TLifespan> = Extract<
    RegistryValue,
    { lifespan: T }
>;

export function createRegistryValueGetter<T>(args: {
    getLifespan: (nodeId: T) => TLifespan;
    getSingletonValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getScopedValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getDynamicValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getTransientFactoryValueOrThrowIfNotExist: (
        nodeId: T,
    ) => () => Promise<unknown>;
}): (nodeId: T) => RegistryValue {
    return (nodeId: T) => {
        switch (args.getLifespan(nodeId)) {
            case LIFESPAN.SINGLETON: {
                return {
                    value: args.getSingletonValueOrThrowIfNotExist(nodeId),
                    type: "direct",
                    lifespan: LIFESPAN.SINGLETON,
                };
            }

            case LIFESPAN.TRANSIENT: {
                const factory =
                    args.getTransientFactoryValueOrThrowIfNotExist(nodeId);
                return {
                    value: factory,
                    type: "function",
                    lifespan: LIFESPAN.TRANSIENT,
                };
            }

            case LIFESPAN.SCOPED:
                return {
                    value: args.getScopedValueOrThrowIfNotExist(nodeId),
                    type: "direct",
                    lifespan: LIFESPAN.SCOPED,
                };
            case LIFESPAN.DYNAMIC:
                return {
                    value: args.getDynamicValueOrThrowIfNotExist(nodeId),
                    type: "direct",
                    lifespan: LIFESPAN.DYNAMIC,
                };

            default:
                throw new Error(`Unknown or unhandled node type for node.`);
        }
    };
}

type TGetter = () => Promise<unknown>;
function createGetterCache() {
    const functionCache = new Map<TNode, TGetter>();

    const reuseGetter = (cacheArgs: {
        nodeId: TNode;
        newFunc: TGetter;
    }): TGetter => {
        const cachedFunc = functionCache.get(cacheArgs.nodeId);

        const isCachedAlready = cachedFunc !== undefined;

        if (isCachedAlready) {
            return cachedFunc;
        }

        functionCache.set(cacheArgs.nodeId, cacheArgs.newFunc);

        return cacheArgs.newFunc;
    };

    return reuseGetter;
}

export function createNeighborFilter(
    graph: Graph<NodeProps, EdgeProps>,
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

export function getArgIndexOfNode(graph: Graph<NodeProps, EdgeProps>) {
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
    graph: Graph<NodeProps, EdgeProps>,
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

class Registry<T> {
    private map = new Map<DiToken, T>();

    constructor(private parent?: Registry<T> | (() => Registry<T>)) {}

    private getParent(): Registry<T> | undefined {
        if (this.parent === undefined) {
            return undefined;
        } else if (this.parent instanceof Registry) {
            return this.parent;
        } else {
            return this.parent();
        }
    }

    /** Whether the token exists in this layer or any parent layer. */
    public has(token: DiToken): boolean {
        return this.map.has(token) || (this.getParent()?.has(token) ?? false);
    }

    /** Returns the value for the token from the nearest layer.
     * Checks the current layer first; if not found, delegates to the parent.
     * Returns `null` if the token is not found in any layer.
     * Always converts `undefined` to `null`. */
    public get(token: DiToken): T | null {
        if (this.map.has(token)) {
            const value = this.map.get(token);
            return value === undefined ? null : value;
        }
        return this.getParent()?.get(token) ?? null;
    }

    public getOrThrow(token: DiToken): T {
        if (!this.has(token)) {
            throw new Error();
        }

        const value = this.get(token);

        if (value === null) {
            throw new Error();
        }

        return value;
    }

    /** Sets the value for the token in this layer. */
    public set(token: DiToken, value: T): void {
        this.map.set(token, value);
    }
}

type TCurrentRegistry<T> = {
    get(): Registry<T> | null;
    set(registry: Registry<T>): void;
};

type TCurrentLevel = {
    get(): number | null;
    set(registry: number): void;
};

class RegistryManager<T> {
    public baseRegistry: Registry<T> = new Registry<T>();
    public overrideRegistry: Registry<T>;

    public currentScopedOrBaseRegistry(): Registry<T> {
        const scopedRegistry = this.args.currentScopedRegistry.get();
        const noScopedRegistry = scopedRegistry === null;
        if (noScopedRegistry) {
            return this.baseRegistry;
        }

        return scopedRegistry;
    }

    public currentScopeDepthOrZero(): number {
        const scopeDepth = this.args.currentScopeDepth.get();
        const scopeDepthIsZero = scopeDepth === null;

        if (scopeDepthIsZero) {
            return 0;
        }
        return scopeDepth;
    }

    constructor(
        private args: {
            currentScopedRegistry: TCurrentRegistry<T>;
            currentScopeDepth: TCurrentLevel;
        },
    ) {
        this.overrideRegistry = new Registry<T>(() =>
            this.currentScopedOrBaseRegistry(),
        );
    }

    // inside new run
    public initNewScope(): void {
        const oldLayer: Registry<T> = this.currentScopedOrBaseRegistry();

        const level = this.currentScopeDepthOrZero();

        const newLayer = new Registry(oldLayer);
        this.args.currentScopedRegistry.set(newLayer);
        this.args.currentScopeDepth.set(level + 1);
    }
}

type RegistryObject<T> = ReturnType<typeof setUpRegistryManger<T>>;

function setUpRegistryManger<T>(executionContext: IExecutionContext) {
    const SCOPE_DEPTH_KEY = genericToken<number>(
        "the depth level associated with current scope",
    );
    const REGISTRY_KEY = genericToken<Registry<T>>(
        "the registry  associated with current scope",
    );

    const manger = new RegistryManager<T>({
        currentScopeDepth: {
            get: () => executionContext.get(SCOPE_DEPTH_KEY),
            set: (depth) => executionContext.put(SCOPE_DEPTH_KEY, depth),
        },

        currentScopedRegistry: {
            get: () => executionContext.get(REGISTRY_KEY),
            set: (registry) => executionContext.put(REGISTRY_KEY, registry),
        },
    });

    return {
        manger,
        keys: {
            SCOPE_DEPTH_KEY,
            REGISTRY_KEY,
        },
    };
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

class GraphManager<TNodeProps, TEdgeProps> {
    public baseGraph = new Graph<TNodeProps, TEdgeProps>();
    public overrideGraph = new Graph<TNodeProps, TEdgeProps>({
        parentGraph: this.baseGraph,
    });
}

export class Container implements IContainer {
    private graphManager = new GraphManager<NodeProps, EdgeProps>();

    private registry: RegistryObject<TRegisterValue>;
    private initHandler: DiHook | null = null;
    private deInitHandler: DiHook | null = null;
    private state: TState = BEFORE_READY;

    constructor(private readonly settings: ContainerSettings) {
        this.registry = setUpRegistryManger<TRegisterValue>(
            this.settings.executionContext,
        );
    }

    private throwIfStateNotReady() {
        if (this.state !== READY) {
            throw new Error("illegal method call before container.init");
        }
    }
    private throwIfStateNotBeforeReady() {
        if (this.state !== BEFORE_READY) {
            throw new Error("illegal method call after container.init");
        }
    }

    private throwIfStateNotAfterReady() {
        if (this.state !== AFTER_READY) {
            throw new Error("illegal method call before container.deInit");
        }
    }

    private throwIfTokenAlreadyRegistered(token: DiToken) {
        if (this.graphManager.overrideGraph.hasNodeProperty(token)) {
            throw new Error("double registered node");
        }
    }

    private throwIfTokenNotRegistered(token: DiToken) {
        if (!this.graphManager.overrideGraph.hasNodeProperty(token)) {
            throw new Error("no such token exist");
        }
    }

    private async initSingletonsValues() {
        const singletonNodes = createNodeFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.SINGLETON,
        );

        const getSingletonNeighbors = createNeighborFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.SINGLETON,
        );

        await initEagerlySingletons<TNode>({
            getSingletonPredecessors: (nodeId) => {
                return this.graphManager.overrideGraph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.overrideGraph.getNodePropertyOrThrow(
                                p,
                            ).lifespan === LIFESPAN.SINGLETON,
                    );
            },
            createSingletonNodeValue: async (nodeId, args) => {
                const nodeProp =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );
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
                const entry =
                    this.registry.manger.overrideRegistry.getOrThrow(nodeId);

                const node =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );
                throwIfNodeHaveIncorrectLifespan(node, [LIFESPAN.SINGLETON]);

                if (entry.type !== REGISTER_VALUE_TYPE.DIRECT) {
                    throw new Error();
                }

                return entry.value;
            },
            saveSingletonValue: (nodeId, value) => {
                this.registry.manger.currentScopedOrBaseRegistry().set(nodeId, {
                    value,
                    type: REGISTER_VALUE_TYPE.DIRECT,
                });
            },
            getAllNeighbors: (nodeId) => {
                return this.graphManager.overrideGraph.getSuccessorsOf(nodeId);
            },
            getSingletonNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(
                this.graphManager.overrideGraph,
            ),
        });
    }

    private async initTransientFactories() {
        const transientNodes = createNodeFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.TRANSIENT,
        );

        const getTransientNeighbors = createNeighborFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.TRANSIENT,
        );

        const reuse = createGetterCache();

        await initEagerlyTransients<TNode>({
            getTransientPredecessors: (nodeId) => {
                return this.graphManager.overrideGraph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.overrideGraph.getNodePropertyOrThrow(
                                p,
                            ).lifespan === LIFESPAN.TRANSIENT,
                    );
            },
            transientNodeIds: transientNodes,
            getArgIndexOfNode: getArgIndexOfNode(
                this.graphManager.overrideGraph,
            ),
            createTransientFactoryFunc: (nodeId, inputFuncs) => {
                const nodeProp =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );
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
                return this.graphManager.overrideGraph.getSuccessorsOf(nodeId);
            },
            getValueGetter: (nodeId) => {
                const node =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );

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
                                this.registry.manger.overrideRegistry.getOrThrow(
                                    nodeId,
                                );

                            if (result.type !== REGISTER_VALUE_TYPE.DIRECT) {
                                throw new Error();
                            }

                            return Promise.resolve(result.value);
                        },
                    });
                }

                const result =
                    this.registry.manger.overrideRegistry.getOrThrow(nodeId);

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
                this.registry.manger.currentScopedOrBaseRegistry().set(nodeId, {
                    value: factoryFunc,
                    type: REGISTER_VALUE_TYPE.FUNC,
                });
            },
        });
    }

    private async initScopedValues() {
        const scopedNodes = createNodeFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.SCOPED,
        );

        const getScopedNeighbors = createNeighborFilter(
            this.graphManager.overrideGraph,
            LIFESPAN.SCOPED,
        );

        await initEagerlyScoped<TNode>({
            getScopedPredecessors: (nodeId) => {
                return this.graphManager.overrideGraph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graphManager.overrideGraph.getNodePropertyOrThrow(
                                p,
                            ).lifespan === LIFESPAN.SCOPED,
                    );
            },
            createScopedValue: async (nodeId, args) => {
                const nodeProp =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );
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
                const node =
                    this.graphManager.overrideGraph.getNodePropertyOrThrow(
                        nodeId,
                    );
                const result =
                    this.registry.manger.overrideRegistry.getOrThrow(nodeId);

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
                this.registry.manger
                    .currentScopedOrBaseRegistry()
                    .set(nodeId, { value, type: REGISTER_VALUE_TYPE.DIRECT });
            },
            getAllNeighbors: (nodeId) => {
                return this.graphManager.overrideGraph.getSuccessorsOf(nodeId);
            },
            getScopedNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(
                this.graphManager.overrideGraph,
            ),
        });
    }

    async init(): Promise<void> {
        this.throwIfStateNotBeforeReady();
        await this.initSingletonsValues();
        await this.initTransientFactories();
        this.state = READY;

        if (this.initHandler !== null) {
            await callInvokable(this.initHandler, this);
        }
    }

    async deInit(): Promise<void> {
        this.throwIfStateNotReady();

        if (this.deInitHandler !== null) {
            await callInvokable(this.deInitHandler, this);
        }
        this.state = AFTER_READY;
    }

    onContainerInit(handler: DiHook): void {
        if (this.state !== BEFORE_READY) {
            throw new Error("state not 0");
        }
        this.initHandler = handler;
    }

    onContainerDeInit(handler: DiHook): void {
        if (this.state !== BEFORE_READY) {
            throw new Error("state not 0");
        }
        this.deInitHandler = handler;
    }

    async run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        this.throwIfStateNotReady();

        await this.settings.executionContext.run(async () => {
            const dynamicServiceRegister: IDynamicServiceRegister = {
                set: (dynSettings): Promise<void> => {
                    const currentScopedOrBaseRegistry =
                        this.registry.manger.currentScopedOrBaseRegistry();

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

            this.registry.manger.initNewScope();

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
        this.throwIfStateNotBeforeReady();
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

                this.graphManager.baseGraph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.baseGraph.setEdgeProperty(edge, value);
                });
            },
            singleton: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.SINGLETON;

                this.graphManager.baseGraph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.baseGraph.setEdgeProperty(edge, value);
                });
            },

            transient: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.TRANSIENT;

                this.graphManager.baseGraph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graphManager.baseGraph.setEdgeProperty(edge, value);
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
        this.throwIfStateNotBeforeReady();
        this.graphManager.overrideGraph.setNodeProperty(token, {
            lifespan: LIFESPAN.DYNAMIC,
        });
    }

    registerContext<TWhen = unknown, TNeeds = unknown>(
        settings: ContextRegistration<TWhen, TNeeds>,
    ): void {
        this.throwIfStateNotBeforeReady();
        throw new Error("Method not implemented.");
    }

    registerProvider(provider: ServiceProvider): void {
        this.throwIfStateNotBeforeReady();
        throw new Error("Method not implemented.");
    }

    // TODO for lazy: throw if graph is invalid here
    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfStateNotReady();
        //this.throwIfTokenNotRegistered(token);
        if (!this.registry.manger.overrideRegistry.has(token)) {
            return null;
        }

        const canResolveTransient = createCanResolveTransientFunc<TNode>({
            getLifespan: (node) =>
                this.graphManager.overrideGraph.getNodePropertyOrThrow(node)
                    .lifespan,
            getNeighbors: (node) => {
                return this.graphManager.overrideGraph.getSuccessorsOf(node);
            },
        });

        const scopeDepth = this.registry.manger.currentScopeDepthOrZero();

        const lifespan =
            this.graphManager.overrideGraph.getNodePropertyOrThrow(
                token,
            ).lifespan;
        if (lifespan === LIFESPAN.SINGLETON) {
            return await Promise.resolve(
                (this.registry.manger.overrideRegistry.get(token)?.value ??
                    null) as TType | null,
            );
        } else if (lifespan === LIFESPAN.TRANSIENT) {
            if (!canResolveTransient(token, scopeDepth === 0)) {
                return null;
            }
            const valueWrapper =
                this.registry.manger.overrideRegistry.get(token);
            if (valueWrapper === null) {
                throw new Error();
            }
            if (valueWrapper.type !== REGISTER_VALUE_TYPE.FUNC) {
                throw new Error();
            }

            const factory = valueWrapper.value;

            return (await factory()) as TType | null;
        } else if (lifespan === LIFESPAN.SCOPED && scopeDepth > 0) {
            return this.registry.manger.overrideRegistry.get(token)
                ?.value as TType | null;
        }

        if (scopeDepth > 0 && lifespan === LIFESPAN.DYNAMIC) {
            return this.registry.manger.overrideRegistry.get(token)
                ?.value as TType | null;
        }

        throw new Error("Method not implemented.");
    }

    async resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        this.throwIfStateNotReady();
        const value = await this.resolve(token);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }

    async resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        this.throwIfStateNotReady();
        const value = await this.resolve(token);
        if (value === null) {
            throw Error();
        }
        return value;
    }

    async has(token: DiToken): Promise<boolean> {
        return Promise.resolve(
            this.graphManager.baseGraph.hasNodeProperty(token),
        );
    }

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        this.throwIfStateNotBeforeReady();

        // can be called at top level unscoped
        if (this.registry.manger.currentScopeDepthOrZero() !== 0) {
            throw new Error();
        }

        const possibleToOverride =
            this.graphManager.overrideGraph.hasNodeProperty(settings.token);

        // TODO check new graph is good (no cycle, edge valid and so on)
        if (!possibleToOverride) {
            throw new Error();
        }

        const nodeProps =
            this.graphManager.overrideGraph.getNodePropertyOrThrow(
                settings.token,
            );

        if (nodeProps.lifespan === LIFESPAN.DYNAMIC) {
            throw new Error();
        }

        const factory = settings.factory as ServiceFactory;

        this.graphManager.overrideGraph.setNodeProperty(settings.token, {
            lifespan: nodeProps.lifespan,
            service: factory,
        });

        const edgesToBeDeleted =
            this.graphManager.overrideGraph.getSuccessorEdgesOf(settings.token);

        // remove old edges
        edgesToBeDeleted.forEach((edge) => {
            this.graphManager.overrideGraph.removeEdge(edge);
        });

        const newEdgesToBeAdded: Array<[TEdge, EdgeProps]> = [
            ...settings.deps,
        ].map((to, argIndex) => [[settings.token, to], { argIndex }]);

        // new edges added
        newEdgesToBeAdded.forEach(([edge, value]) => {
            this.graphManager.overrideGraph.setEdgeProperty(edge, value);
        });

        // const effectedNodes = findEffectedNodes<TNode>({
        //     predecessorOf: (node) => {
        //         return this.graphManager.overrideGraph.getPredecessorsOf(node);
        //     },
        //     startNodeId: settings.token,
        // });

        // const singletonEffectedNodes = effectedNodes.filter(
        //     (node) =>
        //         this.graphManager.overrideGraph.getNodePropertyOrThrow(node)
        //             .lifespan === LIFESPAN.SINGLETON,
        // );

        // const transientEffectedNodes = effectedNodes.filter(
        //     (node) =>
        //         this.graphManager.overrideGraph.getNodePropertyOrThrow(node)
        //             .lifespan === LIFESPAN.TRANSIENT,
        // );

        // const singletonEffectedNodesSet = new Set(singletonEffectedNodes);
        // const transientEffectedNodesSet = new Set(transientEffectedNodes);

        // // -------------- start helper functions ----------------
        // // TODO refactor helper functions to used everywhere instead of copy paste
        // const getArgIndexOfNodeFunc = getArgIndexOfNode(
        //     this.graphManager.overrideGraph,
        // );

        // const getValue = (nodeId: TNode) => {
        //     const node =
        //         this.graphManager.overrideGraph.getNodePropertyOrThrow(nodeId);
        //     const result =
        //         this.registry.manger.overrideRegistry.getOrThrow(nodeId);

        //     throwIfNodeHaveIncorrectLifespan(node, [LIFESPAN.SINGLETON]);

        //     throwIfValueIsStoredIncorrect(result, REGISTER_VALUE_TYPE.DIRECT);

        //     return result.value;
        // };

        // const createSingletonNodeValue = async (
        //     nodeId: TNode,
        //     args: Array<unknown>,
        // ) => {
        //     const nodeProp =
        //         this.graphManager.overrideGraph.getNodePropertyOrThrow(nodeId);
        //     if (nodeProp.lifespan !== LIFESPAN.SINGLETON) {
        //         throw new Error();
        //     }

        //     return await callInvokable(
        //         nodeProp.service,
        //         args,
        //         this.settings.executionContext,
        //     );
        // };

        // const saveSingletonValue = (nodeId: TNode, value: unknown) => {
        //     this.registry.manger.currentScopedOrBaseRegistry().set(nodeId, {
        //         value,
        //         type: REGISTER_VALUE_TYPE.DIRECT,
        //     });
        // };
        // // -------------- start  helper functions ----------------
        // await eagerInitialization<TNode>({
        //     nodeIds: [settings.token],
        //     getPredecessors: (nodeId) => {
        //         const predecessor =
        //             this.graphManager.overrideGraph.getPredecessorsOf(nodeId);

        //         const singletonPredecessors = predecessor.filter(
        //             (node) =>
        //                 this.graphManager.overrideGraph.getNodePropertyOrThrow(
        //                     node,
        //                 ).lifespan === LIFESPAN.SINGLETON,
        //         );

        //         return singletonPredecessors;
        //     },
        //     getSuccessors: (nodeId) => {
        //         const successors =
        //             this.graphManager.overrideGraph.getSuccessorsOf(nodeId);

        //         // should never be true unless graph validation is broken
        //         // TODO remove later
        //         successors.forEach((item) => {
        //             if (
        //                 this.graphManager.overrideGraph.getNodePropertyOrThrow(
        //                     item,
        //                 ).lifespan !== LIFESPAN.SINGLETON
        //             ) {
        //                 throw new Error();
        //             }
        //         });

        //         const effectedSuccessors = successors.filter((item) =>
        //             singletonEffectedNodesSet.has(item),
        //         );

        //         return effectedSuccessors;
        //     },
        //     initNode: async (nodeId) => {
        //         // const neighborNodeIds = args
        //         //     .getSingletonNeighbors(nodeId)
        //         //     .map((neighborId) => ({
        //         //         neighborId,
        //         //         argIndex: args.getArgIndexOfNode(nodeId, neighborId),
        //         //     }));

        //         const neighborNodeIds = this.graphManager.overrideGraph
        //             .getSuccessorsOf(nodeId)
        //             .filter(
        //                 (p) =>
        //                     this.graphManager.overrideGraph.getNodePropertyOrThrow(
        //                         p,
        //                     ).lifespan === LIFESPAN.SINGLETON,
        //             )
        //             .map((neighborId) => ({
        //                 neighborId,
        //                 argIndex: getArgIndexOfNodeFunc(nodeId, neighborId),
        //             }));

        //         const argsWithIndex = neighborNodeIds.map((item) => ({
        //             index: item.argIndex,
        //             value: getValue(item.neighborId),
        //         }));

        //         const correctlySortedArgs = argsWithIndex
        //             .sort((itemA, itemB) => itemA.index - itemB.index)
        //             .map((item) => item.value);

        //         const value = await createSingletonNodeValue(
        //             nodeId,
        //             correctlySortedArgs,
        //         );
        //         saveSingletonValue(nodeId, value);
        //     },
        // });

        // put in override version of graph
        // put in override version of register
    }

    overrideClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): void {
        this.throwIfStateNotReady();
        throw new Error("Method not implemented.");
    }

    overrideValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfStateNotReady();
        throw new Error("Method not implemented.");
    }

    fork(): IContainer {
        this.throwIfStateNotReady();
        throw new Error("Method not implemented.");
    }
}
