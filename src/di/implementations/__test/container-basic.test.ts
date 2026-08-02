import { beforeEach, describe, expect, test } from "vitest";

import {
    genericToken,
    type DiToken,
} from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";

type SimplifiedServiceFactoryWithVarArgs<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = (...args: TDeps) => Promise<TRegisteredType> | TRegisteredType;

type SimplifiedServiceFactoryWithArray<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = (args: TDeps) => Promise<TRegisteredType> | TRegisteredType;

type DepsTokens<TDeps extends Array<unknown> = Array<unknown>> = {
    [K in keyof TDeps]: DiToken<TDeps[K]>;
};

type FactoryRegistration<
    TDeps extends Array<unknown> = Array<unknown>,
    TRegisteredType = unknown,
> = {
    /** The token used to identify and resolve this service. */
    token: DiToken<TRegisteredType>;

    /** The factory function that creates the service instance. */
    factory: SimplifiedServiceFactoryWithArray<TDeps, TRegisteredType>;
    callFunc: SimplifiedServiceFactoryWithVarArgs<TDeps, TRegisteredType>;

    /** The dependency tokens to resolve and inject into the factory. */
    deps: DepsTokens<TDeps>;
};

function wrapInParenthesis(word: string, ...args: Array<unknown>): string {
    const str = args.join(",");
    return `${word}(${str})`;
}

function dependency<TDeps extends Array<unknown> = Array<unknown>>(
    ...deps: DepsTokens<TDeps>
): {
    factory: <TRegisteredType = unknown>(
        func: SimplifiedServiceFactoryWithVarArgs<TDeps, TRegisteredType>,
    ) => {
        token: (
            token: DiToken<TRegisteredType>,
        ) => FactoryRegistration<TDeps, TRegisteredType>;

        tokenDescription: (
            description: string,
        ) => FactoryRegistration<TDeps, TRegisteredType>;
    };
} {
    return {
        factory: (func) => {
            return {
                token: (token) => {
                    return {
                        deps,
                        factory: (fArgs) => func(...fArgs),
                        callFunc: func,
                        token,
                    };
                },
                tokenDescription: (text) => {
                    return {
                        deps,
                        factory: (fArgs) => func(...fArgs),
                        callFunc: func,
                        token: genericToken(text),
                    };
                },
            };
        },
    };
}

// TWO divide a diamond case into 2 cases: 1) multiple dependcy, multiple multiple dependee

