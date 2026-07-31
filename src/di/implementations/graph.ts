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
    private description: string;

    private constructor(args?: {
        description?: string;
        nodeProps?: Array<[TNode, TNodeProp]>;
        edgeProps?: Array<[TEdge, TEdgeProp]>;
    }) {
        this.description = args?.description ?? "";
        const nodeProps = args?.nodeProps;
        const edgeProps = args?.edgeProps;

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

    private throwIfDuplicateNodesFound(
        props: Array<[TNode, TNodeProp | null]>,
    ) {
        const nodeSet = new Set<TNode>();

        for (const [node, _] of props) {
            const nodeExist = nodeSet.has(node);
            if (nodeExist) {
                throw new Error();
            }

            nodeSet.add(node);
        }
    }

    private throwIfDuplicateEdgeFound(props: Array<[TEdge, TEdgeProp | null]>) {
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

    edgeEntries(): Array<[TEdge, TEdgeProp]> {
        const entries: Array<[TEdge, TEdgeProp]> = [];

        for (const node0 of this.edgeProps.keys()) {
            const neighbors =
                this.edgeProps.get(node0) ?? new Map<TNode, TEdgeProp>();

            for (const node1 of neighbors.keys()) {
                const edge: TEdge = [node0, node1];
                entries.push([edge, this.getEdgePropertyOrThrow(edge)]);
            }
        }

        return entries;
    }

    edgeEntriesOrThrowIfNull(): Array<[TEdge, TEdgeProp]> {
        return this.edgeEntries().map(([edge, prop]) => {
            if (prop === null) {
                throw new Error();
            }
            return [edge, prop];
        });
    }

    nodeEntries(): Array<[TNode, TNodeProp]> {
        const entries = [...this.nodeProps.entries()].map(([node, value]) => {
            const res: [TNode, TNodeProp] = [node, value];
            return res;
        });

        return entries;
    }

    nodeEntriesOrThrowIfNull(): Array<[TNode, TNodeProp]> {
        return this.nodeEntries().map(([node, prop]) => {
            if (prop === null) {
                throw new Error();
            }
            return [node, prop];
        });
    }

    // edges(filter?: (arg: [TEdge, TEdgeProp | null]) => boolean): Array<TEdge> {
    //     const filterOp = filter ?? (() => true);
    //     return this.edgeEntries()
    //         .filter(filterOp)
    //         .map((item) => item[0]);
    // }

    // nodes(filter?: (arg: [TNode, TNodeProp | null]) => boolean): Array<TNode> {
    //     const filterOp = filter ?? (() => true);

    //     return this.nodeEntries()
    //         .filter(filterOp)
    //         .map((item) => item[0]);
    // }

    // filterMapEdges<T2>(
    //     filterMap: (value: [TEdge, TEdgeProp | null]) => [TEdge, T2] | false,
    //     args?: { description?: string },
    // ): Graph<TNodeProp, T2> {
    //     const isNotFalse = <T>(item: T | false): item is T => item !== false;

    //     const transformed = this.edgeEntries()
    //         .map(filterMap)
    //         .filter(isNotFalse);

    //     return new Graph<TNodeProp, T2>({
    //         description: args?.description,
    //         edgeProps: transformed,
    //         nodeProps: this.nodeEntries(),
    //     });
    // }

    // filterMapEdgesAndThrowIfNullProperty<T2>(
    //     filterMap: (value: [TEdge, TEdgeProp]) => [TEdge, T2] | false,
    //     args?: { description?: string },
    // ): Graph<TNodeProp, T2> {
    //     return this.filterMapEdges((data) => {
    //         const [node, prop] = data;
    //         if (prop === null) {
    //             throw new Error();
    //         }
    //         return filterMap([node, prop]);
    //     }, args);
    // }

    getEdgeProperty(edge: TEdge): TEdgeProp | null {
        return this.edgeProps.get(edge[0])?.get(edge[1]) ?? null;
    }

    getEdgePropertyOrThrow(edge: TEdge): TEdgeProp {
        const value = this.getEdgeProperty(edge);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    getSuccessorEdgesOf(
        node: TNode,
        // args?:
        //     | {
        //           throwIfNoPropertyFound: false;
        //           filter: (arg: [TEdge, TEdgeProp | null]) => boolean;
        //       }
        //     | {
        //           throwIfNoPropertyFound: true;
        //           filter: (arg: [TEdge, TEdgeProp]) => boolean;
        //       },
    ): Array<TEdge> {
        // let filterOp: (arg: [TEdge, TEdgeProp | null]) => boolean;
        // if (args === undefined) {
        //     filterOp = () => true;
        // } else if (args.throwIfNoPropertyFound) {
        //     filterOp = ([edge, prop]) => {
        //         if (prop === null) {
        //             throw new Error();
        //         }
        //         return args.filter([edge, prop]);
        //     };
        // } else {
        //     filterOp = (item) => args.filter(item);
        // }

        return this.edgeEntries()
            .map((item) => item[0])
            .filter((item) => item[0] === node);
        // .filter((edge) => filterOp([edge, this.getEdgeProperty(edge)]));
    }

    getPredecessorEdgesOf(
        node: TNode,
        // args?:
        //     | {
        //           throwIfNoPropertyFound: false;
        //           filter: (arg: [TEdge, TEdgeProp | null]) => boolean;
        //       }
        //     | {
        //           throwIfNoPropertyFound: true;
        //           filter: (arg: [TEdge, TEdgeProp]) => boolean;
        //       },
    ): Array<TEdge> {
        // let filterOp: (arg: [TEdge, TEdgeProp | null]) => boolean;

        // if (args === undefined) {
        //     filterOp = () => true;
        // } else if (args.throwIfNoPropertyFound) {
        //     filterOp = ([edge, prop]) => {
        //         if (prop === null) {
        //             throw new Error();
        //         }
        //         return args.filter([edge, prop]);
        //     };
        // } else {
        //     filterOp = (item) => args.filter(item);
        // }

        return this.edgeEntries()
            .map((item) => item[0])
            .filter((item) => item[1] === node);
        // .filter((edge) => filterOp([edge, this.getEdgeProperty(edge)]));
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.getPredecessorEdgesOf(node).map(([source, _]) => source);
    }

    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node).map(([_, neighbor]) => neighbor);
    }

    hasEdgeProperty(edge: TEdge): boolean {
        return this.getEdgeProperty(edge) !== null;
    }

    // hasEdge(edge: TEdge): boolean {
    //     return this.edgeProps.get(edge[0])?.has(edge[1]) === true;
    // }

    // addEdge(edge: TEdge): void {
    //     if (!this.hasEdgeProperty(edge)) {
    //         this.setEdgeProperty(edge, null);
    //     }
    // }

    setEdgeProperty(edge: TEdge, value: TEdgeProp): void {
        const neighbor =
            this.edgeProps.get(edge[0]) ?? new Map<TNode, TEdgeProp>();
        neighbor.set(edge[1], value);
        this.edgeProps.set(edge[0], neighbor);
    }

    // setEdgePropertyByFuncOrThrow(
    //     key: TEdge,
    //     func: (value: TEdgeProp) => TEdgeProp,
    // ): void {
    //     const value = this.getEdgePropertyOrThrow(key);
    //     this.setEdgeProperty(key, func(value));
    // }

    // setEdgePropertyByFunc(
    //     key: TEdge,
    //     func: (value: TEdgeProp | null) => TEdgeProp,
    // ): void {
    //     const value = this.getEdgeProperty(key);
    //     this.setEdgeProperty(key, func(value));
    // }

    // modifyEdgePropertyOrThrow(
    //     key: TEdge,
    //     modifier: (value: TEdgeProp) => void,
    // ): void {
    //     const value = this.getEdgeProperty(key);
    //     if (value === null) {
    //         throw new Error();
    //     }
    //     modifier(value);
    // }

    static empty<T1, T2>(description?: string): Graph<T1, T2> {
        return new Graph<T1, T2>({ description });
    }

    clone(args?: {
        cloneNodes: (value: TNodeProp) => TNodeProp;
        cloneEdges: (value: TEdgeProp) => TEdgeProp;
    }): Graph<TNodeProp, TEdgeProp> {
        const clonedNodes = this.nodeEntries().map(
            ([key, value]) =>
                [key, args?.cloneNodes(value) ?? value] satisfies [
                    TNode,
                    TNodeProp,
                ],
        );

        const clonedEdges = this.edgeEntries().map(
            ([key, value]) =>
                [key, args?.cloneEdges(value) ?? value] satisfies [
                    TEdge,
                    TEdgeProp | null,
                ],
        );

        return new Graph({
            description: this.description,
            nodeProps: clonedNodes,
            edgeProps: clonedEdges,
        });
    }

    /**
     * AI written check and simplify
     * Removes a directed edge between source (node0) and target (node1).
     * @returns true if the edge existed and was removed, false otherwise.
     */
    // removeEdge(edge: TEdge): boolean {
    //     const [source, target] = edge;
    //     const neighbors = this.edgeProps.get(source);

    //     if (!neighbors) {
    //         return false;
    //     }

    //     const deleted = neighbors.delete(target);

    //     // Clean up empty outer map entries to prevent memory leaks
    //     if (neighbors.size === 0) {
    //         this.edgeProps.delete(source);
    //     }

    //     return deleted;
    // }

    /**
     * AI written check and simplify
     * Removes a node from the graph and cleans up all associated incoming and outgoing edges.
     * @returns true if the node existed and was removed, false otherwise.
     */
    // removeNode(node: TNode): boolean {
    //     if (!this.nodeProps.has(node)) {
    //         return false;
    //     }

    //     // 1. Remove node properties
    //     this.nodeProps.delete(node);

    //     // 2. Remove all outgoing edges from this node
    //     this.edgeProps.delete(node);

    //     // 3. Remove all incoming edges targeting this node from other nodes
    //     for (const [source, neighbors] of this.edgeProps.entries()) {
    //         neighbors.delete(node);

    //         // Clean up empty outer map entries
    //         if (neighbors.size === 0) {
    //             this.edgeProps.delete(source);
    //         }
    //     }

    //     return true;
    // }

    // filterMapNodes<T2>(
    //     filterMap: (value: [TNode, TNodeProp | null]) => [TNode, T2] | false,
    //     args?: { description?: string },
    // ): Graph<T2, TEdgeProp> {
    //     const isNotFalse = <T>(item: T | false): item is T => item !== false;
    //     const transformedNodes = this.nodeEntries()
    //         .map(filterMap)
    //         .filter(isNotFalse);

    //     const validNodes = new Set(transformedNodes.map(([node]) => node));

    //     // Retain only edges whose source AND target nodes exist in the new graph
    //     const validEdges = this.edgeEntries().filter(
    //         ([[source, target]]) =>
    //             validNodes.has(source) && validNodes.has(target),
    //     );

    //     return new Graph<T2, TEdgeProp>({
    //         description: args?.description,
    //         nodeProps: transformedNodes,
    //         edgeProps: validEdges,
    //     });
    // }

    // filterMapNodesAndThrowIfNullProperty<T2>(
    //     filterMap: (value: [TNode, TNodeProp]) => [TNode, T2] | false,
    //     args?: { description?: string },
    // ): Graph<T2, TEdgeProp> {
    //     return this.filterMapNodes((data) => {
    //         const [node, prop] = data;
    //         if (prop === null) {
    //             throw new Error();
    //         }
    //         return filterMap([node, prop]);
    //     }, args);
    // }

    hasNodeProperty(node: TNode): boolean {
        return this.getNodeProperty(node) !== null;
    }

    // addNode(node: TNode): void {
    //     if (!this.hasNodeProperty(node)) {
    //         this.setNodeProperty(node, null);
    //     }
    // }

    hasNode(node: TNode): boolean {
        return this.nodeProps.has(node);
    }

    getNodeProperty(key: TNode): TNodeProp | null {
        return this.nodeProps.get(key) ?? null;
    }

    getNodePropertyOrThrow(key: TNode): TNodeProp {
        const value = this.getNodeProperty(key);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    setNodeProperty(key: TNode, value: TNodeProp): void {
        this.nodeProps.set(key, value);
    }

    // setNodePropertyByFunc(
    //     key: TNode,
    //     func: (value: TNodeProp | null) => TNodeProp,
    // ): void {
    //     const value = this.getNodeProperty(key);
    //     this.setNodeProperty(key, func(value));
    // }

    // modifyNodePropertyOrThrow(
    //     key: TNode,
    //     modifier: (value: TNodeProp) => void,
    // ): void {
    //     const value = this.getNodePropertyOrThrow(key);
    //     modifier(value);
    // }

    // setNodePropertyByFuncOrThrow(
    //     key: TNode,
    //     func: (value: TNodeProp | null) => TNodeProp,
    // ): void {
    //     const value = this.getNodePropertyOrThrow(key);
    //     this.setNodeProperty(key, func(value));
    // }

    getDescription(): string {
        return this.description;
    }
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

    // pending[node] = count of dependencies not yet initialized
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

    // Step 2: Count each node's own dependencies
    // Validates that all referenced dependencies are declared in nodeIds
    for (const id of nodeIds) {
        const successors = getSuccessors(id);
        pending.set(id, successors.length);
    }

    // Step 3: Seed initial batch with nodes that have zero dependencies
    let currentBatch = nodeIds.filter((id) => isAllDependencyResolved(id));

    // Step 3: Process dependency waves
    while (currentBatch.length > 0) {
        // Initialize all services in the current wave concurrently
        await Promise.all(currentBatch.map((nodeId) => initNode(nodeId)));

        const nextBatch: Array<T> = [];

        // For each processed node, decrement the pending count of its dependents
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
