import {
    type ClassRegistration,
    type ContextRegistration,
    type DiHook,
    type DiToken,
    type FactoryRegistration,
    type IServiceLifetime,
    type IServiceOverrider,
    type IServiceRegister,
    type ServiceFactory,
    type ServiceProvider,
    type ValueRegistration,
} from "@/di/contracts/_module-exports.js";
import {
    type NodeProps,
    type EdgeProps,
    type SingletonNodeProps,
    type TransientNodeProps,
    type ScopedNodeProps,
    type DynamicNodeProps,
} from "@/di/implementations/container.js";
import { visitedNodes } from "@/di/implementations/graph-algorithms.js";
import { Graph } from "@/di/implementations/graph.js";
import {
    type TNode,
    type TEdge,
    type TLifespan,
    LIFESPAN,
} from "@/di/implementations/utils.js";

export class GraphManager {
    private baseGraph: Graph<NodeProps, EdgeProps>;
    private overrideGraph: Graph<NodeProps, EdgeProps>;

    private constructor(args?: {
        baseGraph?: Graph<NodeProps, EdgeProps>;
        overrideGraph?: Graph<NodeProps, EdgeProps>;
    }) {
        this.baseGraph = args?.baseGraph ?? new Graph<NodeProps, EdgeProps>();
        this.overrideGraph =
            args?.overrideGraph ?? new Graph<NodeProps, EdgeProps>();

        this.overrideGraph.setParent(this.baseGraph);
    }

    public copy(): GraphManager {
        const baseGraphCopy = this.baseGraph.flattenedGraphCopy();
        const overrideCopy = this.overrideGraph.shallowGraphCopy();

        const graphManagerCopy = new GraphManager({
            baseGraph: baseGraphCopy,
            overrideGraph: overrideCopy,
        });

        return graphManagerCopy;
    }

    registerFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistration<TDeps, TRegisteredType>,
        lifespan: TLifespan,
    ): void {
        const factory = settings.factory as ServiceFactory;
        const deps: Array<[TEdge, EdgeProps]> = [...settings.deps].map(
            (to, argIndex) => [[settings.token, to], { argIndex }],
        );

        this.setNodeProperty(settings.token, {
            lifespan,
            service: factory,
        });

        deps.forEach(([edge, value]) => {
            this.setEdgeProperty(edge, value);
        });
    }

    registerDynamic(token: DiToken): void {
        this.setNodeProperty(token, {
            lifespan: LIFESPAN.DYNAMIC,
        });
    }

    registerContext<TWhen = unknown, TNeeds = unknown>(
        settings: ContextRegistration<TWhen, TNeeds>,
    ): void {
        throw new Error("Method not implemented.");
    }

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        const possibleToOverride = this.hasNodeProperty(settings.token);

        // TODO check new graph is good (no cycle, edge valid and so on)
        if (!possibleToOverride) {
            throw new Error();
        }

        const nodeProps = this.getNodePropertyOrThrow(settings.token);

        if (nodeProps.lifespan === LIFESPAN.DYNAMIC) {
            throw new Error();
        }

        const factory = settings.factory as ServiceFactory;

        this.setNodePropertyInOverrideLayer(settings.token, {
            lifespan: nodeProps.lifespan,
            service: factory,
        });

        const edgesToBeDeleted = this.getSuccessorEdgesOf(settings.token);

        // remove old edges
        edgesToBeDeleted.forEach((edge) => {
            this.removeEdgeFromOverrideLayer(edge);
        });

        const newEdgesToBeAdded: Array<[TEdge, EdgeProps]> = [
            ...settings.deps,
        ].map((to, argIndex) => [[settings.token, to], { argIndex }]);

        // new edges added
        newEdgesToBeAdded.forEach(([edge, value]) => {
            this.setEdgePropertyInOverrideLayer(edge, value);
        });
    }

    createNodeFilter(lifeSpan: TLifespan): Array<TNode> {
        return this.nodes().filter(
            (nodeId) =>
                this.getNodePropertyOrThrow(nodeId).lifespan === lifeSpan,
        );
    }

    getArgIndexOfNode(nodeId: TNode, depsId: TNode): number {
        const edges = this.getSuccessorEdgesOf(nodeId).filter(
            ([fromNode, toNode]) => nodeId === fromNode && toNode === depsId,
        );

        if (edges.length !== 1) {
            throw new Error();
        }
        const edge = edges[0];

        if (edge === undefined) {
            throw new Error();
        }

        const argIndex = this.getEdgePropertyOrThrow(edge).argIndex;

        return argIndex;
    }

    createNeighborFilter(x: TNode, lifeSpan: TLifespan): Array<TNode> {
        const neighbors = this.getSuccessorsOf(x).filter(
            (successor) =>
                this.getNodePropertyOrThrow(successor).lifespan === lifeSpan,
        );

        return neighbors;
    }

    createCanResolveTransientFunc(
        nodeId: TNode,
        depthIsZero: boolean,
    ): boolean {
        const lifespan = this.getNodePropertyOrThrow(nodeId).lifespan;

        if (lifespan !== LIFESPAN.TRANSIENT) {
            throw new Error();
        }

        const nodesVisited = visitedNodes({
            getNeighbors: (node) => this.getSuccessorsOf(node),
            node: nodeId,
        });
        const scopedNodeVisited = nodesVisited.some(
            (visited) =>
                this.getNodePropertyOrThrow(visited).lifespan ===
                LIFESPAN.SCOPED,
        );
        if (depthIsZero && scopedNodeVisited) {
            return false;
        }

        return true;
    }

    dependencyOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node)
            .map((edge) => ({
                edge,
                property: this.getEdgePropertyOrThrow(edge),
            }))
            .sort(
                (itemA, itemB) =>
                    itemA.property.argIndex - itemB.property.argIndex,
            )
            .map((item) => item.edge)
            .map(([_, successorNode]) => successorNode);
    }

    public isTransient(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifespan === LIFESPAN.TRANSIENT
        );
    }

    public isSingleton(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifespan === LIFESPAN.SINGLETON
        );
    }

    public isScoped(node: TNode): boolean {
        return this.getNodePropertyOrThrow(node).lifespan === LIFESPAN.SCOPED;
    }

    public isDynamic(node: TNode): boolean {
        return this.getNodePropertyOrThrow(node).lifespan === LIFESPAN.DYNAMIC;
    }

    public getSingletonNodeOrThrow(nodeId: TNode): SingletonNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifespan === LIFESPAN.SINGLETON) {
            return node;
        }
        throw new Error();
    }

    public getTransientNodeOrThrow(nodeId: TNode): TransientNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifespan === LIFESPAN.TRANSIENT) {
            return node;
        }
        throw new Error();
    }
    public getScopedNodeOrThrow(nodeId: TNode): ScopedNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifespan === LIFESPAN.SCOPED) {
            return node;
        }
        throw new Error();
    }

    public getDynamicNodeOrThrow(nodeId: TNode): DynamicNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifespan === LIFESPAN.DYNAMIC) {
            return node;
        }
        throw new Error();
    }

    public getServiceFactory(nodeId: TNode): ServiceFactory {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifespan === LIFESPAN.DYNAMIC) {
            throw new Error();
        }
        return node.service;
    }

    public getArgIndex(edge: TEdge): number {
        return this.getEdgePropertyOrThrow(edge).argIndex;
    }

    // -------------------------------------------
    setNodeProperty(key: TNode, value: NodeProps): void {
        this.baseGraph.setNodeProperty(key, value);
    }

    setEdgeProperty(edge: TEdge, value: EdgeProps): void {
        this.baseGraph.setEdgeProperty(edge, value);
    }

    setNodePropertyInOverrideLayer(key: TNode, value: NodeProps): void {
        this.overrideGraph.setNodeProperty(key, value);
    }

    setEdgePropertyInOverrideLayer(edge: TEdge, value: EdgeProps): void {
        this.overrideGraph.setEdgeProperty(edge, value);
    }

    removeEdgeFromOverrideLayer(edge: TEdge): void {
        this.overrideGraph.removeEdge(edge);
    }
    removeNodeFromOverrideLayer(node: TNode): void {
        this.overrideGraph.removeNode(node);
    }

    hasNodeProperty(node: TNode): boolean {
        return this.overrideGraph.hasNodeProperty(node);
    }
    hasEdgeProperty(edge: TEdge): boolean {
        return this.overrideGraph.hasEdgeProperty(edge);
    }
    getNodeProperty(nodeId: TNode): NodeProps | null {
        return this.overrideGraph.getNodeProperty(nodeId);
    }

    getEdgeProperty(edge: TEdge): EdgeProps | null {
        return this.overrideGraph.getEdgeProperty(edge);
    }

    getNodePropertyOrThrow(key: TNode): NodeProps {
        return this.overrideGraph.getNodePropertyOrThrow(key);
    }

    getEdgePropertyOrThrow(edge: TEdge): EdgeProps {
        return this.overrideGraph.getEdgePropertyOrThrow(edge);
    }
    nodes(): Array<TNode> {
        return this.overrideGraph.nodes();
    }
    edges(): Array<TEdge> {
        return this.overrideGraph.edges();
    }
    getSuccessorEdgesOf(node: TNode): Array<TEdge> {
        return this.overrideGraph.getSuccessorEdgesOf(node);
    }

    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        return this.overrideGraph.getPredecessorEdgesOf(node);
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.overrideGraph.getPredecessorsOf(node);
    }
    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.overrideGraph.getSuccessorsOf(node);
    }
}
