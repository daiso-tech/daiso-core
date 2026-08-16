import {
    CycleDependencyDiError,
    InvalidEdgeRelationshipDiError,
    UndeclaredDependenciesDiError,
    type DiToken,
    type EdgeErrorInfo,
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
    findAllCycles,
    getMissingNodes as getMissingDependencies,
    getInvalidEdges,
    visitedNodes,
} from "@/di/implementations/graph-algorithms.js";
import { Graph } from "@/di/implementations/graph.js";
import {
    type TNode,
    type TEdge,
    type TLifespan,
    LIFESPAN,
} from "@/di/implementations/utils.js";

export type GraphValidationStatus =
    | {
          valid: true;
      }
    | {
          valid: false;
          error: AggregateError | CycleDependencyDiError;
      };

// TODO throw specific error classes
export class GraphManager {
    private graph: Graph<NodeProps, EdgeProps>;
    private overrideSet = new Set<TNode>();
    private readonly maxInvalidEdgeInError?: number;
    private readonly maxCyclesInError?: number;
    private readonly maxUndeclaredDependenciesInError?: number;

    constructor(args?: {
        graph?: Graph<NodeProps, EdgeProps>;
        overrideSet?: Set<TNode>;
        maxInvalidEdgeInError?: number;
        maxCyclesInError?: number;
        maxUndeclaredDependenciesInError?: number;
    }) {
        this.graph = args?.graph ?? new Graph<NodeProps, EdgeProps>();
        this.maxInvalidEdgeInError = args?.maxInvalidEdgeInError;
        this.maxCyclesInError = args?.maxCyclesInError;
        this.maxUndeclaredDependenciesInError =
            args?.maxUndeclaredDependenciesInError;
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

    private validateNoCycleExists(): Array<Array<TNode>> {
        const nodes = this.nodes();
        const getSuccessor = (node: TNode) => this.getSuccessorsOf(node);

        return findAllCycles({
            getSuccessor,
            nodes,
        });
    }

    // TODO give detailed graph validation information instead of boolean
    validateGraph(): GraphValidationStatus {
        const nodes = this.nodes();
        const getSuccessor = (node: TNode) => this.getSuccessorsOf(node);

        const missing = getMissingDependencies({
            getSuccessor,
            nodes,
        });

        if (missing.length !== 0) {
            return {
                valid: false,
                error: UndeclaredDependenciesDiError.create(
                    missing.slice(
                        undefined,
                        this.maxUndeclaredDependenciesInError,
                    ),
                    missing.length,
                ),
            };
        }

        const invalidEdges = getInvalidEdges({
            edges: this.edges(),
            edgeIsNotValid: ([source, target]) => {
                // dynamic node can not point to any other node
                if (this.isDynamic(source)) {
                    return true;
                }

                // transient node can not point to dynamic node
                if (this.isTransient(source) && this.isDynamic(target)) {
                    return true;
                }

                // only scoped node can point to dynamic node
                if (this.isDynamic(target)) {
                    return !this.isScoped(source);
                }

                // singleton node can not point to transient or scoped node
                if (
                    this.isSingleton(source) &&
                    (this.isTransient(target) || this.isScoped(target))
                ) {
                    return true;
                }

                // scoped node can not point to transient node
                if (this.isScoped(source) && this.isTransient(target)) {
                    return true;
                }

                return false;
            },
        });

        if (invalidEdges.length !== 0) {
            const errors = invalidEdges.map(
                ([nodeFrom, nodeTo]) =>
                    ({
                        edge: [nodeFrom, nodeTo],
                        edgeType: [
                            this.getLifespan(nodeFrom),
                            this.getLifespan(nodeTo),
                        ],
                    }) satisfies EdgeErrorInfo,
            );
            return {
                valid: false,
                error: InvalidEdgeRelationshipDiError.create(
                    errors.slice(undefined, this.maxInvalidEdgeInError),
                    errors.length,
                ),
            };
        }

        const cycles = findAllCycles({
            getSuccessor,
            nodes,
        });

        if (cycles.length !== 0) {
            return {
                valid: false,
                error: CycleDependencyDiError.create(
                    cycles.slice(undefined, this.maxCyclesInError),
                    cycles.length,
                ),
            };
        }

        return { valid: true };
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

    public getLifespan(key: TNode): TLifespan {
        return this.graph.getNodePropertyOrThrow(key).lifespan;
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
