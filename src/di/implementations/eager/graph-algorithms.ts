/**
 * @module DI
 */
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { UndeclaredDependencyInfo } from "@/di/contracts/container.errors.js";

/**
 * Kahn's Algorithm for eager initialization.
 *
 * Resolves nodes in dependency order: a node's **successors** are its
 * dependencies — they must be initialized before the node itself.
 *
 * @param args.nodeIds - All nodes to initialize.
 * @param args.getSuccessors - Returns the dependencies (successors) of a node.
 * @param args.initNode - Called once all of a node's dependencies are ready.
 * @param args.getPredecessors - Returns the nodes that depend on a node.
 * @returns Resolves once every node has been initialized after all of its
 * dependencies.
 * @internal
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
            throw new UnexpectedError(
                `Expected node id "${String(id)}" to exist in the pending dependency counts. Each node must be declared in nodeIds before it is referenced as a dependency.`,
            );
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
        await Promise.all(currentBatch.map(async (nodeId) => initNode(nodeId)));

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

    const blockedNodes = [...pending.entries()]
        .filter(([, count]) => count > 0)
        .map(([id]) => id);

    if (blockedNodes.length > 0) {
        throw new UnexpectedError(
            `Eager initialization failed: nodes ${blockedNodes.map((id) => `"${String(id)}"`).join(", ")} could not be initialized because their dependencies remain unresolved (possible cycle or undeclared dependency).`,
        );
    }
}

/**
 * Finds all nodes transitively affected by a change to the starting node.
 *
 * Starting from `startNodeId`, traverses the graph by repeatedly following
 * the `predecessorOf` relation and returns every reachable node.
 *
 * @param args.predecessorOf - Returns the predecessors (dependents) of a node.
 * @param args.startNodeId - The node whose change triggers the traversal.
 * @returns The starting node plus every node transitively affected by it.
 * @internal
 */
export function findEffectedNodes<T>(args: {
    predecessorOf: (node: T) => Array<T>;
    startNodeId: T;
}): Array<T> {
    const effectedNodes = new Set<T>([args.startNodeId]);
    const queue = [args.startNodeId];

    while (queue.length > 0) {
        const node = queue.shift();

        if (node === undefined) {
            throw new UnexpectedError(
                "Invariant violation: the traversal queue must not be empty inside the loop, so shift() should always return a node.",
            );
        }

        for (const successor of args.predecessorOf(node)) {
            if (!effectedNodes.has(successor)) {
                effectedNodes.add(successor);
                queue.push(successor);
            }
        }
    }

    return [...effectedNodes];
}

/**
 * Visits the graph starting from a node and collects every visited node.
 *
 * Traversal follows `getNeighbors` depth-first. If `breakBranchSearch`
 * returns `true` for a node, its branch is not explored any further.
 *
 * @param args.node - The node to start visiting from.
 * @param args.getNeighbors - Returns the neighbors of a node to visit next.
 * @param args.breakBranchSearch - Optional predicate that stops exploring a
 * branch when it returns `true` for the current node.
 * @returns All visited nodes, starting with the start node.
 * @internal
 */
// TODO better name
export function visitedNodes<T>(args: {
    node: T;
    getNeighbors: (node: T) => Array<T>;
    // sometimes only need first node in branch and not all visted
    // for example if checking transient depends on scoped. No need find all dependcy of scoped.
    breakBranchSearch?: (node: T) => boolean;
}): Array<T> {
    const { node, getNeighbors } = args;

    const visited = new Set<T>();

    function dfs(current: T): void {
        if (visited.has(current)) {
            return;
        }

        visited.add(current);

        if (args.breakBranchSearch?.(current) ?? false) {
            return;
        }

        for (const neighbor of getNeighbors(current)) {
            dfs(neighbor);
        }
    }

    dfs(node);

    return Array.from(visited);
}

/**
 * Detects whether the directed graph contains a cycle using a three-color DFS.
 *
 * Colors:
 * - WHITE: not yet visited
 * - GRAY: currently on the DFS stack (on the path being explored)
 * - BLACK: fully explored, no cycle found through it
 *
 * If DFS reaches a GRAY node, a cycle exists.
 *
 * @param args.getSuccessor - Returns the successors (dependencies) of a node.
 * @param args.nodes - All nodes of the graph.
 * @returns Every detected cycle, each as the path of nodes that forms it.
 * @internal
 */
