import { describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/container.js";
import { eagerInitialization } from "@/di/implementations/graph.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";

describe("init & deInit", () => {
    const initExecutionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );

    test("throws when hooks are added after init", async () => {
        const container = new Container({
            executionContext: initExecutionContext,
        });
        await container.init();

        expect(() => {
            container.onContainerInit(() => {});
        }).toThrow();

        expect(() => {
            container.onContainerDeInit(() => {});
        }).toThrow();
    });

    test("double init", async () => {
        const container = new Container({
            executionContext: initExecutionContext,
        });
        await container.init();
        await expect(async () => {
            await container.init();
        }).rejects.toThrow();
    });

    test("deInit before init", async () => {
        const container = new Container({
            executionContext: initExecutionContext,
        });
        await expect(async () => {
            await container.deInit();
        }).rejects.toThrow();
    });

    test("double deInit", async () => {
        const container = new Container({
            executionContext: initExecutionContext,
        });
        await container.init();
        await container.deInit();
        await expect(async () => {
            await container.deInit();
        }).rejects.toThrow();
    });

    describe.todo(
        "error when container.{run|resolve*|register*|has|fork|overrideValue} called before init or after deInit",
    );
});

describe.todo("forbid double call on register*.{singleton|transient,scoped}");
describe.todo("forbid double  register* on same token");
describe.todo("forbid double  register* dynamic token again"); // Adjust path as needed

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
});

describe("register & resolve singleton", () => {
    const initExecutionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );

    test("register one singleton node then resolve it", async () => {
        const token = genericToken<string>("my-service");

        const container = new Container({
            executionContext: initExecutionContext,
        });
        const value = "hello world";

        container
            .registerFactory({
                token,
                factory: { invoke: () => value },
                deps: [],
            })
            .singleton();

        await container.init();

        const valueRetrieved = await container.resolve(token);
        expect(valueRetrieved).toBe(value);
    });

    test("singleton returns the same instance on multiple resolves", async () => {
        const token = genericToken<{ id: number }>("shared");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token,
                factory: {
                    invoke: () => {
                        return { id: 1 };
                    },
                },
                deps: [],
            })
            .singleton();

        await container.init();

        const result1 = await container.resolve(token);
        const result2 = await container.resolve(token);

        expect(result1).toBe(result2);
    });

    test("singleton with one singleton dependency", async () => {
        const tokenBase = genericToken<string>("base");
        const tokenDerived = genericToken<string>("derived");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenBase,
                factory: { invoke: () => "hello from B" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenDerived,
                factory: {
                    invoke: (b: string, _ctx: IExecutionContext) =>
                        `result: ${b}`,
                },
                deps: [tokenBase],
            })
            .singleton();

        await container.init();

        const resultDerived = await container.resolve(tokenDerived);
        expect(resultDerived).toBe("result: hello from B");

        const resultBase = await container.resolve(tokenBase);
        expect(resultBase).toBe("hello from B");
    });

    test("singleton chain: A -> B -> C", async () => {
        const tokenA = genericToken<string>("A");
        const tokenB = genericToken<string>("B");
        const tokenC = genericToken<string>("C");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenC,
                factory: { invoke: () => "base" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenB,
                factory: {
                    invoke: (c: string, _ctx: IExecutionContext) => `B(${c})`,
                },
                deps: [tokenC],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: string, _ctx: IExecutionContext) => `A(${b})`,
                },
                deps: [tokenB],
            })
            .singleton();

        await container.init();

        const resultA = await container.resolve(tokenA);
        expect(resultA).toBe("A(B(base))");

        const resultB = await container.resolve(tokenB);
        expect(resultB).toBe("B(base)");

        const resultC = await container.resolve(tokenC);
        expect(resultC).toBe("base");
    });

    test("diamond dependency: A depends on B and C, both depend on D", async () => {
        const tokenA = genericToken<string>("A");
        const tokenB = genericToken<string>("B");
        const tokenC = genericToken<string>("C");
        const tokenD = genericToken<string>("D");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenD,
                factory: { invoke: () => "root" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenB,
                factory: {
                    invoke: (d: string, _: IExecutionContext) => `B(${d})`,
                },
                deps: [tokenD],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenC,
                factory: {
                    invoke: (d: string, _: IExecutionContext) => `C(${d})`,
                },
                deps: [tokenD],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (a: string, b: string, _: IExecutionContext) =>
                        `A(${a},${b})`,
                },
                deps: [tokenB, tokenC],
            })
            .singleton();

        await container.init();

        const resultA = await container.resolve(tokenA);
        expect(resultA).toBe("A(B(root),C(root))");
    });

    test("multiple independent singletons", async () => {
        const tokenX = genericToken<number>("X");
        const tokenY = genericToken<number>("Y");
        const tokenZ = genericToken<number>("Z");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenX,
                factory: { invoke: () => 10 },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenY,
                factory: { invoke: () => 20 },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenZ,
                factory: { invoke: () => 30 },
                deps: [],
            })
            .singleton();

        await container.init();

        await expect(container.resolve(tokenX)).resolves.toBe(10);
        await expect(container.resolve(tokenY)).resolves.toBe(20);
        await expect(container.resolve(tokenZ)).resolves.toBe(30);
    });

    test("singleton with multiple deps at varying arg indices", async () => {
        const tokenGreeting = genericToken<string>("greeting");
        const tokenName = genericToken<string>("name");
        const tokenPunctuation = genericToken<string>("punct");
        const tokenMessage = genericToken<string>("message");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenGreeting,
                factory: { invoke: () => "Hello" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenName,
                factory: { invoke: () => "World" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenPunctuation,
                factory: { invoke: () => "!" },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenMessage,
                factory: {
                    invoke: (
                        greeting: string,
                        name: string,
                        punct: string,
                        _ctx: IExecutionContext,
                    ) => `${greeting}, ${name}${punct}`,
                },
                deps: [tokenGreeting, tokenName, tokenPunctuation],
            })
            .singleton();

        await container.init();

        const result = await container.resolve(tokenMessage);
        expect(result).toBe("Hello, World!");
    });
});

