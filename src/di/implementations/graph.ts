import { type DiToken } from "@/di/contracts/container.contract.js";

/**
 * All possible service lifetime scopes.
 * - `"singleton"`: one instance for the app lifetime.
 * - `"transient"`: new instance per resolution.
 * - `"scoped"`: one instance per scope (e.g., request).
 * - `"dynamic"`: dynamically registered in a child scope.
 */

/** Lifespan constants used to define service scope. */
export const LIFESPAN = {
    SINGLETON: "singleton",
    TRANSIENT: "transient",
    SCOPED: "scoped",
    DYNAMIC: "dynamic",
} as const;

export type TLifespan = (typeof LIFESPAN)[keyof typeof LIFESPAN];
export type TEdge = [DiToken, DiToken];
export type TNode = DiToken;

export class Graph<TNodeProp, TEdgeProp> {
    private nodeProps = new Map<TNode, TNodeProp>();
    private edgeProps = new Map<TNode, Map<TNode, TEdgeProp>>();

    private parentGraphOriginal?:
        | Graph<TNodeProp, TEdgeProp>
        | (() => Graph<TNodeProp, TEdgeProp>);

    private get parentGraph(): Graph<TNodeProp, TEdgeProp> | undefined {
        if (this.parentGraphOriginal === undefined) {
            return undefined;
        }

        if (this.parentGraphOriginal instanceof Graph) {
            return this.parentGraphOriginal;
        }

        return this.parentGraphOriginal();
    }

    constructor(args?: {
        nodeProps?: Array<[TNode, TNodeProp]>;
        edgeProps?: Array<[TEdge, TEdgeProp]>;
        parentGraph?:
            | Graph<TNodeProp, TEdgeProp>
            | (() => Graph<TNodeProp, TEdgeProp>);
    }) {
        const nodeProps = args?.nodeProps;
        const edgeProps = args?.edgeProps;
        this.parentGraphOriginal = args?.parentGraph;

        if (nodeProps !== undefined) {
            this.throwIfDuplicateNodesFound(nodeProps);

            for (const [node, property] of nodeProps) {
                this.setNodeProperty(node, property);
            }
        }

        if (edgeProps !== undefined) {
            this.throwIfDuplicateEdgeFound(edgeProps);

            for (const [edge, property] of edgeProps) {
                this.setEdgeProperty(edge, property);
            }
        }
    }

    private throwIfDuplicateNodesFound(props: Array<[TNode, TNodeProp]>) {
        const nodeSet = new Set<TNode>();

        for (const [node, _] of props) {
            const nodeExist = nodeSet.has(node);
            if (nodeExist) {
                throw new Error();
            }

            nodeSet.add(node);
        }
    }

    private throwIfDuplicateEdgeFound(props: Array<[TEdge, TEdgeProp]>) {
        const edgesMap = new Map<TNode, Set<TNode>>();

        for (const [[node0, node1], _] of props) {
            const edgeExist = edgesMap.get(node0)?.has(node1) === true;

            if (edgeExist) {
                throw new Error();
            }

            const neighbors = edgesMap.get(node0) ?? new Set<TNode>();
            neighbors.add(node1);
            edgesMap.set(node0, neighbors);
        }
    }

    private edgesAtCurrentLayer(): Array<TEdge> {
        const edges = [...this.edgeProps.entries()].flatMap(
            ([node, neighborsMap]) => {
                return [...neighborsMap.keys()].map(
                    (neighborNode) => [node, neighborNode] satisfies TEdge,
                );
            },
        );

        return edges;
    }

    private nodesAtCurrentLayer(): Array<TNode> {
        return [...this.nodeProps.keys()];
    }

    private hasNodePropertyAtCurrentLayer(node: TNode): boolean {
        return this.nodeProps.has(node);
    }

    private hasEdgePropertyAtCurrentLayer(edge: TEdge): boolean {
        return this.edgeProps.get(edge[0])?.has(edge[1]) ?? false;
    }

    private getEdgePropertyAtCurrentLayer(edge: TEdge): TEdgeProp | null {
        return this.edgeProps.get(edge[0])?.get(edge[1]) ?? null;
    }

    private getNodePropertyAtCurrentLayer(nodeId: TNode): TNodeProp | null {
        return this.nodeProps.get(nodeId) ?? null;
    }

    hasNodeProperty(node: TNode): boolean {
        if (this.hasNodePropertyAtCurrentLayer(node)) {
            return true;
        }

        if (this.parentGraph === undefined) {
            return false;
        }

        return this.parentGraph.hasNodeProperty(node);
    }

    hasEdgeProperty(edge: TEdge): boolean {
        if (this.hasEdgePropertyAtCurrentLayer(edge)) {
            return true;
        }

        if (this.parentGraph === undefined) {
            return false;
        }

        return this.parentGraph.hasEdgeProperty(edge);
    }