export function findAllCycles<TNode>(args: {
    getSuccessor: (node: TNode) => Array<TNode>;
    nodes: Array<TNode>;
}): Array<Array<TNode>> {
    const { getSuccessor, nodes } = args;

    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<TNode, number>();
    const allCycles: Array<Array<TNode>> = [];

    for (const node of nodes) {
        color.set(node, WHITE);
    }

    const collectCyclesFrom = (startNode: TNode): void => {
        type Frame = { node: TNode; successors: Array<TNode> };
        const stack: Array<Frame> = [
            { node: startNode, successors: getSuccessor(startNode) },
        ];
        color.set(startNode, GRAY);

        while (stack.length > 0) {
            const frame = stack[stack.length - 1];

            if (frame === undefined) {
                throw new UnexpectedError(
                    "Invariant violation: the DFS stack must not be empty inside the loop, so the top frame should always exist.",
                );
            }

            const successor = frame.successors.pop();

            if (successor === undefined) {
                color.set(frame.node, BLACK);
                stack.pop();
                continue;
            }

            const successorColor = color.get(successor) ?? WHITE;

            if (successorColor === GRAY) {
                // Find index of the GRAY successor on the active DFS path stack
                const cycleStartIndex = stack.findIndex(
                    (f) => f.node === successor,
                );

                if (cycleStartIndex !== -1) {
                    // Extract path from the start of the cycle to current frame node
                    const cyclePath = stack
                        .slice(cycleStartIndex)
                        .map((f) => f.node);

                    allCycles.push(cyclePath);
                }
                // Continue exploring other successors rather than terminating early
                continue;
            }

            if (successorColor === WHITE) {
                color.set(successor, GRAY);
                stack.push({
                    node: successor,
                    successors: getSuccessor(successor),
                });
            }
        }
    };

    for (const node of nodes) {
        if (color.get(node) === WHITE) {
            collectCyclesFrom(node);
        }
    }

    return allCycles;
}
/**
 * Finds dependencies referenced by the declared nodes that are not
 * themselves declared.
 *
 * @param args.getSuccessor - Returns the successors (dependencies) of a node.
 * @param args.nodes - All declared nodes of the graph. Must not contain
 * duplicates.
 * @returns An entry per undeclared dependency: the missing dependency and the
 * declared nodes that depend on it.
 * @internal
 */
export function getMissingNodes<T>(args: {
    getSuccessor: (node: T) => Array<T>;
    nodes: Array<T>;
}): Array<UndeclaredDependencyInfo<T>> {
    const { getSuccessor, nodes } = args;
    const missingDependenciesMap = new Map<T, Array<T>>();

    const allNodes = new Set<T>(nodes);
    if (allNodes.size !== nodes.length) {
        throw new UnexpectedError("Nodes argument contain duplicates");
    }

    for (const node of nodes) {
        const dependent = node;
        for (const successor of getSuccessor(dependent)) {
            const dependency = successor;
            const isUndeclaredDependency = !allNodes.has(dependency);
            if (isUndeclaredDependency) {
                const dependents = missingDependenciesMap.get(dependency) ?? [];
                dependents.push(dependent);
                missingDependenciesMap.set(dependency, dependents);
            }
        }
    }

    return [...missingDependenciesMap.entries()].map(
        ([missingDependency, dependents]) => ({
            missingDependency,
            dependents,
        }),
    ) satisfies Array<UndeclaredDependencyInfo<T>>;
}

/**
 * Filters out the edges that fail the validity predicate.
 *
 * @param args.edges - The edges to validate.
 * @param args.edgeIsNotValid - Predicate returning `true` for an invalid edge.
 * @returns The edges that are considered invalid.
 * @internal
 */
export function getInvalidEdges<TEdge>(args: {
    edges: Array<TEdge>;
    edgeIsNotValid: (edge: TEdge) => boolean;
}): Array<TEdge> {
    const { edges, edgeIsNotValid } = args;

    const invalidEdges = edges.filter((edge) => edgeIsNotValid(edge));

    return invalidEdges;
}