describe("register & resolve transient", () => {
    const initExecutionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );

    test("one transient node", async () => {
        const token = genericToken<string>("my-transient");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token,
                factory: { invoke: () => "transient value" },
                deps: [],
            })
            .transient();

        await container.init();

        const result = await container.resolve(token);
        expect(result).toBe("transient value");
    });

    test("two transient nodes (A -> B)", async () => {
        const tokenB = genericToken<string>("B");
        const tokenA = genericToken<string>("A");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenB,
                factory: { invoke: () => "base" },
                deps: [],
            })
            .transient();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: string, _ctx: IExecutionContext) => `A(${b})`,
                },
                deps: [tokenB],
            })
            .transient();

        await container.init();

        const resultA = await container.resolve(tokenA);
        expect(resultA).toBe("A(base)");

        const resultB = await container.resolve(tokenB);
        expect(resultB).toBe("base");
    });

    test("diamond dependency (all transient)", async () => {
        const tokenA = genericToken<string>("A");
        const tokenB = genericToken<string>("B");
        const tokenC = genericToken<string>("C");
        const tokenD = genericToken<string>("D");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenD,
                factory: { invoke: () => "root" },
                deps: [],
            })
            .transient();

        container
            .registerFactory({
                token: tokenB,
                factory: {
                    invoke: (d: string, _: IExecutionContext) => `B(${d})`,
                },
                deps: [tokenD],
            })
            .transient();

        container
            .registerFactory({
                token: tokenC,
                factory: {
                    invoke: (d: string, _: IExecutionContext) => `C(${d})`,
                },
                deps: [tokenD],
            })
            .transient();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: string, c: string, _: IExecutionContext) =>
                        `A(${b},${c})`,
                },
                deps: [tokenB, tokenC],
            })
            .transient();

        await container.init();

        const resultA = await container.resolve(tokenA);
        expect(resultA).toBe("A(B(root),C(root))");
    });

    test("transient A -> singleton B", async () => {
        const tokenB = genericToken<{ id: number }>("B");
        const tokenA = genericToken<string>("A");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenB,
                factory: { invoke: () => ({ id: 42 }) },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: { id: number }, _ctx: IExecutionContext) =>
                        `A(${b.id})`,
                },
                deps: [tokenB],
            })
            .transient();

        await container.init();

        const result1 = await container.resolve(tokenA);
        expect(result1).toBe("A(42)");

        const result2 = await container.resolve(tokenA);
        expect(result2).toBe("A(42)");

        // A is transient so each resolve produces a new A,
        // but B is singleton so it's the same instance
        // (both A results are string primitives, so value equality is fine)
        expect(result1).toBe(result2);
    });
});

describe("register & resolve scoped", () => {
    const initExecutionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );

    test("register one scoped node", async () => {
        const token = genericToken<string>("my-scoped");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token,
                factory: { invoke: () => "scoped value" },
                deps: [],
            })
            .scoped();

        await container.init();

        // Scoped resolution is not yet implemented (no run() method)
        // Only verifying registration doesn't throw
        expect(true).toBe(true);
    });

    test("register scoped with singleton dependency", async () => {
        const tokenB = genericToken<{ id: number }>("B");
        const tokenA = genericToken<string>("A");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenB,
                factory: { invoke: () => ({ id: 42 }) },
                deps: [],
            })
            .singleton();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: { id: number }, _ctx: IExecutionContext) =>
                        `A(${b.id})`,
                },
                deps: [tokenB],
            })
            .scoped();

        await container.init();

        // Only verifying registration doesn't throw
        expect(true).toBe(true);
    });

    test("register scoped with scoped dependency", async () => {
        const tokenB = genericToken<string>("B");
        const tokenA = genericToken<string>("A");

        const container = new Container({
            executionContext: initExecutionContext,
        });

        container
            .registerFactory({
                token: tokenB,
                factory: { invoke: () => "base" },
                deps: [],
            })
            .scoped();

        container
            .registerFactory({
                token: tokenA,
                factory: {
                    invoke: (b: string, _ctx: IExecutionContext) => `A(${b})`,
                },
                deps: [tokenB],
            })
            .scoped();

        await container.init();

        // Only verifying registration doesn't throw
        expect(true).toBe(true);
    });
});
