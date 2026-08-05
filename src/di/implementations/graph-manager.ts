import {
    type DiToken,
    type FactoryRegistration,
    type ServiceFactory,
} from "@/di/contracts/_module-exports.js";
import {
    type NodeProps,
    type EdgeProps,
    type SingletonNodeProps,
    type TransientNodeProps,
    type ScopedNodeProps,
    type DynamicNodeProps,
} from "@/di/implementations/container.js";
import {
    cycleDetected,
    undeclaredNodesExist,
    someEdgeIsInvalid,
    visitedNodes,
} from "@/di/implementations/graph-algorithms.js";
import { Graph } from "@/di/implementations/graph.js";
import {
    type TNode,
    type TEdge,
    type TLifespan,
    LIFESPAN,
} from "@/di/implementations/utils.js";

// TODO throw specific error classes
export class GraphManager {
    private graph: Graph<NodeProps, EdgeProps>;
    private overrideSet = new Set<TNode>();

    constructor(args?: {
        graph?: Graph<NodeProps, EdgeProps>;
        overrideSet?: Set<TNode>;
    }) {
        this.graph = args?.graph ?? new Graph<NodeProps, EdgeProps>();
    }

    copy(): GraphManager {
        const graphCopy = this.graph.copy();
        const overrideSetCopy = new Set(this.overrideSet);

        const graphManagerCopy = new GraphManager({
            graph: graphCopy,
            overrideSet: overrideSetCopy,
        });

        return graphManagerCopy;
    }

    // TODO give detailed graph validation information instead of boolean
    validateGraph(): void {
        const nodes = this.nodes();
        const getSuccessor = (node: TNode) => this.getSuccessorsOf(node);

        const dependencyIsBroken = undeclaredNodesExist({
            getSuccessor,
            nodes,
        });
        if (dependencyIsBroken) {
            throw new Error();
        }

        const cycleIsDetected = cycleDetected({
            getSuccessor,
            nodes,
        });
        if (cycleIsDetected) {
            throw new Error();
        }

        const edgeIsInvalid = someEdgeIsInvalid({
            edges: this.edges(),
            isSingletonNode: (node) => this.isSingleton(node),
            isScopedNode: (node) => this.isScoped(node),
            isTransientNode: (node) => this.isTransient(node),
            isDynamicNode: (node) => this.isDynamic(node),
        });
        if (edgeIsInvalid) {
            throw new Error();
        }
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

    overrideFactory<
        TDeps extends Array<unknown> = [],
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        const nodeDoNotExist = !this.hasNodeProperty(settings.token);
        const nodeAlreadyOverridden = this.overrideSet.has(settings.token);

        if (nodeDoNotExist) {
            throw new Error();
        }

        if (nodeAlreadyOverridden) {
            throw new Error();
        }

        this.overrideSet.add(settings.token);

        const nodeProps = this.getNodePropertyOrThrow(settings.token);

        if (nodeProps.lifespan === LIFESPAN.DYNAMIC) {
            throw new Error();
        }

        const factory = settings.factory as ServiceFactory;

        this.graph.setNodeProperty(settings.token, {
            lifespan: nodeProps.lifespan,
            service: factory,
        });

        const edgesToBeDeleted = this.getSuccessorEdgesOf(settings.token);

        // remove old edges
        edgesToBeDeleted.forEach((edge) => {
            this.graph.removeEdge(edge);
        });

        const newEdgesToBeAdded: Array<[TEdge, EdgeProps]> = [
            ...settings.deps,
        ].map((to, argIndex) => [[settings.token, to], { argIndex }]);

        // new edges added
        newEdgesToBeAdded.forEach(([edge, value]) => {
            this.graph.setEdgeProperty(edge, value);
        });
    }

    ancestorIncludeScopedNodes(nodeId: TNode): boolean {
        const nodesVisited = visitedNodes({
            getNeighbors: (node) => this.getSuccessorsOf(node),
            node: nodeId,
        });
        const scopedNodeVisited = nodesVisited.some((visited) =>
            this.isScoped(visited),
        );

        return scopedNodeVisited;
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

    setNodeProperty(key: TNode, value: NodeProps): void {
        this.graph.setNodeProperty(key, value);
    }

    setEdgeProperty(edge: TEdge, value: EdgeProps): void {
        this.graph.setEdgeProperty(edge, value);
    }

    hasNodeProperty(node: TNode): boolean {
        return this.graph.hasNodeProperty(node);
    }
    hasEdgeProperty(edge: TEdge): boolean {
        return this.graph.hasEdgeProperty(edge);
    }
    getNodeProperty(nodeId: TNode): NodeProps | null {
        return this.graph.getNodeProperty(nodeId);
    }

    getEdgeProperty(edge: TEdge): EdgeProps | null {
        return this.graph.getEdgeProperty(edge);
    }

    getNodePropertyOrThrow(key: TNode): NodeProps {
        return this.graph.getNodePropertyOrThrow(key);
    }

    getEdgePropertyOrThrow(edge: TEdge): EdgeProps {
        return this.graph.getEdgePropertyOrThrow(edge);
    }
    nodes(): Array<TNode> {
        return this.graph.nodes();
    }
    edges(): Array<TEdge> {
        return this.graph.edges();
    }
    getSuccessorEdgesOf(node: TNode): Array<TEdge> {
        return this.graph.getSuccessorEdgesOf(node);
    }

    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        return this.graph.getPredecessorEdgesOf(node);
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.graph.getPredecessorsOf(node);
    }
    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.graph.getSuccessorsOf(node);
    }
}
