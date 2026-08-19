import {
    CanNotOverrideServiceDiError,
    InvalidGraphDiError,
    type DiToken,
    type EdgeErrorInfo,
    type FactoryRegistration,
    type ServiceFactory,
} from "@/di/contracts/_module-exports.js";
import {
    type DepsTokens,
    type FactoryRegistrationOverride,
    type DepRecord,
    type EmptyDepRecord,
} from "@/di/contracts/container.contract.js";
import {
    type NodeProps,
    type EdgeProps,
    type SingletonNodeProps,
    type TransientNodeProps,
    type ScopedNodeProps,
    type DynamicNodeProps,
    type TNode,
    type TEdge,
    type InternalLifetime,
    INTERNAL_LIFETIME,
} from "@/di/implementations/eager/_shared.js";
import {
    findAllCycles,
    getMissingNodes as getMissingDependencies,
    getInvalidEdges,
    visitedNodes,
} from "@/di/implementations/eager/graph-algorithms.js";
import { Graph } from "@/di/implementations/eager/graph.js";
import { tokenToString } from "@/di/implementations/eager/utils.js";
import { UnexpectedError } from "@/utilities/errors.js";

/**
 * Lifetime pairs that form an invalid edge: a map of a source lifetime to
 * the set of target lifetimes it can not point to.
 *
 * Rules:
 * - dynamic node can not point to any other node
 * - transient node can not point to dynamic node
 * - only scoped node can point to dynamic node
 * - singleton node can not point to transient or scoped node
 * - scoped node can not point to transient node
 */
const INVALID_EDGE_TARGETS: Record<
    InternalLifetime,
    ReadonlySet<InternalLifetime>
> = {
    [INTERNAL_LIFETIME.TRANSIENT]: new Set([INTERNAL_LIFETIME.DYNAMIC]),
    [INTERNAL_LIFETIME.SINGLETON]: new Set([
        INTERNAL_LIFETIME.TRANSIENT,
        INTERNAL_LIFETIME.SCOPED,
        INTERNAL_LIFETIME.DYNAMIC,
    ]),
    [INTERNAL_LIFETIME.SCOPED]: new Set([INTERNAL_LIFETIME.TRANSIENT]),
    [INTERNAL_LIFETIME.DYNAMIC]: new Set([
        INTERNAL_LIFETIME.TRANSIENT,
        INTERNAL_LIFETIME.SINGLETON,
        INTERNAL_LIFETIME.SCOPED,
        INTERNAL_LIFETIME.DYNAMIC,
    ]),
};

/**
 * @internal
 */
export type GraphValidationStatus =
    | {
          valid: true;
      }
    | {
          valid: false;
          error: InvalidGraphDiError;
      };

