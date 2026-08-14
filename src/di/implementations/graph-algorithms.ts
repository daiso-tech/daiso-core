import { UnexpectedError } from "@/utilities/errors.js";

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

// TODO make few tests
export function findEffectedNodes<T>(args: {
    predecessorOf: (node: T) => Array<T>;
    startNodeId: T;
}): Array<T> {
    const effectedNodes = new Set<T>([args.startNodeId]);
    const queue = [args.startNodeId];

    while (queue.length > 0) {
        const node = queue.shift();

        if (node === undefined) {
            throw new Error();
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

// TODO make few tests
export function visitedNodes<T>(args: {
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

/**
 * Detects whether the directed graph contains a cycle using a three-color DFS.
 *
 * Colors:
 * - WHITE: not yet visited
 * - GRAY: currently on the DFS stack (on the path being explored)
 * - BLACK: fully explored, no cycle found through it
 *
 * If DFS reaches a GRAY node, a cycle exists.
 */

// TODO make few tests
export function cycleDetected<TNode>(args: {
    getSuccessor: (node: TNode) => Array<TNode>;
    nodes: Array<TNode>;
}): boolean {
    const { getSuccessor, nodes } = args;

    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<TNode, number>();

    for (const node of nodes) {
        color.set(node, WHITE);
    }

    const hasCycle = (startNode: TNode): boolean => {
        type TFrame = { node: TNode; successors: Array<TNode> };
        const stack: Array<TFrame> = [
            { node: startNode, successors: getSuccessor(startNode) },
        ];
        color.set(startNode, GRAY);

        while (stack.length > 0) {
            const frame = stack[stack.length - 1];

            if (frame === undefined) {
                throw new Error();
            }

            const successor = frame.successors.pop();

            if (successor === undefined) {
                color.set(frame.node, BLACK);
                stack.pop();
                continue;
            }

            const successorColor = color.get(successor) ?? WHITE;

            if (successorColor === GRAY) {
                return true;
            }

            if (successorColor === WHITE) {
                color.set(successor, GRAY);
                stack.push({
                    node: successor,
                    successors: getSuccessor(successor),
                });
            }
        }

        return false;
    };

    for (const node of nodes) {
        if (color.get(node) === WHITE && hasCycle(node)) {
            return true;
        }
    }

    return false;
}

/**
 * Checks whether any dependency (successor) of a node is not declared, meaning
 * the dependency graph is broken.
 *
 * Collects all unique successors across all nodes and verifies that each one
 * exists in the provided `nodes` list.
 */

// TODO make few tests
export function undeclaredNodesExist<TNode>(args: {
    getSuccessor: (node: TNode) => Array<TNode>;
    nodes: Array<TNode>;
}): boolean {
    const { getSuccessor, nodes } = args;

    const nodeSet = new Set<TNode>(nodes);
    if (nodeSet.size !== nodes.length) {
        throw new Error();
    }

    const dependencies = new Set<TNode>();

    for (const node of nodes) {
        for (const successor of getSuccessor(node)) {
            dependencies.add(successor);
        }
    }

    for (const dependency of dependencies) {
        if (!nodeSet.has(dependency)) {
            return true;
        }
    }

    return false;
}

/**
 * Checks whether any edge is invalid according to the DI lifespan rules.
 *
 * - singleton node can not point to transient or scoped
 * - scoped node can not point to transient
 * - transient node can not point to dynamic
 * - dynamic node can not point to any other node
 * - only scoped node can point to dynamic node
 *
 * Returns `true` when at least one invalid edge is found.
 */
// TODO make more general and create few test later
export function someEdgeIsInvalid<TEdge>(args: {
    edges: Array<TEdge>;
    edgeIsValid: (edge: TEdge) => boolean;
}): boolean {
    const { edges, edgeIsValid } = args;

    const hasInvalidEdge = edges.some((edge) => {
        // dynamic node can not point to any other node
        if (edgeIsValid(edge)) {
            return true;
        }
        return false;
    });

    return hasInvalidEdge;
}
