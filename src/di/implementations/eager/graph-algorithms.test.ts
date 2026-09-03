import { describe, test, expect, vi } from "vitest";

import {
    findAllCycles,
    findEffectedNodes,
    getMissingNodes,
    visitedNodes,
    eagerInitialization,
} from "@/di/implementations/eager/graph-algorithms.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

/**
 * Builds a `predecessorOf` function from a dependency map where
 * `dependencies[node]` lists the dependencies of `node`.
 */
function predecessorsFromDependencies(
    dependencies: Record<string, Array<string>>,
): (node: string) => Array<string> {
    return (node) =>
        Object.entries(dependencies)
            .filter(([, deps]) => deps.includes(node))
            .map(([dependent]) => dependent);
}

describe("findEffectedNodes", () => {
    test("should return only the start node when nothing depends on it", () => {
        const result = findEffectedNodes({
            predecessorOf: predecessorsFromDependencies({
                A: [],
                B: [],
            }),
            startNodeId: "A",
        });

        expect(result).toEqual(["A"]);
    });

    test("should return all transitively affected nodes", () => {
        // A depends on C, B depends on C, D depends on A.
        const result = findEffectedNodes({
            predecessorOf: predecessorsFromDependencies({
                A: ["C"],
                B: ["C"],
                D: ["A"],
            }),
            startNodeId: "C",
        });

        expect(new Set(result)).toEqual(new Set(["C", "A", "B", "D"]));
    });

    test("should not include duplicate nodes in a diamond", () => {
        // A and B both depend on C; D depends on both A and B.
        const result = findEffectedNodes({
            predecessorOf: predecessorsFromDependencies({
                A: ["C"],
                B: ["C"],
                D: ["A", "B"],
            }),
            startNodeId: "C",
        });

        expect(new Set(result)).toEqual(new Set(["C", "A", "B", "D"]));
        expect(result.length).toBe(4);
    });

    test("should terminate on a cyclic dependency graph", () => {
        const result = findEffectedNodes({
            predecessorOf: predecessorsFromDependencies({
                A: ["B"],
                B: ["A"],
            }),
            startNodeId: "A",
        });

        expect(new Set(result)).toEqual(new Set(["A", "B"]));
    });
});

describe("visitedNodes", () => {
    test("should return the start node when it has no neighbors", () => {
        const result = visitedNodes({
            node: "A",
            getNeighbors: () => [],
        });

        expect(result).toEqual(["A"]);
    });

    test("should visit all reachable nodes depth-first", () => {
        const neighbors: Record<string, Array<string>> = {
            A: ["B", "C"],
            B: ["D"],
            C: [],
            D: [],
        };

        const result = visitedNodes({
            node: "A",
            getNeighbors: (n) => neighbors[n] ?? [],
        });

        expect(new Set(result)).toEqual(new Set(["A", "B", "C", "D"]));
    });

    test("should terminate on a cycle", () => {
        const neighbors: Record<string, Array<string>> = {
            A: ["B"],
            B: ["A"],
        };

        const result = visitedNodes({
            node: "A",
            getNeighbors: (n) => neighbors[n] ?? [],
        });

        expect(new Set(result)).toEqual(new Set(["A", "B"]));
    });

    test("should stop exploring a branch when breakBranchSearch returns true for the current node", () => {
        const neighbors: Record<string, Array<string>> = {
            A: ["B", "C"],
            B: ["D"],
            C: ["E"],
            D: [],
            E: [],
        };

        const result = visitedNodes({
            node: "A",
            getNeighbors: (n) => neighbors[n] ?? [],
            breakBranchSearch: (n) => n === "B",
        });

        // B's branch (D) is not explored; C and E still are.
        expect(new Set(result)).toEqual(new Set(["A", "B", "C", "E"]));
    });
});

describe("findAllCycles", () => {
    test("should return no cycles for an acyclic graph", () => {
        const result = findAllCycles({
            getSuccessor: (n) => (n === "A" ? ["B"] : n === "B" ? ["C"] : []),
            nodes: ["A", "B", "C"],
        });

        expect(result).toEqual([]);
    });

    test("should detect a single cycle", () => {
        const result = findAllCycles({
            getSuccessor: (n) => (n === "A" ? ["B"] : ["A"]),
            nodes: ["A", "B"],
        });

        expect(result).toEqual([["A", "B"]]);
    });

    test("should detect multiple independent cycles", () => {
        const result = findAllCycles({
            getSuccessor: (n) => {
                if (n === "A") return ["B"];
                if (n === "B") return ["A"];
                if (n === "C") return ["D"];
                return ["C"];
            },
            nodes: ["A", "B", "C", "D"],
        });

        expect(result).toHaveLength(2);
        expect(result).toEqual(
            expect.arrayContaining([
                ["A", "B"],
                ["C", "D"],
            ]),
        );
    });

    test("should detect a self-loop", () => {
        const result = findAllCycles({
            getSuccessor: () => ["A"],
            nodes: ["A"],
        });

        expect(result).toEqual([["A"]]);
    });
});

