import {
    genericToken,
    type ClassRegistration,
    type ContextRegistration,
    type DiHook,
    type DiToken,
    type FactoryRegistration,
    type IContainer,
    type IServiceLifetime,
    type RunSettings,
    type ServiceFactory,
    type ServiceProvider,
    type ValueRegistration,
} from "@/di/contracts/_module.js";
import {
    eagerInitialization,
    Graph,
    type TEdge,
    type TLifespan,
    type TNode,
} from "@/di/implementations/graph.js";
import { LIFESPAN } from "@/di/implementations/ref/graph2_ref.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { callInvokable, isInvokableObject } from "@/utilities/_module.js";

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
    getPredecessors: (nodeId: T) => Array<T>;
    singletonNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization({
        getSuccessors: args.getSingletonNeighbors,
        getPredecessors: args.getPredecessors,
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
    getPredecessors: (nodeId: T) => Array<T>;

    transientNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization({
        getSuccessors: args.getTransientNeighbors,
        getPredecessors: args.getPredecessors,
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
    getPredecessors: (nodeId: T) => Array<T>;

    scopedNodeIds: Array<T>;
}): Promise<void> {
    await eagerInitialization({
        getSuccessors: args.getScopedNeighbors,
        getPredecessors: args.getPredecessors,
        initNode: (nodeId) => {
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

            const func = args.createScopedValue(
                nodeId,
                correctlySortedArgsGetter,
            );
            args.saveScopedValue(nodeId, func);
        },

        nodeIds: args.scopedNodeIds,
    });
}

export type ValueResult =
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

export function createRegistryValueGetter<T>(args: {
    getLifespan: (nodeId: T) => TLifespan;

    getSingletonValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getScopedValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getDynamicValueOrThrowIfNotExist: (nodeId: T) => unknown;
    getTransientFactoryValueOrThrowIfNotExist: (
        nodeId: T,
    ) => () => Promise<unknown>;
}): (nodeId: T) => ValueResult {
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
    return (nodeId: TNode, depsId: TNode) => {
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
        .nodeEntriesOrThrowIfNull()
        .filter(([_, value]) => value.lifespan === lifeSpan)
        .map(([nodeId]) => nodeId);
    return nodes;
}

class DynamicMapRef {
    private map = new Map<DiToken, unknown>();
    constructor(private parent?: DynamicMapRef) {}

    /** Whether the token exists in this layer only (ignores parent). */
    public hasAtCurrentLayer(token: DiToken): boolean {
        return this.map.has(token);
    }

    /** Whether the token exists in this layer or any parent layer. */
    public has(token: DiToken): boolean {
        return this.map.has(token) || (this.parent?.has(token) ?? false);
    }

    /** Returns the value for the token from the nearest layer.
     * Checks the current layer first; if not found, delegates to the parent.
     * Returns `null` if the token is not found in any layer.
     * Always converts `undefined` to `null`. */
    public get(token: DiToken): unknown {
        if (this.hasAtCurrentLayer(token)) {
            const value = this.map.get(token);
            return value === undefined ? null : value;
        }
        return this.parent?.get(token) ?? null;
    }

    /** Returns the value from this layer only, or `null` if not set.
     * Does NOT consult parent layers.
     * Always converts `undefined` to `null`. */
    public getFromCurrentLayer(token: DiToken): unknown {
        const value = this.map.get(token);
        return value === undefined ? null : value;
    }

    /** Sets the value for the token in this layer. */
    public addToCurrentLayer(token: DiToken, value: unknown): void {
        this.map.set(token, value);
    }
}

const DYNAMIC_VALUE_REGISTRY_KEY = genericToken<DynamicMapRef>("");

export class Container implements IContainer {
    private graph = Graph.empty<NodeProps, EdgeProps>();
    private overrideServices = Graph.empty<OverriddenNodeProps, EdgeProps>();

    private scopedValueRegistry = new Map<DiToken, unknown>();
    private singletonValueRegistry = new Map<DiToken, unknown>();
    private getDynamicNodeValueRegistry = () =>
        this.settings.executionContext.getOrFail(DYNAMIC_VALUE_REGISTRY_KEY);
    private nodeTransientServiceFactory = new Map<
        DiToken,
        () => Promise<unknown>
    >();
    private initHandler: DiHook | null = null;
    private deInitHandler: DiHook | null = null;
    private state: TState = BEFORE_READY;

    private getValue = createRegistryValueGetter<TNode>({
        getLifespan: (nodeId) =>
            this.graph.getNodePropertyOrThrow(nodeId).lifespan,

        getDynamicValueOrThrowIfNotExist: (nodeId) => {
            if (!this.getDynamicNodeValueRegistry().has(nodeId)) {
                throw new Error();
            }

            return this.getDynamicNodeValueRegistry().get(nodeId);
        },
        getScopedValueOrThrowIfNotExist: (nodeId) => {
            if (!this.scopedValueRegistry.has(nodeId)) {
                throw new Error();
            }

            return this.scopedValueRegistry.get(nodeId);
        },
        getSingletonValueOrThrowIfNotExist: (nodeId) => {
            if (!this.singletonValueRegistry.has(nodeId)) {
                throw new Error();
            }

            return this.singletonValueRegistry.get(nodeId);
        },
        getTransientFactoryValueOrThrowIfNotExist: (nodeId) => {
            if (!this.nodeTransientServiceFactory.has(nodeId)) {
                throw new Error();
            }
            const value = this.nodeTransientServiceFactory.get(nodeId);
            if (value === undefined) {
                throw new Error();
            }

            return value;
        },
    });

    constructor(private readonly settings: ContainerSettings) {
        this.settings.executionContext.put(
            DYNAMIC_VALUE_REGISTRY_KEY,
            new DynamicMapRef(),
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
        if (this.graph.hasNodeProperty(token)) {
            throw new Error("double registered node");
        }
    }

    private throwIfTokenNotRegistered(token: DiToken) {
        if (!this.graph.hasNodeProperty(token)) {
            throw new Error("no such token exist");
        }
    }

    private async initSingletonsValues() {
        const singletonNodes = createNodeFilter(this.graph, LIFESPAN.SINGLETON);

        const getSingletonNeighbors = createNeighborFilter(
            this.graph,
            LIFESPAN.SINGLETON,
        );

        await initEagerlySingletons<TNode>({
            getPredecessors: (nodeId) => {
                return this.graph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graph.getNodePropertyOrThrow(p).lifespan ===
                            LIFESPAN.SINGLETON,
                    );
            },
            createSingletonNodeValue: async (nodeId, args) => {
                const nodeProp = this.graph.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.SINGLETON) {
                    throw new Error();
                }

                return await callInvokable(
                    nodeProp.service,
                    ...args,
                    this.settings.executionContext,
                );
            },
            singletonNodeIds: singletonNodes,
            getValue: (nodeId) => {
                const result = this.getValue(nodeId);
                if (result.lifespan !== LIFESPAN.SINGLETON) {
                    throw new Error();
                }

                return result.value;
            },
            saveSingletonValue: (nodeId, value) => {
                this.singletonValueRegistry.set(nodeId, value);
            },
            getAllNeighbors: (nodeId) => {
                return this.graph.getSuccessorsOf(nodeId);
            },
            getSingletonNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(this.graph),
        });
    }

    private async initTransientFactories() {
        const transientNodes = createNodeFilter(this.graph, LIFESPAN.TRANSIENT);

        const getTransientNeighbors = createNeighborFilter(
            this.graph,
            LIFESPAN.TRANSIENT,
        );

        const reuse = createGetterCache();

        await initEagerlyTransients<TNode>({
            getPredecessors: (nodeId) => {
                return this.graph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graph.getNodePropertyOrThrow(p).lifespan ===
                            LIFESPAN.TRANSIENT,
                    );
            },
            transientNodeIds: transientNodes,
            getArgIndexOfNode: getArgIndexOfNode(this.graph),
            createTransientFactoryFunc: (nodeId, inputFuncs) => {
                const nodeProp = this.graph.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.TRANSIENT) {
                    throw new Error();
                }

                const func = async () => {
                    const resolvedInputs = await Promise.all(
                        inputFuncs.map((f) => f()),
                    );
                    return await callInvokable(
                        nodeProp.service,
                        ...resolvedInputs,
                        this.settings.executionContext,
                    );
                };

                return func;
            },
            getTransientNeighbors,
            getAllNeighbors: (nodeId) => {
                return this.graph.getSuccessorsOf(nodeId);
            },
            getValueGetter: (nodeId) => {
                const result = this.getValue(nodeId);
                const lifespan = result.lifespan;
                const validDependency =
                    lifespan === LIFESPAN.SINGLETON ||
                    lifespan === LIFESPAN.SCOPED ||
                    lifespan === LIFESPAN.TRANSIENT;

                if (!validDependency) {
                    throw new Error();
                }

                if (result.lifespan !== LIFESPAN.TRANSIENT) {
                    return reuse({
                        nodeId,
                        newFunc: () => Promise.resolve(result.value),
                    });
                }
                return result.value;
            },

            saveTransientFactoryFunc: (nodeId, factoryFunc) => {
                this.nodeTransientServiceFactory.set(nodeId, factoryFunc);
            },
        });
    }

    private async initScopedValues() {
        const scopedNodes = createNodeFilter(this.graph, LIFESPAN.SCOPED);

        const getScopedNeighbors = createNeighborFilter(
            this.graph,
            LIFESPAN.SCOPED,
        );

        await initEagerlyScoped<TNode>({
            getPredecessors: (nodeId) => {
                return this.graph
                    .getPredecessorsOf(nodeId)
                    .filter(
                        (p) =>
                            this.graph.getNodePropertyOrThrow(p).lifespan ===
                            LIFESPAN.SCOPED,
                    );
            },
            createScopedValue: async (nodeId, args) => {
                const nodeProp = this.graph.getNodePropertyOrThrow(nodeId);
                if (nodeProp.lifespan !== LIFESPAN.SCOPED) {
                    throw new Error();
                }

                return await callInvokable(
                    nodeProp.service,
                    ...args,
                    this.settings.executionContext,
                );
            },
            scopedNodeIds: scopedNodes,
            getValue: (nodeId) => {
                const result = this.getValue(nodeId);
                const lifespan = result.lifespan;

                const validDependency =
                    lifespan === LIFESPAN.SINGLETON ||
                    lifespan === LIFESPAN.SCOPED ||
                    lifespan === LIFESPAN.DYNAMIC;

                if (!validDependency) {
                    throw new Error();
                }

                return result.value;
            },
            saveScopedValue: (nodeId, value) => {
                this.scopedValueRegistry.set(nodeId, value);
            },
            getAllNeighbors: (nodeId) => {
                return this.graph.getSuccessorsOf(nodeId);
            },
            getScopedNeighbors,
            getArgIndexOfNode: getArgIndexOfNode(this.graph),
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

    run<TValue = void>(settings: RunSettings<TValue>): Promise<void> {
        this.throwIfStateNotReady();
        //throw new Error("Method not implemented.");

        const currentLayer = this.settings.executionContext.getOrFail(
            DYNAMIC_VALUE_REGISTRY_KEY,
        );

        this.settings.executionContext.run(() => {
            const childLayer = currentLayer;
            this.settings.executionContext.put(
                DYNAMIC_VALUE_REGISTRY_KEY,
                new DynamicMapRef(childLayer),
            );
        });
    }

    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): IServiceLifetime {
        this.throwIfStateNotBeforeReady();
        this.throwIfTokenAlreadyRegistered(settings.token);

        const factory = settings.factory;

        if (!isInvokableObject(factory)) {
            throw new Error();
        }

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

                this.graph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graph.setEdgeProperty(edge, value);
                });
            },
            singleton: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.SINGLETON;

                this.graph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graph.setEdgeProperty(edge, value);
                });
            },

            transient: () => {
                throwErrorIfScopedAlreadySet();
                scope = LIFESPAN.TRANSIENT;

                this.graph.setNodeProperty(settings.token, {
                    lifespan: scope,
                    service: factory,
                });

                deps.forEach(([edge, value]) => {
                    this.graph.setEdgeProperty(edge, value);
                });
            },
        };
    }

    registerClass<TDeps extends Array<unknown> = [], TRegisteredType = unknown>(
        settings: ClassRegistration<TDeps, TRegisteredType>,
    ): IServiceLifetime {
        this.throwIfStateNotBeforeReady();
        throw new Error("Method not implemented.");
    }

    registerValue<TRegisteredType = unknown>(
        settings: ValueRegistration<TRegisteredType>,
    ): void {
        this.throwIfStateNotBeforeReady();
        throw new Error("Method not implemented.");
    }

    registerDynamic(token: DiToken): void {
        this.throwIfStateNotReady();
        throw new Error("Method not implemented.");
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

    async resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        this.throwIfStateNotReady();
        this.throwIfTokenNotRegistered(token);

        const canResolveTransient = createCanResolveTransientFunc<TNode>({
            getLifespan: (node) =>
                this.graph.getNodePropertyOrThrow(node).lifespan,
            getNeighbors: (node) => {
                return this.graph.getSuccessorsOf(node);
            },
        });

        const lifespan = this.graph.getNodePropertyOrThrow(token).lifespan;
        if (lifespan === LIFESPAN.SINGLETON) {
            return await Promise.resolve(
                (this.singletonValueRegistry.get(token) ??
                    null) as TType | null,
            );
        } else if (
            lifespan === LIFESPAN.TRANSIENT &&
            canResolveTransient(token, true)
        ) {
            const factory = this.nodeTransientServiceFactory.get(token);
            if (factory === undefined) {
                throw new Error();
            }
            return (await factory()) as TType | null;
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
        return Promise.resolve(this.graph.hasNodeProperty(token));
    }

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        // if (!this.graph.hasNode(settings.token)) {
        //     throw new Error("can not override if not registered");
        // } else if (
        //     this.graph.getNodePropertyOrThrow(settings.token).lifespan ===
        //     LIFESPAN.DYNAMIC
        // ) {
        //     throw new Error("can not override dynamic");
        // }
        // if (!isInvokableObject(settings.factory)) {
        //     throw new Error();
        // }
        // this.overrideServices.setNodeProperty(settings.token, {
        //     service: settings.factory,
        // });
        // const deps: Array<[TEdge, EdgeProps]> = [...settings.deps].map(
        //     (to, argIndex) => [[settings.token, to], { argIndex }],
        // );
        // deps.forEach(([edge, property]) => {
        //     this.overrideServices.setEdgeProperty(edge, property);
        // });
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
