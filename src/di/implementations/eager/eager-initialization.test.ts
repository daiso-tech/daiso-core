import { describe, test, vi, expect } from "vitest";

import { eagerInitialization } from "@/di/implementations/eager/graph-algorithms.js";

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