describe("getMissingNodes", () => {
    test("should return an empty array when all dependencies are declared", () => {
        const result = getMissingNodes({
            getSuccessor: (n) => (n === "A" ? ["B"] : []),
            nodes: ["A", "B"],
        });

        expect(result).toEqual([]);
    });

    test("should return missing dependencies with their dependents", () => {
        const result = getMissingNodes({
            getSuccessor: (n) => {
                if (n === "A") return ["C", "B"];
                if (n === "B") return ["D"];
                return [];
            },
            nodes: ["A", "B"],
        });

        expect(result).toEqual([
            { missingDependency: "C", dependents: ["A"] },
            { missingDependency: "D", dependents: ["B"] },
        ]);
    });

    test("should group multiple dependents of the same missing dependency", () => {
        const result = getMissingNodes({
            getSuccessor: (n) => (n === "A" || n === "B" ? ["C"] : []),
            nodes: ["A", "B"],
        });

        expect(result).toEqual([
            { missingDependency: "C", dependents: ["A", "B"] },
        ]);
    });

    test("should throw when nodes contain duplicates", () => {
        expect(() =>
            getMissingNodes({
                getSuccessor: () => [],
                nodes: ["A", "A"],
            }),
        ).toThrow(UnexpectedError);
    });
});

describe("eagerInitialization", () => {
    test("should initialize nodes in correct dependency order", async () => {
        // Graph: A -> B -> C
        const nodeIds = ["A", "B", "C"];
        const neighbors: Record<string, Array<string>> = {
            A: ["B"],
            B: ["C"],
            C: [],
        };

        const executionOrder: Array<string> = [];
        const initNode = vi.fn().mockImplementation((id: string) => {
            executionOrder.push(id);
        });

        await eagerInitialization({
            nodeIds,
            getSuccessors: (id) => neighbors[id] ?? [],
            getPredecessors: (id) =>
                Object.entries(neighbors)
                    .filter(([_, deps]) => deps.includes(id))
                    .map(([node]) => node),
            initNode,
        });

        // A depends on B, B depends on C.
        // Correct order: C (no deps) first, then B, then A.
        expect(executionOrder).toEqual(["C", "B", "A"]);
        expect(initNode).toHaveBeenCalledTimes(3);
    });

    test("should run independent nodes in the same wave concurrently", async () => {
        // Graph: A -> C, B -> C (A and B both depend on C)
        // Correct order: C (no deps) in wave 1, then A and B concurrently in wave 2.
        const nodeIds = ["A", "B", "C"];
        const neighbors: Record<string, Array<string>> = {
            A: ["C"],
            B: ["C"],
            C: [],
        };

        const activeExecutions = new Set<string>();
        let maxConcurrentInWave2 = 0;

        const initNode = vi.fn().mockImplementation(async (id: string) => {
            activeExecutions.add(id);

            if (id === "A" || id === "B") {
                maxConcurrentInWave2 = Math.max(
                    maxConcurrentInWave2,
                    activeExecutions.size,
                );
            }

            // Simulate async work
            await new Promise((resolve) => setTimeout(resolve, 10));
            activeExecutions.delete(id);
        });

        await eagerInitialization({
            nodeIds,
            getSuccessors: (id) => neighbors[id] ?? [],
            getPredecessors: (id) =>
                Object.entries(neighbors)
                    .filter(([_, deps]) => deps.includes(id))
                    .map(([node]) => node),
            initNode,
        });

        // Wave 2 should have initialized A and B concurrently
        expect(maxConcurrentInWave2).toBe(2);
        expect(initNode).toHaveBeenCalledWith("C");
        expect(initNode).toHaveBeenCalledWith("A");
        expect(initNode).toHaveBeenCalledWith("B");
    });

    test("should handle disjoint/unconnected nodes correctly", async () => {
        // Graph: A, B, C (No edges)
        const nodeIds = ["A", "B", "C"];
        const initializedNodes: Array<string> = [];

        await eagerInitialization({
            nodeIds,
            getSuccessors: () => [],
            getPredecessors: () => [],
            initNode: (id) => {
                initializedNodes.push(id);
            },
        });

        expect(initializedNodes.sort()).toEqual(["A", "B", "C"]);
    });

    test("should handle an empty graph gracefully", async () => {
        const initNode = vi.fn();

        await eagerInitialization({
            nodeIds: [],
            getSuccessors: () => [],
            getPredecessors: () => [],
            initNode,
        });

        expect(initNode).not.toHaveBeenCalled();
    });

    test("should fail when nodes remain blocked by unresolved dependencies", async () => {
        // Graph: A -> B, B -> A (a cycle). Neither node can be initialized.
        const nodeIds = ["A", "B"];
        const neighbors: Record<string, Array<string>> = {
            A: ["B"],
            B: ["A"],
        };

        const initNode = vi.fn();

        const promise = eagerInitialization({
            nodeIds,
            getSuccessors: (id) => neighbors[id] ?? [],
            getPredecessors: (id) =>
                Object.entries(neighbors)
                    .filter(([_, deps]) => deps.includes(id))
                    .map(([node]) => node),
            initNode,
        });

        await expect(promise).rejects.toThrow(
            /nodes "A", "B" could not be initialized/,
        );
        expect(initNode).not.toHaveBeenCalled();
    });
});
