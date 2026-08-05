import { UndeclaredDependencyError } from "@/di/implementations/errors.js";

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