describe("container", () => {
    let container: Container;
    beforeEach(() => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        container = new Container({ executionContext });
    });

    describe("init & deInit", () => {
        test("throws when hooks are added after init", async () => {
            await container.init();

            expect(() => {
                container.onContainerInit(() => {});
            }).toThrow();

            expect(() => {
                container.onContainerDeInit(() => {});
            }).toThrow();
        });

        test("double init", async () => {
            await container.init();
            await expect(async () => {
                await container.init();
            }).rejects.toThrow();
        });

        test("deInit before init", async () => {
            await expect(async () => {
                await container.deInit();
            }).rejects.toThrow();
        });

        test("double deInit", async () => {
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

    describe("double registration on same token should fail", () => {
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class A {}

        // TODO add test item for container.registerProvider
        test.each([
            {
                setUp: () => {
                    container
                        .registerFactory({
                            deps: [],
                            factory: () => new A(),
                            token: A,
                        })
                        .singleton();
                },
                type: "registerFactory.singleton",
            },
            {
                setUp: () => {
                    container
                        .registerFactory({
                            deps: [],
                            factory: () => new A(),
                            token: A,
                        })
                        .transient();
                },
                type: "registerFactory.transient",
            },
            {
                setUp: () => {
                    container
                        .registerFactory({
                            deps: [],
                            factory: () => new A(),
                            token: A,
                        })
                        .scoped();
                },
                type: "registerFactory.scoped",
            },
            {
                setUp: () => {
                    container.registerClass({ deps: [], impl: A }).scoped();
                },
                type: "registerClass",
            },
            {
                setUp: () => {
                    container.registerValue({ token: A, value: "_" });
                },
                type: "registerValue",
            },
            {
                setUp: () => {
                    container.registerDynamic(A);
                },
                type: "registerDynamic",
            },
        ])("$type", ({ setUp }) => {
            setUp();
            // TODO add specific error object
            expect(() => {
                container
                    .registerFactory({
                        deps: [],
                        factory: () => new A(),
                        token: A,
                    })
                    .singleton();
            }).toThrowError();

            expect(() => {
                container
                    .registerFactory({
                        deps: [],
                        factory: () => new A(),
                        token: A,
                    })
                    .transient();
            }).toThrowError();

            expect(() => {
                container
                    .registerFactory({
                        deps: [],
                        factory: () => new A(),
                        token: A,
                    })
                    .scoped();
            }).toThrowError();

            expect(() => {
                container.registerValue({ token: A, value: "_" });
            }).toThrowError();
        });
    });

    describe("singleton node", () => {
        test("register one singleton node then resolve it", async () => {
            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            container.registerFactory(nodeA).singleton();

            await container.init();

            await expect(
                container.resolve(nodeA.token),
            ).resolves.not.toThrowError();
        });

        describe("when resolved should return same reference", () => {
            test("unscoped", async () => {
                const nodeA = dependency()
                    .factory(() => ({}))
                    .tokenDescription("shared");

                container.registerFactory(nodeA).singleton();

                await container.init();

                const result1 = await container.resolve(nodeA.token);
                const result2 = await container.resolve(nodeA.token);

                expect(result1).toBe(result2);
            });

            test("scoped", async () => {
                const nodeA = dependency()
                    .factory(() => ({}))
                    .tokenDescription("shared");

                container.registerFactory(nodeA).singleton();

                await container.init();

                const resultA = await container.resolve(nodeA.token);

                // TODO ask yousef if ok have expect inside expect
                async function resolveWithinScope() {
                    await container.run({
                        scope: async () => {
                            const resultB = await container.resolve(
                                nodeA.token,
                            );
                            expect(resultB).toBe(resultA);

                            await container.run({
                                scope: async () => {
                                    const resultC = await container.resolve(
                                        nodeA.token,
                                    );
                                    expect(resultC).toBe(resultA);
                                },
                            });

                            await container.run({
                                scope: async () => {
                                    const resultD = await container.resolve(
                                        nodeA.token,
                                    );
                                    expect(resultD).toBe(resultA);
                                },
                            });
                        },
                    });
                }

                // TODO ask yousef if ok have expect inside expect
                await expect(resolveWithinScope()).resolves.not.toThrowError();
            });
        });

        test("singleton with one singleton dependency", async () => {
            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((arg) => wrapInParenthesis("B", arg))
                .tokenDescription("B");

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();

            await container.init();

            const resolvedA = await container.resolve(nodeA.token);
            const resolvedB = await container.resolve(nodeB.token);

            const correctA = await nodeA.callFunc();
            const correctB = await nodeB.callFunc(correctA);

            expect(resolvedA).toBe(correctA);
            expect(resolvedB).toBe(correctB);
        });

        test("singleton chain: A -> B -> C", async () => {
            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((arg) => wrapInParenthesis("B", arg))
                .tokenDescription("B");

            const nodeC = dependency(nodeB.token)
                .factory((arg) => wrapInParenthesis("C", arg))
                .tokenDescription("C");

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();
            container.registerFactory(nodeC).singleton();

            await container.init();

            const resolvedA = await container.resolve(nodeA.token);
            const resolvedB = await container.resolve(nodeB.token);
            const resolvedC = await container.resolve(nodeC.token);

            const correctA = await nodeA.callFunc();
            const correctB = await nodeB.callFunc(correctA);
            const correctC = await nodeC.callFunc(correctB);

            expect(resolvedA).toBe(correctA);
            expect(resolvedB).toBe(correctB);
            expect(resolvedC).toBe(correctC);
        });

        test("diamond dependency: A depends on B and C, both depend on D", async () => {
            const nodeD = dependency()
                .factory(() => `D`)
                .tokenDescription("D");

            const nodeB = dependency(nodeD.token)
                .factory((d) => wrapInParenthesis("B", d))
                .tokenDescription("B");

            const nodeC = dependency(nodeD.token)
                .factory((d) => wrapInParenthesis("C", d))
                .tokenDescription("C");

            const nodeA = dependency(nodeB.token, nodeC.token)
                .factory((a, b) => wrapInParenthesis("A", a, b))
                .tokenDescription("A");

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();
            container.registerFactory(nodeC).singleton();
            container.registerFactory(nodeD).singleton();

            const correctD = await nodeD.callFunc();
            const correctB = await nodeB.callFunc(correctD);
            const correctC = await nodeC.callFunc(correctD);
            const correctA = await nodeA.callFunc(correctB, correctC);

            await container.init();

            const resolvedA = await container.resolve(nodeA.token);
            const resolvedB = await container.resolve(nodeB.token);
            const resolvedC = await container.resolve(nodeC.token);
            const resolvedD = await container.resolve(nodeD.token);

            expect(resolvedD).toBe(correctD);
            expect(resolvedB).toBe(correctB);
            expect(resolvedA).toBe(correctA);
            expect(resolvedC).toBe(correctC);
        });

        // test("singleton with multiple deps at varying arg indices", async () => {
        //     const tokenGreeting = genericToken<string>("greeting");
        //     const tokenName = genericToken<string>("name");
        //     const tokenPunctuation = genericToken<string>("punct");
        //     const tokenMessage = genericToken<string>("message");

        //     container
        //         .registerFactory({
        //             token: tokenGreeting,
        //             factory: { invoke: () => "Hello" },
        //             deps: [],
        //         })
        //         .singleton();

        //     container
        //         .registerFactory({
        //             token: tokenName,
        //             factory: { invoke: () => "World" },
        //             deps: [],
        //         })
        //         .singleton();

        //     container
        //         .registerFactory({
        //             token: tokenPunctuation,
        //             factory: { invoke: () => "!" },
        //             deps: [],
        //         })
        //         .singleton();

        //     container
        //         .registerFactory({
        //             token: tokenMessage,
        //             factory: {
        //                 invoke: (args: [string, string, string]) =>
        //                     `${args[0]}, ${args[1]}${args[2]}`,
        //             },
        //             deps: [tokenGreeting, tokenName, tokenPunctuation],
        //         })
        //         .singleton();

        //     await container.init();

        //     const result = await container.resolve(tokenMessage);
        //     expect(result).toBe("Hello, World!");
        // });
    });

    describe("transient node", () => {
        test("register one transient node then resolve it should work", async () => {
            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            container.registerFactory(nodeA).transient();

            await container.init();

            await expect(
                container.resolve(nodeA.token),
            ).resolves.not.toThrowError();
        });

        test("register one transient node then resolve twice should return 2 different references", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .tokenDescription("A");

            container.registerFactory(nodeA).transient();

            await container.init();
            const resolvedA0 = await container.resolve(nodeA.token);
            const resolvedA1 = await container.resolve(nodeA.token);

            expect(resolvedA0).not.toBe(resolvedA1);
        });

        test("two transient nodes (A -> B)", async () => {
            const tokenB = genericToken<string>("B");
            const tokenA = genericToken<string>("A");

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
                        invoke: (args: [string]) => `A(${args[0]})`,
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
                        invoke: (args: [string]) => `B(${args[0]})`,
                    },
                    deps: [tokenD],
                })
                .transient();

            container
                .registerFactory({
                    token: tokenC,
                    factory: {
                        invoke: (args: [string]) => `C(${args[0]})`,
                    },
                    deps: [tokenD],
                })
                .transient();

            container
                .registerFactory({
                    token: tokenA,
                    factory: {
                        invoke: (args: [string, string]) =>
                            `A(${args[0]},${args[1]})`,
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
                        invoke: (args: [{ id: number }]) => `A(${args[0].id})`,
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

    describe("scoped node", () => {
        test("register one scoped node", async () => {
            const token = genericToken<string>("my-scoped");
            const scopedValue = "scoped value";

            container
                .registerFactory({
                    token,
                    factory: { invoke: () => scopedValue },
                    deps: [],
                })
                .scoped();

            await container.init();

            await container.run({
                scope: async () => {
                    const result = await container.resolve(token);
                    expect(result).toBe(scopedValue);
                },
            });
        });

        test("register scoped with singleton dependency", async () => {
            const tokenB = genericToken<{ id: number }>("B");
            const tokenA = genericToken<string>("A");
            const singletonValue = { id: 42 };
            const expectedA = `A(${singletonValue.id})`;

            container
                .registerFactory({
                    token: tokenB,
                    factory: { invoke: () => singletonValue },
                    deps: [],
                })
                .singleton();

            container
                .registerFactory({
                    token: tokenA,
                    factory: {
                        invoke: (args: [{ id: number }]) => {
                            const value = args[0].id;
                            return `A(${value})`;
                        },
                    },
                    deps: [tokenB],
                })
                .scoped();

            await container.init();

            await container.run({
                scope: async () => {
                    const result = await container.resolve(tokenA);
                    expect(result).toBe(expectedA);
                },
            });
        });

        test("register scoped with scoped dependency", async () => {
            const tokenB = genericToken<string>("B");
            const tokenA = genericToken<string>("A");

            const valueB = `B`;
            const valueA = `A(${valueB})`;
            container
                .registerFactory({
                    token: tokenB,
                    factory: { invoke: () => valueB },
                    deps: [],
                })
                .scoped();

            container
                .registerFactory({
                    token: tokenA,
                    factory: {
                        invoke: async (args: [string]) =>
                            Promise.resolve(`A(${args[0]})`),
                    },
                    deps: [tokenB],
                })
                .scoped();

            await container.init();
            await container.run({
                scope: async () => {
                    const valueA_ = await container.resolve(tokenA);
                    expect(valueA_).toBe(valueA);

                    const valueB_ = await container.resolve(tokenB);
                    expect(valueB_).toBe(valueB);
                },
            });
        });
    });

    describe.todo("singleton & transient node");

    describe.todo("singleton & scoped");

    describe.todo("scoped & transient");

    describe.todo("singleton & scoped & transient");

    describe("override", () => {
        test("simple override", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            container.overrideFactory(nodeAOverridden);

            await container.init();

            const correctA = await nodeAOverridden.callFunc();

            const resolvedA = await container.resolve(nodeAOverridden.token);

            expect(resolvedA).toBe(correctA);
        });

        // TODO remove test since covered by container.init()?
        test("override inside scoped run should fail", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            // container.overrideFactory(nodeAOverridden);

            await container.init();

            await expect(async () => {
                await container.run({
                    scope: () => {
                        container.overrideFactory(nodeAOverridden);
                    },
                });
            }).rejects.toThrowError();
        });

        test("when nonexistent node should throw", () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            expect(() => {
                container.overrideFactory(nodeA);
            }).toThrowError();
        });

        test("when after init should throw", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            await container.init();

            // TODO add specific error object
            expect(() => {
                container.overrideFactory(nodeAOverridden);
            }).toThrowError();
        });

        test("when dynamic node should throw", () => {
            const tokenA = genericToken<string>("dynamic");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(tokenA);

            container.registerDynamic(tokenA);

            // TODO add specific error object
            expect(() => {
                container.overrideFactory(nodeAOverridden);
            }).toThrowError();
        });

        test("when double should use latest override", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeAOverride1 = dependency()
                .factory(() => `Node A override first time`)
                .token(nodeA.token);

            const nodeAOverride2 = dependency()
                .factory(() => `Node A override second time`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            container.overrideFactory(nodeAOverride1);
            container.overrideFactory(nodeAOverride2);

            await container.init();

            const correctA = await nodeAOverride2.callFunc();

            const resolvedA = await container.resolve(nodeAOverride2.token);

            expect(resolvedA).toBe(correctA);
        });

        test("when override A where B -> A should effect both A and B value", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => wrapInParenthesis("B", a))
                .tokenDescription("B");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            container.registerFactory(nodeB).singleton();
            container.overrideFactory(nodeAOverridden);

            await container.init();

            const correctA = await nodeAOverridden.callFunc();
            const correctB = await nodeB.callFunc(correctA);

            const resolvedA = await container.resolve(nodeAOverridden.token);
            const resolvedB = await container.resolve(nodeB.token);

            expect(resolvedA).toBe(correctA);
            expect(resolvedB).toBe(correctB);
        });

        test("override B where B -> A should effect B but not A value", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => wrapInParenthesis("B", a))
                .tokenDescription("B");

            const nodeBOverridden = dependency(nodeA.token)
                .factory((a) => wrapInParenthesis("OverriddenB", a))
                .token(nodeB.token);

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();
            container.overrideFactory(nodeBOverridden);

            await container.init();

            const correctA = await nodeA.callFunc();
            const correctB = await nodeBOverridden.callFunc(correctA);

            const resolvedA = await container.resolve(nodeA.token);
            const resolvedB = await container.resolve(nodeBOverridden.token);

            expect(resolvedA).toBe(correctA);
            expect(resolvedB).toBe(correctB);
        });

        test("override A where B -> A -> C should not effect B value but effect both A and C value", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => wrapInParenthesis("B", a))
                .tokenDescription("B");

            const nodeC = dependency(nodeB.token)
                .factory((a) => wrapInParenthesis("C", a))
                .tokenDescription("C");

            const nodeAOverridden = dependency()
                .factory(() => `OverriddenA`)
                .token(nodeA.token);

            container.registerFactory(nodeA).singleton();

            container.registerFactory(nodeB).singleton();
            container.registerFactory(nodeC).singleton();
            container.overrideFactory(nodeAOverridden);

            await container.init();

            const correctA = await nodeAOverridden.callFunc();
            const correctB = await nodeB.callFunc(correctA);
            const correctC = await nodeC.callFunc(correctB);

            const resolvedA = await container.resolve(nodeAOverridden.token);
            const resolvedB = await container.resolve(nodeB.token);
            const resolvedC = await container.resolve(nodeC.token);

            expect(resolvedA).toBe(correctA);
            expect(resolvedB).toBe(correctB);
            expect(resolvedC).toBe(correctC);
        });

        test("override the dependency of B from B -> A to B -> C should effect only B", async () => {
            const nodeA = dependency()
                .factory(() => `A`)
                .tokenDescription("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => wrapInParenthesis("B", a))
                .tokenDescription("B");

            const nodeC = dependency()
                .factory(() => `C`)
                .tokenDescription("C");

            const overriddenNodeB = dependency(nodeC.token)
                .factory((a) => wrapInParenthesis("B", a))
                .token(nodeB.token);

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();
            container.registerFactory(nodeC).singleton();
            container.overrideFactory(overriddenNodeB);

            await container.init();

            const correctA = await nodeA.callFunc();
            const correctC = await nodeC.callFunc();
            const correctB = await nodeB.callFunc(correctC);
            const inCorrectB = await nodeB.callFunc(correctA);

            const resolvedA = await container.resolve(nodeA.token);
            const resolvedC = await container.resolve(nodeC.token);
            const resolvedB = await container.resolve(nodeB.token);

            expect(resolvedA).toBe(correctA);
            expect(resolvedC).toBe(correctC);
            expect(resolvedB).toBe(correctB);
            expect(resolvedB).not.toBe(inCorrectB);
        });

        describe("graph related checks", () => {
            test.todo(
                "override where invalid edge is created ( singleton -> transient|scoped)|(scoped -> transient) should fail",
            );

            test.todo("override where cycle is created should fail");

            test.todo(
                "override where dependency nodes do not exist should fail",
            );
        });

        test.todo("override node lifetime ?");

        test.todo("override + fork");
    });
});
