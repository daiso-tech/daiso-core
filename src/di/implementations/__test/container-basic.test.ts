import { beforeEach, describe, expect, test } from "vitest";

import {
    genericToken,
    type DiToken,
} from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/container.js";
import {
    ContainerAlreadyInitializedException,
    ContainerNotActiveException,
} from "@/di/implementations/errors.js";
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

    describe("resolve unresolvable key", () => {
        const defaultValue = "_";

        type ResolveMethod = {
            name: string;
            description: string;
            invoke: (token: DiToken) => Promise<unknown>;
            assert: (promise: Promise<unknown>) => Promise<void>;
        };

        const resolveMethods: Array<ResolveMethod> = [
            {
                name: "resolve",
                description: "should return null",
                invoke: (token) => container.resolve(token),
                assert: async (promise) => {
                    await expect(promise).resolves.toBeNull();
                },
            },
            {
                name: "resolveOrFail",
                description: "should throw error",
                invoke: (token) => container.resolveOrFail(token),
                assert: async (promise) => {
                    await expect(promise).rejects.toThrowError();
                },
            },
            {
                name: "resolveOr",
                description: "should return defaultValue",
                invoke: (token) => container.resolveOr(token, defaultValue),
                assert: async (promise) => {
                    await expect(promise).resolves.toBe(defaultValue);
                },
            },
        ];

        describe("non existent key", () => {
            const setUp = (): DiToken => genericToken<string>("");

            test.each(resolveMethods)(
                "container.$name on nonexistent key $description",
                async ({ invoke, assert }) => {
                    const token = setUp();
                    await container.init();
                    await assert(invoke(token));
                },
            );
        });

        describe("existent but unresolvable key", () => {
            describe("unresolvable because transient node depends on scoped node", () => {
                const setUp = (): DiToken => {
                    const nodeA = dependency()
                        .factory(() => "")
                        .tokenDescription("A");

                    container.registerFactory(nodeA).scoped();
                    return nodeA.token;
                };

                test.each(resolveMethods)(
                    "container.$name on unresolvable key $description",
                    async ({ invoke, assert }) => {
                        const token = setUp();
                        await container.init();
                        await assert(invoke(token));
                    },
                );
            });

            describe("unresolvable because scoped node", () => {
                const setUp = (): DiToken => {
                    const nodeA = dependency()
                        .factory(() => "")
                        .tokenDescription("A");
                    const nodeB = dependency(nodeA.token)
                        .factory(() => "")
                        .tokenDescription("B");

                    container.registerFactory(nodeA).scoped();
                    container.registerFactory(nodeB).transient();
                    return nodeB.token;
                };

                test.each(resolveMethods)(
                    "container.$name on unresolvable key $description",
                    async ({ invoke, assert }) => {
                        const token = setUp();
                        await container.init();
                        await assert(invoke(token));
                    },
                );
            });
        });
    });

    describe("registration", () => {
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

        describe("registation with registerClass|registerFactory without (calling singleton|transient|scoped) and then runing should trough clear error message", () => {
            test("dynamic");
            test("class");
            test("factory");
            test("value");
        });

        describe("registation after init beside dynamic should fail.After dinit all should fail", () => {
            test("dynamic");
            test("class");
            test("factory");
            test("value");
        });
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

        describe("container.run|resolve|has can only be called after init before deInit", () => {
            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            const activeOnlyCases: Array<{
                methodName: string;
                invoke: () => Promise<unknown>;
            }> = [
                {
                    methodName: "run",
                    invoke: () => container.run({ scope: async () => {} }),
                },
                {
                    methodName: "resolve",
                    invoke: () => container.resolve(nodeA.token),
                },
                {
                    methodName: "has",
                    invoke: () => container.has(nodeA.token),
                },
            ];

            describe("before init", () => {
                test.each(activeOnlyCases)(
                    "container.$methodName should throw before init",
                    async ({ invoke }) => {
                        await expect(invoke()).rejects.toThrowError(
                            ContainerNotActiveException,
                        );
                    },
                );
            });

            describe("after deInit", () => {
                test.each(activeOnlyCases)(
                    "container.$methodName should throw after deInit",
                    async ({ invoke }) => {
                        container.registerFactory(nodeA).singleton();
                        await container.init();
                        await container.deInit();

                        await expect(invoke()).rejects.toThrowError(
                            ContainerNotActiveException,
                        );
                    },
                );
            });
        });

        describe("container.register*|override* can only be called before init", () => {
            // eslint-disable-next-line @typescript-eslint/no-extraneous-class
            class A {}

            const nodeA = dependency()
                .factory(() => "A")
                .tokenDescription("A");

            const beforeInitOnlyCases: Array<{
                methodName: string;
                invoke: () => void;
            }> = [
                {
                    methodName: "registerFactory",
                    invoke: () => {
                        container.registerFactory(nodeA).singleton();
                    },
                },
                {
                    methodName: "registerClass",
                    invoke: () => {
                        container.registerClass({ deps: [], impl: A }).scoped();
                    },
                },
                {
                    methodName: "registerValue",
                    invoke: () => {
                        container.registerValue({
                            token: nodeA.token,
                            value: "A",
                        });
                    },
                },
                {
                    methodName: "registerDynamic",
                    invoke: () => {
                        container.registerDynamic(nodeA.token);
                    },
                },
                {
                    methodName: "overrideFactory",
                    invoke: () => {
                        container.overrideFactory(nodeA);
                    },
                },
                {
                    methodName: "overrideClass",
                    invoke: () => {
                        container.overrideClass({ deps: [], impl: A });
                    },
                },
                {
                    methodName: "overrideValue",
                    invoke: () => {
                        container.overrideValue({
                            token: nodeA.token,
                            value: "A",
                        });
                    },
                },
            ];

            describe("after init", () => {
                test.each(beforeInitOnlyCases)(
                    "container.$methodName should throw after init",
                    async ({ invoke }) => {
                        container.registerFactory(nodeA).singleton();
                        await container.init();

                        expect(() => {
                            invoke();
                        }).toThrowError(ContainerAlreadyInitializedException);
                    },
                );
            });

            describe("after deInit", () => {
                test.each(beforeInitOnlyCases)(
                    "container.$methodName should throw after deInit",
                    async ({ invoke }) => {
                        container.registerFactory(nodeA).singleton();
                        await container.init();
                        await container.deInit();

                        expect(() => {
                            invoke();
                        }).toThrowError(ContainerAlreadyInitializedException);
                    },
                );
            });
        });
    });

    //TODO via forloop combo {singleton,transient,scoped} x {registerClass,registerFactory}
    //TODO check registerValue is singleton

    describe("singleton node", () => {
        test("each resolve should return same instance (by reference)", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .tokenDescription("A");

            container.registerFactory(nodeA).singleton();

            await container.init();

            const resultA = await container.resolve(nodeA.token);
            const resultB = await container.resolve(nodeA.token);
            let resultC: object | null = null;
            let resultD: object | null = null;
            let resultE: object | null = null;

            const runPromise = container.run({
                scope: async () => {
                    resultC = await container.resolve(nodeA.token);

                    await container.run({
                        scope: async () => {
                            resultD = await container.resolve(nodeA.token);
                        },
                    });

                    await container.run({
                        scope: async () => {
                            resultE = await container.resolve(nodeA.token);
                        },
                    });
                },
            });

            await expect(runPromise).resolves.not.toThrowError();
            expect(resultA).not.toBeNull();
            expect(resultA).toBe(resultB);
            expect(resultB).toBe(resultC);
            expect(resultC).toBe(resultD);
            expect(resultD).toBe(resultE);
        });

        test.todo(
            "when register one singleton node can resolve it",
            async () => {
                const nodeA = dependency()
                    .factory(() => "A")
                    .tokenDescription("A");

                container.registerFactory(nodeA).singleton();

                await container.init();

                await expect(
                    container.resolve(nodeA.token),
                ).resolves.not.toThrowError();
            },
        );

        describe.todo(
            "each resolve should return same instance (by reference)",
            () => {
                test.todo("outside run-scope", async () => {
                    const nodeA = dependency()
                        .factory(() => ({}))
                        .tokenDescription("shared");

                    container.registerFactory(nodeA).singleton();

                    await container.init();

                    const result1 = await container.resolve(nodeA.token);
                    const result2 = await container.resolve(nodeA.token);

                    expect(result1).toBe(result2);
                });
            },
        );

        test.todo("singleton with one singleton dependency", async () => {
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

        test.todo("singleton chain: A -> B -> C", async () => {
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

        test.todo(
            "diamond dependency: A depends on B and C, both depend on D",
            async () => {
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
            },
        );

        test.todo(
            "singleton with multiple deps at varying arg indices",
            async () => {
                const tokenGreeting = genericToken<string>("greeting");
                const tokenName = genericToken<string>("name");
                const tokenPunctuation = genericToken<string>("punct");
                const tokenMessage = genericToken<string>("message");

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
                            invoke: (args: [string, string, string]) =>
                                `${args[0]}, ${args[1]}${args[2]}`,
                        },
                        deps: [tokenGreeting, tokenName, tokenPunctuation],
                    })
                    .singleton();

                await container.init();

                const result = await container.resolve(tokenMessage);
                expect(result).toBe("Hello, World!");
            },
        );
    });

    describe("transient node", () => {
        test("each resolve should return new instance (by reference)", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .tokenDescription("A");

            container.registerFactory(nodeA).transient();

            await container.init();

            const resultA = await container.resolve(nodeA.token);
            const resultB = await container.resolve(nodeA.token);
            let resultC: object | null = null;
            let resultD: object | null = null;
            let resultE: object | null = null;

            const runPromise = container.run({
                scope: async () => {
                    resultC = await container.resolve(nodeA.token);

                    await container.run({
                        scope: async () => {
                            resultD = await container.resolve(nodeA.token);
                        },
                    });

                    await container.run({
                        scope: async () => {
                            resultE = await container.resolve(nodeA.token);
                        },
                    });
                },
            });

            await expect(runPromise).resolves.not.toThrowError();
            expect(resultA).not.toBeNull();
            expect(resultB).not.toBeNull();
            expect(resultC).not.toBeNull();
            expect(resultE).not.toBeNull();
            expect(resultD).not.toBeNull();

            const items = [resultA, resultB, resultC, resultE, resultD];
            const uniqueItems = new Set<object | null>(items);

            expect(uniqueItems).to.have.members(items);
        });

        test.todo(
            "when register one transient node can resolve it",
            async () => {
                const nodeA = dependency()
                    .factory(() => "A")
                    .tokenDescription("A");

                container.registerFactory(nodeA).transient();

                await container.init();

                await expect(
                    container.resolve(nodeA.token),
                ).resolves.not.toThrowError();
            },
        );

        describe.todo(
            "each resolve should return new instance (by reference)",
            () => {
                test("outside run-scope", async () => {
                    const nodeA = dependency()
                        .factory(() => ({}))
                        .tokenDescription("A");

                    container.registerFactory(nodeA).transient();

                    await container.init();
                    const resolvedA0 = await container.resolve(nodeA.token);
                    const resolvedA1 = await container.resolve(nodeA.token);

                    expect(resolvedA0).not.toBe(resolvedA1);
                });

                test("inside run-scope", async () => {
                    const nodeA = dependency()
                        .factory(() => ({}))
                        .tokenDescription("A");

                    container.registerFactory(nodeA).transient();

                    await container.init();

                    const resultA = await container.resolve(nodeA.token);

                    // TODO ask yousef if ok have expect inside expect
                    async function resolveWithinScope() {
                        await container.run({
                            scope: async () => {
                                const resultB = await container.resolve(
                                    nodeA.token,
                                );
                                expect(resultB).not.toBe(resultA);

                                await container.run({
                                    scope: async () => {
                                        const resultC = await container.resolve(
                                            nodeA.token,
                                        );
                                        expect(resultC).not.toBe(resultA);
                                    },
                                });

                                await container.run({
                                    scope: async () => {
                                        const resultD = await container.resolve(
                                            nodeA.token,
                                        );
                                        expect(resultD).not.toBe(resultA);
                                    },
                                });
                            },
                        });
                    }

                    // TODO ask yousef if ok have expect inside expect
                    await expect(
                        resolveWithinScope(),
                    ).resolves.not.toThrowError();
                });
            },
        );

        test.todo("two transient nodes (A -> B)", async () => {
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

        test.todo("diamond dependency (all transient)", async () => {
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

        test.todo("transient A -> singleton B", async () => {
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
        test("each resolve should return same instance (by reference) if resolved inside same run-scope block", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .tokenDescription("A");

            container.registerFactory(nodeA).scoped();

            await container.init();

            let resultA: object | null = null;
            let resultB: object | null = null;
            let resultC: object | null = null;
            let resultD: object | null = null;
            let resultE: object | null = null;
            let resultF: object | null = null;
            let resultG: object | null = null;

            const runPromise = container.run({
                scope: async () => {
                    resultA = await container.resolve(nodeA.token);

                    await container.run({
                        scope: async () => {
                            resultB = await container.resolve(nodeA.token);
                            resultC = await container.resolve(nodeA.token);
                        },
                    });

                    resultD = await container.resolve(nodeA.token);

                    await container.run({
                        scope: async () => {
                            resultE = await container.resolve(nodeA.token);
                            resultF = await container.resolve(nodeA.token);
                        },
                    });
                    resultG = await container.resolve(nodeA.token);
                },
            });

            await expect(runPromise).resolves.not.toThrowError();
            const nestedScope0Items = [resultA, resultD, resultG];
            const nestedScope1TopItems = [resultE, resultF];
            const nestedScope1BottomItems = [resultB, resultC];

            expect(nestedScope0Items[0]).toBe(nestedScope0Items[1]);
            expect(nestedScope0Items[1]).toBe(nestedScope0Items[2]);

            expect(nestedScope1TopItems[0]).toBe(nestedScope1TopItems[1]);
            expect(nestedScope1BottomItems[0]).toBe(nestedScope1BottomItems[1]);

            expect(nestedScope0Items[0]).not.toBe(nestedScope1TopItems[0]);

            expect(nestedScope1TopItems[0]).not.toBe(
                nestedScope1BottomItems[0],
            );
        });

        test("resolve outside run-scope should resolve to null", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .tokenDescription("A");

            container.registerFactory(nodeA).scoped();

            await container.init();

            const resultA = await container.resolve(nodeA.token);
            expect(resultA).toBe(null);
        });

        test.todo("register scoped with singleton dependency", async () => {
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

        test.todo("register scoped with scoped dependency", async () => {
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

    describe("dynamic node", () => {
        test("after registering dynamic node and its value it can be resolved", async () => {
            const nodeA = genericToken<string>("nodeA");
            container.registerDynamic(nodeA);
            const literalString = "A";

            let resultA: string | null = null;
            await container.init();

            await container.run({
                scope: async () => {
                    resultA = await container.resolve(nodeA);
                },

                dynamicRegistration: {
                    invoke: async (register) => {
                        await register.set({
                            token: nodeA,
                            value: literalString,
                        });
                    },
                },
            });

            expect(resultA).toEqual(literalString);
        });

        // ask Yousef if correct behavior
        test("registering value for dynamic twice value should cause failure", async () => {
            const nodeA = genericToken<string>("nodeA");
            container.registerDynamic(nodeA);
            const literalString = "A";

            await container.init();

            await expect(() =>
                container.run({
                    scope: async () => container.resolve(nodeA),

                    dynamicRegistration: {
                        invoke: async (register) => {
                            await register.set({
                                token: nodeA,
                                value: literalString,
                            });

                            await register.set({
                                token: nodeA,
                                value: literalString,
                            });
                        },
                    },
                }),
            ).rejects.toThrowError();
        });
    });

    // TODO divide to much smaller test per situation
    // inner comment to test names
    test("complex singleton & transient node", async () => {
        // singleton
        const nodeA = dependency()
            .factory(() => ({}))
            .tokenDescription("A");

        // scoped -> singleton
        const nodeB = dependency(nodeA.token)
            .factory((a) => ({ a }))
            .tokenDescription("B");

        // transient -> scoped -> singleton
        const nodeC = dependency(nodeB.token)
            .factory((b) => ({ b }))
            .tokenDescription("C");

        // transient -> singleton
        const nodeE = dependency(nodeA.token)
            .factory((a) => ({ a }))
            .tokenDescription("E");

        container.registerFactory(nodeA).singleton();
        container.registerFactory(nodeB).scoped();
        container.registerFactory(nodeC).transient();
        container.registerFactory(nodeE).transient();

        await container.init();

        // // test case 0.1: transient -> scoped should resolve to null when resolved without run-scope block
        // await expect(async () =>
        //     container.resolve(nodeC.token),
        // ).rejects.toThrowError();

        // test case 0.2: transient -> singleton should not fail when resolved without run-scope block
        await expect(
            container.resolve(nodeE.token),
        ).resolves.not.toThrowError();

        const resultE = await container.resolve(nodeE.token);
        const resultA = await container.resolve(nodeA.token);

        // test case 1: except reference of resultE.a to be same as resultA
        expect(resultE).not.toBeNull();
        expect(resultE?.a).toBe(resultA);

        let resultB0 = null as Awaited<ReturnType<typeof nodeB.factory>> | null;
        let resultC0 = null as Awaited<ReturnType<typeof nodeC.factory>> | null;

        let resultB1 = null as Awaited<ReturnType<typeof nodeB.factory>> | null;
        let resultC1 = null as Awaited<ReturnType<typeof nodeC.factory>> | null;

        let resultB2 = null as Awaited<ReturnType<typeof nodeB.factory>> | null;
        let resultC2 = null as Awaited<ReturnType<typeof nodeC.factory>> | null;

        await container.run({
            scope: async () => {
                resultB0 = await container.resolve(nodeB.token);
                resultC0 = await container.resolve(nodeC.token);
                await container.run({
                    scope: async () => {
                        resultB1 = await container.resolve(nodeB.token);
                        resultC1 = await container.resolve(nodeC.token);
                    },
                });

                await container.run({
                    scope: async () => {
                        resultB2 = await container.resolve(nodeB.token);
                        resultC2 = await container.resolve(nodeC.token);
                    },
                });
            },
        });

        //test case 2: except reference of resultB.a to be same as resultA
        expect(resultB0).not.toBeNull();
        expect(resultB0?.a).toBe(resultA);

        // test case 3.1: except reference of resultC0.b to be same as resultB0
        // test case 3.2: except reference of resultC1.b to be same as resultB1
        // test case 3.3: except reference of resultC2.b to be same as resultB2

        expect(resultC0).not.toBeNull();
        expect(resultC0?.b).toBe(resultB0);

        expect(resultC1).not.toBeNull();
        expect(resultB1).not.toBeNull();
        expect(resultC1?.b).toBe(resultB1);

        expect(resultC2).not.toBeNull();
        expect(resultB2).not.toBeNull();
        expect(resultC2?.b).toBe(resultB2);

        // test case 4.1: except reference of resultC0.b to be not same as resultC1.b
        // test case 4.2: except reference of resultC1.b to be not same as resultC2.b
        expect(resultC0?.b).not.toBe(resultC1?.b);
        expect(resultC1?.b).not.toBe(resultC2?.b);
    });

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

        test.todo("override after init fails");
    });
});