    getNodeProperty(nodeId: TNode): TNodeProp | null {
        if (this.hasNodePropertyAtCurrentLayer(nodeId)) {
            return this.getNodePropertyAtCurrentLayer(nodeId);
        }
        if (this.parentGraph === undefined) {
            return null;
        }

        return this.parentGraph.getNodeProperty(nodeId);
    }

    getEdgeProperty(edge: TEdge): TEdgeProp | null {
        if (this.hasEdgePropertyAtCurrentLayer(edge)) {
            return this.getEdgePropertyAtCurrentLayer(edge);
        }

        if (this.parentGraph === undefined) {
            return null;
        }

        return this.parentGraph.getEdgeProperty(edge);
    }

    getNodePropertyOrThrow(key: TNode): TNodeProp {
        const value = this.getNodeProperty(key);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    getEdgePropertyOrThrow(edge: TEdge): TEdgeProp {
        const value = this.getEdgeProperty(edge);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    setNodeProperty(key: TNode, value: TNodeProp): void {
        this.nodeProps.set(key, value);
    }

    setEdgeProperty(edge: TEdge, value: TEdgeProp): void {
        const neighbor =
            this.edgeProps.get(edge[0]) ?? new Map<TNode, TEdgeProp>();
        neighbor.set(edge[1], value);
        this.edgeProps.set(edge[0], neighbor);
    }

    nodes(): Array<TNode> {
        const currentNodes = this.nodesAtCurrentLayer();
        const parentNodes = this.parentGraph?.nodes() ?? [];
        const nodesOnlyInParent = parentNodes.filter(
            (node) => !this.hasNodePropertyAtCurrentLayer(node),
        );
        return [...currentNodes, ...nodesOnlyInParent];
    }

    edges(): Array<TEdge> {
        const currentEdges = this.edgesAtCurrentLayer();
        const parentEdges = this.parentGraph?.edges() ?? [];
        const edgesOnlyInParent = parentEdges.filter(
            (edge) => !this.hasEdgePropertyAtCurrentLayer(edge),
        );
        return [...currentEdges, ...edgesOnlyInParent];
    }

    getSuccessorEdgesOf(node: TNode): Array<TEdge> {
        return this.edges().filter((item) => item[0] === node);
    }

    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        return this.edges().filter((item) => item[1] === node);
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.getPredecessorEdgesOf(node).map(([source, _]) => source);
    }

    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node).map(([_, neighbor]) => neighbor);
    }

    /**
     * AI written check and simplify
     * Removes a directed edge between source (node0) and target (node1).
     * @returns true if the edge existed and was removed, false otherwise.
     */

    /**
     * AI written check and simplify
     * Removes a node from the graph and cleans up all associated incoming and outgoing edges.
     * @returns true if the node existed and was removed, false otherwise.
     */
}

/**
 * Thrown when a node dependency or neighbor was referenced during graph traversal
 * but was not declared in the `nodeIds` list.
 */
export class UndeclaredDependencyError<T = unknown> extends Error {
    public readonly nodeId: T;

    constructor(nodeId: T) {
        super(
            `Node "${String(nodeId)}" was referenced as a neighbor/dependency but not listed in nodeIds.`,
        );
        this.name = "UndeclaredDependencyError";
        this.nodeId = nodeId;
    }
}

/**
 * Kahn's Algorithm for eager initialization.
 *
 * Resolves nodes in dependency order: a node's **successors** are its
 * dependencies — they must be initialized before the node itself.
 *
 * @param args.getSuccessors - Returns the dependencies (successors) of a node.
 * @param args.initNode      - Called once all of a node's dependencies are ready.
 */
export async function eagerInitialization<T>(args: {
    nodeIds: Array<T>;
    getSuccessors: (nodeId: T) => Array<T>;
    initNode: (nodeId: T) => Promise<void> | void;
    getPredecessors: (nodeId: T) => Array<T>;
}): Promise<void> {
    const { nodeIds, getSuccessors, initNode, getPredecessors } = args;

    const pending = new Map<T, number>();

    const getPendingDependencyCount = (id: T): number => {
        const unInitialized = pending.get(id);
        if (unInitialized === undefined) {
            throw new UndeclaredDependencyError(id);
        }
        return unInitialized;
    };

    const isAllDependencyResolved = (id: T) =>
        getPendingDependencyCount(id) === 0;

    for (const id of nodeIds) {
        const successors = getSuccessors(id);
        pending.set(id, successors.length);
    }

    let currentBatch = nodeIds.filter((id) => isAllDependencyResolved(id));

    while (currentBatch.length > 0) {
        await Promise.all(currentBatch.map((nodeId) => initNode(nodeId)));

        const nextBatch: Array<T> = [];

        for (const nodeId of currentBatch) {
            for (const dependentId of getPredecessors(nodeId)) {
                const nextCount = getPendingDependencyCount(dependentId) - 1;
                pending.set(dependentId, nextCount);

                if (nextCount === 0) {
                    nextBatch.push(dependentId);
                }
            }
        }

        currentBatch = nextBatch;
    }
}