/**
 * @internal
 */
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
            maxCyclesInError: this.maxCyclesInError,
            maxInvalidEdgeInError: this.maxInvalidEdgeInError,
            maxUndeclaredDependenciesInError:
                this.maxUndeclaredDependenciesInError,
        });

        return graphManagerCopy;
    }

    validateGraph(): GraphValidationStatus {
        const declaredNodes = this.nodes().filter((node) =>
            this.hasNodeProperty(node),
        );
        const getSuccessor = (node: TNode) => this.getSuccessorsOf(node);

        const missing = getMissingDependencies({
            getSuccessor,
            nodes: declaredNodes,
        });

        if (missing.length !== 0) {
            return {
                valid: false,
                error: InvalidGraphDiError.create({
                    flag: InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES,
                    undeclaredDependencies: missing.slice(
                        undefined,
                        this.maxUndeclaredDependenciesInError,
                    ),
                    totalNodes: missing.length,
                }),
            };
        }

        const invalidEdges = getInvalidEdges({
            edges: this.edges(),
            edgeIsNotValid: ([source, target]) => {
                if (
                    !this.hasNodeProperty(source) ||
                    !this.hasNodeProperty(target)
                ) {
                    return false;
                }

                const sourceLifespan = this.getLifespan(source);
                const targetLifespan = this.getLifespan(target);

                return INVALID_EDGE_TARGETS[sourceLifespan].has(targetLifespan);
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
                error: InvalidGraphDiError.create({
                    flag: InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
                    edgeErrorInfos: errors.slice(
                        undefined,
                        this.maxInvalidEdgeInError,
                    ),
                    totalDetected: errors.length,
                }),
            };
        }

        const cycles = findAllCycles({
            getSuccessor,
            nodes: declaredNodes,
        });

        if (cycles.length !== 0) {
            return {
                valid: false,
                error: InvalidGraphDiError.create({
                    flag: InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY,
                    cycles: cycles.slice(undefined, this.maxCyclesInError),
                    totalDetected: cycles.length,
                }),
            };
        }

        return { valid: true };
    }

    private depsToEdges<
        TDeps extends DepRecord = EmptyDepRecord,
        TRegisteredType = unknown,
    >(args: { token: DiToken<TRegisteredType>; deps: DepsTokens<TDeps> }) {
        const keys = Object.keys(args.deps);

        const edges: Array<[TEdge, EdgeProps]> = keys.map((key) => {
            const diDependencyToken = args.deps[key];
            if (diDependencyToken === undefined) {
                throw new Error();
            }

            return [[args.token, diDependencyToken], { argIndex: key }];
        });

        return edges;
    }

    registerFactory<
        TDeps extends DepRecord = EmptyDepRecord,
        TRegisteredType = unknown,
    >(settings: FactoryRegistration<TDeps, TRegisteredType>): void {
        const factory = settings.factory as ServiceFactory;

        const edges = this.depsToEdges(settings);

        this.setNodeProperty(settings.token, {
            lifetime: settings.lifetime,
            service: factory,
        });

        edges.forEach(([edge, value]) => {
            this.setEdgeProperty(edge, value);
        });
    }

    registerDynamic(token: DiToken): void {
        this.setNodeProperty(token, {
            lifetime: INTERNAL_LIFETIME.DYNAMIC,
        });
    }

    overrideFactory<
        TDeps extends DepRecord = EmptyDepRecord,
        TRegisteredType = unknown,
    >(
        settings: FactoryRegistrationOverride<TDeps, TRegisteredType>,
    ):
        | { success: true }
        | { success: false; error: CanNotOverrideServiceDiError } {
        const nodeDoNotExist = !this.hasNodeProperty(settings.token);
        const nodeAlreadyOverridden = this.overrideSet.has(settings.token);

        if (nodeDoNotExist) {
            return {
                success: false,
                error: CanNotOverrideServiceDiError.create({
                    token: settings.token,
                    flag: CanNotOverrideServiceDiError.FLAG
                        .TOKEN_NOT_REGISTERED,
                }),
            };
        }

        if (nodeAlreadyOverridden) {
            return {
                success: false,
                error: CanNotOverrideServiceDiError.create({
                    token: settings.token,
                    flag: CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN,
                }),
            };
        }
        const nodeProps = this.getNodePropertyOrThrow(settings.token);

        if (nodeProps.lifetime === INTERNAL_LIFETIME.DYNAMIC) {
            return {
                success: false,
                error: CanNotOverrideServiceDiError.create({
                    token: settings.token,
                    flag: CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN,
                }),
            };
        }

        const factory = settings.factory as ServiceFactory;

        this.graph.setNodeProperty(settings.token, {
            lifetime: nodeProps.lifetime,
            service: factory,
        });

        this.overrideSet.add(settings.token);

        const edgesToBeDeleted = this.getSuccessorEdgesOf(settings.token);

        // remove old edges
        edgesToBeDeleted.forEach((edge) => {
            this.graph.removeEdge(edge);
        });

        const newEdgesToBeAdded = this.depsToEdges(settings);

        // new edges added
        newEdgesToBeAdded.forEach(([edge, value]) => {
            this.graph.setEdgeProperty(edge, value);
        });

        return { success: true };
    }

    ancestorOfTransientNodeIncludeScopedNodes(
        nodeId: TNode,
    ): { status: true; nodes: Array<TNode> } | { status: false } {
        if (this.getLifespan(nodeId) !== INTERNAL_LIFETIME.TRANSIENT) {
            throw new UnexpectedError("Expected node to be transient");
        }
        const nodesVisited = visitedNodes({
            getNeighbors: (node) => this.getSuccessorsOf(node),
            breakBranchSearch: (node) => {
                return this.getLifespan(node) === INTERNAL_LIFETIME.SCOPED;
            },
            node: nodeId,
        });
        const scopedNodeVisited = nodesVisited.filter((visited) =>
            this.isScoped(visited),
        );

        if (scopedNodeVisited.length !== 0) {
            return { status: true, nodes: scopedNodeVisited };
        }
        return {
            status: false,
        };
    }

    getDynamicAncestralNodesOfScopedNode(nodeId: TNode): Array<TNode> {
        if (this.getLifespan(nodeId) !== INTERNAL_LIFETIME.SCOPED) {
            throw new UnexpectedError("Expected node to be scoped");
        }
        const nodesVisited = visitedNodes({
            getNeighbors: (node) => this.getSuccessorsOf(node),
            node: nodeId,
        });
        const dynamicNodeVisited = nodesVisited.filter((visited) =>
            this.isDynamic(visited),
        );
        return dynamicNodeVisited;
    }

    dependencyOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node)
            .map((edge) => ({
                edge,
                property: this.getEdgePropertyOrThrow(edge),
            }))
            .map((item) => item.edge)
            .map(([_, successorNode]) => successorNode);
    }

    public getArgKey(edge: TEdge): EdgeProps["argIndex"] {
        return this.getEdgePropertyOrThrow(edge).argIndex;
    }

    public isTransient(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifetime ===
            INTERNAL_LIFETIME.TRANSIENT
        );
    }

    public isSingleton(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifetime ===
            INTERNAL_LIFETIME.SINGLETON
        );
    }

    public isScoped(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifetime ===
            INTERNAL_LIFETIME.SCOPED
        );
    }

    public isDynamic(node: TNode): boolean {
        return (
            this.getNodePropertyOrThrow(node).lifetime ===
            INTERNAL_LIFETIME.DYNAMIC
        );
    }

    public getLifespan(key: TNode): InternalLifetime {
        return this.graph.getNodePropertyOrThrow(key).lifetime;
    }

    public getSingletonNodeOrThrow(nodeId: TNode): SingletonNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifetime === INTERNAL_LIFETIME.SINGLETON) {
            return node;
        }
        throw new UnexpectedError(
            `Node with token "${tokenToString(nodeId)}" is not registered as a singleton node.`,
        );
    }

    public getTransientNodeOrThrow(nodeId: TNode): TransientNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifetime === INTERNAL_LIFETIME.TRANSIENT) {
            return node;
        }
        throw new UnexpectedError(
            `Node with token "${tokenToString(nodeId)}" is not registered as a transient node.`,
        );
    }
    public getScopedNodeOrThrow(nodeId: TNode): ScopedNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifetime === INTERNAL_LIFETIME.SCOPED) {
            return node;
        }
        throw new UnexpectedError(
            `Node with token "${tokenToString(nodeId)}" is not registered as a scoped node.`,
        );
    }

    public getDynamicNodeOrThrow(nodeId: TNode): DynamicNodeProps {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifetime === INTERNAL_LIFETIME.DYNAMIC) {
            return node;
        }
        throw new UnexpectedError(
            `Node with token "${tokenToString(nodeId)}" is not registered as a dynamic node.`,
        );
    }

    public getServiceFactory(nodeId: TNode): ServiceFactory {
        const node = this.getNodePropertyOrThrow(nodeId);
        if (node.lifetime === INTERNAL_LIFETIME.DYNAMIC) {
            throw new UnexpectedError(
                `Node with token "${tokenToString(nodeId)}" is registered as a dynamic node and therefore does not have a service factory.`,
            );
        }
        return node.service;
    }

    // public getArgIndex(edge: TEdge): number {
    //     return this.getEdgePropertyOrThrow(edge).argIndex;
    // }

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
