import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    genericToken,
    type DiToken,
    type IContainer,
    type IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import {
    ContainerAlreadyInitializedException,
    ContainerNotActiveException,
    MethodCallInsideRunError,
    ServiceExistsDiError,
    MethodOutsideOfRunError,
    MethodCallInsideDynamicRegistrationError,
    ServiceCanNotBeResolvedError,
} from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/container.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
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
        reuseToken: (
            token: DiToken<TRegisteredType>,
        ) => FactoryRegistration<TDeps, TRegisteredType>;

        createToken: (
            description: string,
        ) => FactoryRegistration<TDeps, TRegisteredType>;
    };
} {
    return {
        factory: (func) => {
            return {
                reuseToken: (token) => {
                    return {
                        deps,
                        factory: (fArgs) => func(...fArgs),
                        callFunc: func,
                        token,
                    };
                },
                createToken: (text) => {
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

function createContainer(): {
    container: IContainer;
    executionContext: IExecutionContext;
} {
    const executionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );
    const container = new Container({ executionContext });
    return { container, executionContext };
}

describe("illegal method call before init or after deInit (when container not active)", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    type TestData = {
        func: () => Promise<void>;
        name: string;
    };
    const createTokens = [() => genericToken<string>("_")];
    const testCases1: Array<TestData> = createTokens.flatMap(
        (createToken) =>
            [
                {
                    func: async () => {
                        const token = createToken();
                        await container.resolve(token);
                    },
                    name: "resolve",
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.resolveOr(token, "_");
                    },
                    name: "resolveOr",
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.resolveOrFail(token);
                    },
                    name: "resolveOrFail",
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.has(token);
                    },
                    name: "has",
                },
            ] satisfies Array<TestData>,
    );

    const testCases2: Array<TestData> = [
        {
            func: async () => {
                await container.deInit();
            },
            name: "deInit",
        },
        {
            func: async () => {
                await container.run({
                    scope: () => {},
                });
            },
            name: "run",
        },
    ];

    const testCases = [...testCases1, ...testCases2];

    test.each(testCases)(
        "When $name is called before init then should fail with ContainerNotActiveException",
        async (testCase) => {
            await expect(testCase.func()).rejects.toThrowError(
                ContainerNotActiveException,
            );
        },
    );

    test.each(testCases)(
        "When $name is called after init then should not fail with ContainerNotActiveException",
        async (testCase) => {
            await container.init();
            await expect(async () => {
                let error = null;
                try {
                    await testCase.func();
                } catch (unknownError) {
                    error = unknownError;
                }
                throw error;
            }).rejects.not.toThrowError(ContainerNotActiveException);
        },
    );

    test.each(testCases)(
        "When $name is called after deInit then should fail with ContainerNotActiveException",
        async (testCase) => {
            await container.init();
            await container.deInit();
            await expect(testCase.func()).rejects.toThrowError(
                ContainerNotActiveException,
            );
        },
    );
});

describe("illegal method call after init (when container is active)", () => {
    class A {
        private: unknown;
    }
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    type TestData = {
        func: () => Promise<void> | void;
        name: string;
    };

    const allRegistration = [
        {
            func: () => {
                container
                    .registerFactory({
                        deps: [],
                        factory: () => new A(),
                        token: A,
                    })
                    .singleton();
            },

            name: "registerFactory.singleton",
        },
        {
            func: () => {
                container
                    .registerClass({
                        deps: [],
                        impl: A,
                    })
                    .singleton();
            },

            name: "registerClass.singleton",
        },
        {
            func: () => {
                container.registerDynamic(A);
            },
            name: "registerDynamic",
        },
        {
            func: () => {
                container.registerValue({ token: A, value: new A() });
            },
            name: "registerValue",
        },
        {
            func: () => {
                container.registerProvider(() => {});
            },
            name: "registerProvider",
        },
    ];

    const containerHooks: Array<TestData> = [
        {
            func() {
                container.onContainerInit(() => {});
            },
            name: "onContainerInit",
        },
        {
            func() {
                container.onContainerDeInit(() => {});
            },
            name: "onContainerDeInit",
        },
    ];

    const overrides: Array<TestData> = [
        {
            func() {
                container.overrideClass({ deps: [], impl: A });
            },
            name: "overrideClass",
        },
        {
            func() {
                container.overrideFactory({
                    deps: [],
                    token: A,
                    factory: () => new A(),
                });
            },
            name: "overrideFactory",
        },
        {
            func() {
                container.overrideValue({ token: A, value: new A() });
            },
            name: "overrideValue",
        },
    ];

    const init: Array<TestData> = [
        {
            async func() {
                await container.init();
            },
            name: "init",
        },
    ];

    const fork: Array<TestData> = [
        {
            func() {
                container.fork();
            },
            name: "fork",
        },
    ];

    const testCases: Array<TestData> = [
        ...allRegistration,
        ...containerHooks,
        ...init,
        ...overrides,
        ...fork,
    ];

    test.each(testCases)(
        "When $name is called after init then should fail",
        async (testCase) => {
            await container.init();
            await expect(async () => {
                await testCase.func();
            }).rejects.toThrowError(ContainerAlreadyInitializedException);
        },
    );
});

describe("illegal method call inside run", () => {
    test("fork method call inside run should fail", async () => {
        const container = createContainer().container;
        await container.init();

        await expect(() =>
            container.run({
                scope: async () => {
                    await container.deInit();
                },
            }),
        ).rejects.toThrow(MethodCallInsideRunError);
    });
});

describe("illegal method call inside DynamicServiceProvider in run block", () => {
    test("resolve method should fail inside DynamicServiceProvider", async () => {
        const container = createContainer().container;
        await container.init();
        const tokenA = genericToken("A");

        await expect(() =>
            container.run({
                dynamicRegistration: async () => {
                    await container.resolve(tokenA);
                },
                scope: async () => {},
            }),
        ).rejects.toThrow(MethodCallInsideDynamicRegistrationError);
    });

    test("resolveOr method should fail inside DynamicServiceProvider", async () => {
        const container = createContainer().container;
        await container.init();
        const tokenA = genericToken("A");

        await expect(() =>
            container.run({
                dynamicRegistration: async () => {
                    await container.resolveOr(tokenA, "_");
                },
                scope: async () => {},
            }),
        ).rejects.toThrow(MethodCallInsideDynamicRegistrationError);
    });

    test("resolveOrFail method should fail inside DynamicServiceProvider", async () => {
        const container = createContainer().container;
        await container.init();
        const tokenA = genericToken("A");

        await expect(() =>
            container.run({
                dynamicRegistration: async () => {
                    await container.resolveOrFail(tokenA);
                },
                scope: async () => {},
            }),
        ).rejects.toThrow(MethodCallInsideDynamicRegistrationError);
    });
});

describe("illegal method call outside run", () => {
    test("DynamicServiceProvider.set()", async () => {
        const container = createContainer().container;
        await container.init();
        let regCapture: IDynamicServiceRegister | null =
            null as IDynamicServiceRegister | null;
        await container.run({
            dynamicRegistration: (reg) => {
                regCapture = reg;
            },
            scope: () => {},
        });
        const token = genericToken("_");
        await expect(async () => {
            await regCapture?.set({ token, value: "_" });
        }).rejects.toThrowError(MethodOutsideOfRunError);
    });
});

describe("onContainerInit & init", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("should register all and call init hooks in correct order", async () => {
        const spyFunc0 = vi.fn();
        const spyFunc1 = vi.fn();
        const spyFunc2 = vi.fn();

        container.onContainerInit(spyFunc0);
        container.onContainerInit(spyFunc1);
        container.onContainerInit(spyFunc2);

        await container.init();
        expect(spyFunc0).toHaveBeenCalledBefore(spyFunc1);
        expect(spyFunc1).toHaveBeenCalledBefore(spyFunc2);
    });

    test("should resolve successfully in init handler", async () => {
        const nodeA = dependency()
            .factory(() => "_")
            .createToken("A");

        container.registerFactory(nodeA).singleton();
        let value: string | null | undefined = undefined as
            | string
            | null
            | undefined;

        container.onContainerInit(async (serviceResolver) => {
            value = await serviceResolver.resolve(nodeA.token);
        });

        await container.init();
        expect(value).toBe(await nodeA.callFunc());
    });
});

describe("onContainerDeInit & deInit", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("should register all and call deInit hooks in correct order", async () => {
        const spyFunc0 = vi.fn();
        const spyFunc1 = vi.fn();
        const spyFunc2 = vi.fn();

        container.onContainerDeInit(spyFunc0);
        container.onContainerDeInit(spyFunc1);
        container.onContainerDeInit(spyFunc2);

        await container.init();
        await container.deInit();

        expect(spyFunc0).toHaveBeenCalledBefore(spyFunc1);
        expect(spyFunc1).toHaveBeenCalledBefore(spyFunc2);
    });

    test("should resolve successfully in deInit handler", async () => {
        const nodeA = dependency()
            .factory(() => "_")
            .createToken("A");

        container.registerFactory(nodeA).singleton();
        let value: string | null | undefined = undefined as
            | string
            | null
            | undefined;

        container.onContainerDeInit(async (serviceResolver) => {
            value = await serviceResolver.resolve(nodeA.token);
        });

        await container.init();
        await container.deInit();

        expect(value).toBe(await nodeA.callFunc());
    });
});

describe("has", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("should return true when called on singleton node", async () => {
        const nodeA = dependency()
            .factory(() => "_")
            .createToken("A");

        container.registerFactory(nodeA).singleton();
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(true);
    });

    test("should return true when called on transient node", async () => {
        const nodeA = dependency()
            .factory(() => "_")
            .createToken("A");

        container.registerFactory(nodeA).transient();
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(true);
    });

    test("should return false when called on scoped node at top", async () => {
        const nodeA = dependency()
            .factory(() => "_")
            .createToken("A");

        container.registerFactory(nodeA).scoped();
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(false);
    });

    test("should return false when called on dynamic node at top", async () => {
        const tokenA = genericToken<string>("A");

        container.registerDynamic(tokenA);
        await container.init();

        const value = await container.has(tokenA);
        expect(value).toBe(false);
    });
});

describe("register", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("When token registered twice should fail with ServiceExistsDiError", () => {
        const node = dependency()
            .factory(() => "")
            .createToken("");
        container.registerFactory(node).singleton();
        expect(() => {
            container.registerFactory(node).singleton();
        }).toThrowError(ServiceExistsDiError);
    });
});

describe("resolve & container.init & container.run", () => {
    let container: IContainer;
    let tokenA: DiToken<string>;
    beforeEach(async () => {
        container = createContainer().container;
        tokenA = genericToken<string>("token");
        await container.init();
    });

    describe("nonexistent token", () => {
        test("should return null when resolving nonexistent token at top with container.resolve", async () => {
            await expect(container.resolve(tokenA)).resolves.toBe(null);
        });

        /**
         * container.resolveOrFail can be implemented as:
         * ```ts
         * declare const token:DiToken;
         * declare const defaultValue:unknown;
         *
         * const value = container.resolve(token)
         * if (value === null) {
         *  throw new Error
         * }
         * ```
         * This behaviour should be same for singleton, transient, scoped, dynamic and transient tokens.
         */
        test("should fail when resolving nonexistent at top with container.resolveOrFail", async () => {
            await expect(async () =>
                container.resolveOrFail(tokenA),
            ).rejects.toThrowError(ServiceCanNotBeResolvedError);
        });

        /**
         * container.resolveOr can be implemented as:
         * ```ts
         * declare const token:DiToken;
         * declare const defaultValue:unknown;
         *
         * const value = container.resolve(token)
         * return value !== null ? value : defaultValue
         * ```
         * This behaviour should be same for all singleton,transient,scoped,dynamic and transient tokens.
         */
        test("should return default value when resolving nonexistent at top with container.resolveOr", async () => {
            const defaultValue = "_";
            await expect(
                container.resolveOr(tokenA, defaultValue),
            ).resolves.toBe(defaultValue);
        });

        test("should return null when resolving nonexistent token inside run block scope with with container.resolve", async () => {
            let value: undefined | string | null = undefined as
                | undefined
                | string
                | null;

            await container.run({
                scope: async () => {
                    value = await container.resolve(tokenA);
                },
            });

            expect(value).toBe(null);
        });

        test("should fail when resolving nonexistent inside run block scope with with container.resolveOrFail", async () => {
            await expect(async () =>
                container.run({
                    scope: async () => {
                        return await container.resolveOrFail(tokenA);
                    },
                }),
            ).rejects.toThrowError(ServiceCanNotBeResolvedError);
        });

        test("should return default value when resolving nonexistent token inside run block scope with container.resolveOr", async () => {
            const defaultValue = "_";
            let value: undefined | string = undefined as undefined | string;

            await container.run({
                scope: async () => {
                    value = await container.resolveOr(tokenA, defaultValue);
                },
            });

            expect(value).toBe(defaultValue);
        });
    });
});

describe("register & container.init & resolve", () => {
    let container: IContainer;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const value = createContainer();
        container = value.container;
        executionContext = value.executionContext;
    });

    describe("singleton", () => {
        test("Should resolve successfully when resolving singleton dependency at top with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "_")
                .createToken("A");

            container.registerFactory(nodeA).singleton();
            await container.init();

            const correctValue = await nodeA.callFunc();
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        test("Should resolve successfully deep singleton dependency chain at top with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "1")
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => [a, "2"].join(""))
                .createToken("B");

            const nodeC = dependency(nodeB.token)
                .factory((b) => [b, "3"].join(""))
                .createToken("C");

            const nodeD = dependency(nodeC.token)
                .factory((c) => [c, "4"].join(""))
                .createToken("D");
            container.registerFactory(nodeA).singleton();

            container.registerFactory(nodeB).singleton();

            container.registerFactory(nodeC).singleton();

            container.registerFactory(nodeD).singleton();

            await container.init();

            const value = await container.resolve(nodeD.token);
            const correctValue = await nodeD.callFunc(
                await nodeC.callFunc(
                    await nodeB.callFunc(await nodeA.callFunc()),
                ),
            );

            expect(value).toBe(correctValue);
        });

        /**
         * container.registerProvider is shortcut for registering multiple factories at once and is independent of node type.
         * Only singleton registration through container.registerProvider is tested because implementation of container.registerProvider can done independent of node type.
         * The method lambda argument to container.registerProvider can be implemented as proxy object of IContainer.
         */
        test("Should resolve successfully when resolving singleton dependency through container.registerProvider with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "_")
                .createToken("A");

            container.registerProvider((provider) => {
                provider.registerFactory(nodeA).singleton();
            });

            await container.init();

            const correctValue = await nodeA.callFunc();
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        /**
         * This behavior is independent of node type and should apply for singleton scoped, dynamic and transient nodes.
         * Only singleton is tested because behavior and implementation of container.resolveOr can done independent of node type.
         */
        test("Should resolve to default when resolving singleton dependency at top where its factory return null with container.resolveOr", async () => {
            const nodeA = dependency()
                .factory(() => null as null | string)
                .createToken("A");

            container.registerFactory(nodeA).singleton();
            await container.init();

            const defaultValue = "_";
            await expect(
                container.resolveOr(nodeA.token, defaultValue),
            ).resolves.toBe(defaultValue);
        });

        /**
         * This behavior is independent of node type and should apply for singleton scoped, dynamic and transient nodes.
         * Only singleton is tested because behavior and implementation of container.resolveOr can done independent of node type.
         */
        test("Should fail when resolving singleton dependency at top where its factory return null with container.resolveOrFail", async () => {
            const nodeA = dependency()
                .factory(() => null as null | string)
                .createToken("A");

            container.registerFactory(nodeA).singleton();
            await container.init();

            await expect(
                container.resolveOrFail(nodeA.token),
            ).rejects.toThrowError(ServiceCanNotBeResolvedError);
        });

        // TODO ask if arguments for IExecutionContext is utilized correctly in this test
        test("Should resolve successfully a singleton dependency defined by factory that uses executionContext with container.resolve", async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container
                .registerFactory({
                    deps: [],
                    token: tokenA,
                    factory: (_, executionContext_) => {
                        const date = executionContext_.getOrFail(dateKey);
                        return date;
                    },
                })
                .singleton();

            const correctValue = new Date(1786699358026);

            let valueA: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue);
                await container.init();
                valueA = await container.resolve(tokenA);
            });

            expect(valueA).toBe(correctValue);
        });

        test("Should resolve successfully eagerly a singleton dependency defined by factory that uses executionContext with container.resolve", async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container
                .registerFactory({
                    deps: [],
                    token: tokenA,
                    factory: (_, executionContext_) => {
                        const date = executionContext_.getOrFail(dateKey);
                        return date;
                    },
                })
                .singleton();

            const correctValue = new Date(1786699358026);
            const newValue = new Date(correctValue.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            let valueB: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue);
                await container.init();
                valueA = await container.resolve(tokenA);

                // Should not affect outcome since value to singleton node is already created.
                executionContext.put(dateKey, newValue);
                valueB = await container.resolve(tokenA);
            });

            expect(valueA).toBe(correctValue);
            expect(valueB).toBe(correctValue);
        });

        test("Should equal by reference when comparing two items resolved from same token with container.resolve at different scope depth", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            container.registerFactory(nodeA).singleton();
            await container.init();

            const itemA = await container.resolve(nodeA.token);
            let itemB: undefined | object | null = undefined;

            await container.run({
                scope: async () => {
                    itemB = await container.resolve(nodeA.token);
                },
            });
            expect(itemA).toBe(itemB);
        });

        // TODO improve name
        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are singleton "b","c" should have same instance of "a" and hence "resolved_d.b" === "resolved_d.c".
        test("Should equal by reference when comparing two singleton object referenced by two singleton items resolved by same token with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => nodeAValue)
                .createToken("A");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => nodeAValue)
                .createToken("C");

            const nodeD = dependency(nodeB.token, nodeC.token)
                .factory((nodeBValue, nodeCValue) => ({
                    nodeAValue0: nodeBValue,
                    nodeAValue1: nodeCValue,
                }))
                .createToken("D");

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();
            container.registerFactory(nodeC).singleton();
            container.registerFactory(nodeD).singleton();

            await container.init();
            const valueA = await container.resolve(nodeD.token);
            expect(valueA?.nodeAValue0).not.toBeUndefined();
            expect(valueA?.nodeAValue0).toBe(valueA?.nodeAValue1);
        });

        /**
         * container.registerValue is shortcut for:
         * ```ts
         * declare const token:DiToken;
         * declare const value:unknown;
         *
         * container.registerFactory({
         *            deps:[],
         *            token:token,
         *            factory: () => value,
         *        }).singleton();
         * ```
         * Therefore, container.registerValue should behave same as container.registerFactory().singleton().
         */
        test("Should resolve singleton value successfully after registration with container.registerValue at top with container.resolve", async () => {
            const value = "_";
            const tokenA = genericToken<string>("A");
            container.registerValue({ token: tokenA, value });
            await container.init();

            await expect(container.resolve(tokenA)).resolves.toBe(value);
        });

        /**
         * container.registerClass is shortcut for:
         * ```ts
         * // Class with constructor arguments
         * class A { constructor(args){}}
         *
         *
         * // Tokens that will be injected into the constructor of class A
         * declare const depsArgs:Array<DiToken>;
         *
         * container.registerFactory({
         *            deps:depsArgs,
         *            token: A,
         *            factory: (depsArgs) => new A(...depsArgs),
         *        });
         * ```
         * Therefore, container.registerClass should behave same as container.registerFactory for all singleton, scoped and transient nodes.
         */
        test("Should resolve singleton dependency successfully after registration with container.registerClass at top with container.resolve", async () => {
            class A {
                private _: unknown;
            }

            container.registerClass({ impl: A, deps: [] }).singleton();
            await container.init();

            await expect(container.resolve(A)).resolves.toBeInstanceOf(A);
        });
    });

    describe("transient", () => {
        test("Should resolve successfully when resolving transient dependency at top  with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "_")
                .createToken("A");

            container.registerFactory(nodeA).transient();
            await container.init();

            const correctValue = await nodeA.callFunc();
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        test("Should resolve successfully deep transient dependency chain at top with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "1")
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((a) => [a, "2"].join(""))
                .createToken("B");

            const nodeC = dependency(nodeB.token)
                .factory((b) => [b, "3"].join(""))
                .createToken("C");

            const nodeD = dependency(nodeC.token)
                .factory((c) => [c, "4"].join(""))
                .createToken("D");

            container.registerFactory(nodeA).transient();

            container.registerFactory(nodeB).transient();

            container.registerFactory(nodeC).transient();

            container.registerFactory(nodeD).transient();

            await container.init();

            const correctValue = await nodeD.callFunc(
                await nodeC.callFunc(
                    await nodeB.callFunc(await nodeA.callFunc()),
                ),
            );

            const value = await container.resolve(nodeD.token);

            expect(value).toBe(correctValue);
        });

        test("Should resolve successfully a transient dependency defined by factory that uses executionContext with container.resolve", async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container
                .registerFactory({
                    deps: [],
                    token: tokenA,
                    factory: (_, executionContext_) => {
                        const date = executionContext_.getOrFail(dateKey);
                        return date;
                    },
                })
                .transient();

            const correctValue0 = new Date(1786699358026);
            const correctValue1 = new Date(correctValue0.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            let valueB: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue0);
                await container.init();
                valueA = await container.resolve(tokenA);

                // Should affect outcome since transient node and each time resolved factory is called.
                executionContext.put(dateKey, correctValue1);
                valueB = await container.resolve(tokenA);
            });

            expect(valueA).toBe(correctValue0);
            expect(valueB).toBe(correctValue1);
        });

        test("Should not equal by reference when comparing two items resolved by same token with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            container.registerFactory(nodeA).scoped();
            await container.init();
            const valueA = container.resolve(nodeA.token);
            const valueB = container.resolve(nodeA.token);
            expect(valueA).not.toBe(valueB);
        });

        // TODO improve name
        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are transient "b","c" should have own instance of "a" and hence "resolved_d.b" !== "resolved_d.c".
        test("Should not equal by reference when comparing two transient object referenced by two transient items resolved by same token with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => nodeAValue)
                .createToken("A");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => nodeAValue)
                .createToken("C");

            const nodeD = dependency(nodeB.token, nodeC.token)
                .factory((nodeBValue, nodeCValue) => ({
                    nodeAValue0: nodeBValue,
                    nodeAValue1: nodeCValue,
                }))
                .createToken("D");

            container.registerFactory(nodeA).transient();
            container.registerFactory(nodeB).transient();
            container.registerFactory(nodeC).transient();
            container.registerFactory(nodeD).transient();

            await container.init();
            const valueA = await container.resolve(nodeD.token);
            expect(valueA?.nodeAValue0).not.toBeUndefined();
            expect(valueA?.nodeAValue0).not.toBe(valueA?.nodeAValue1);
        });
    });

    describe("scoped", () => {
        test("should return null when resolving scoped dependency at top with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "")
                .createToken("A");

            container.registerFactory(nodeA).scoped();
            await container.init();
            await expect(container.resolve(nodeA.token)).resolves.toBe(null);
        });

        // test("should fail when resolving scoped dependency at top with container.resolveOrFail", async () => {
        //     const nodeA = dependency()
        //         .factory(() => "")
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();
        //     await container.init();
        //     await expect(async () =>
        //         container.resolveOrFail(nodeA.token),
        //     ).rejects.toThrowError();
        // });

        // test("should return default value when resolving scoped dependency at top with container.resolveOr", async () => {
        //     const nodeA = dependency()
        //         .factory(() => "")
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();

        //     await container.init();
        //     await expect(container.resolveOr(nodeA.token, "_")).resolves.toBe(
        //         "_",
        //     );
        // });

        // test("Should resolve to default when resolving scoped dependency inside run scope block where its factory return null with container.resolveOr", async () => {
        //     const nodeA = dependency()
        //         .factory(() => null as null | string)
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();
        //     await container.init();

        //     const defaultValue = "_";

        //     let value: undefined | null | string = undefined;

        //     await container.run({
        //         scope: async () => {
        //             value = await container.resolveOr(
        //                 nodeA.token,
        //                 defaultValue,
        //             );
        //         },
        //     });

        //     expect(value).toBe(defaultValue);
        // });

        // test("Should fail when resolving scoped dependency inside run scope block where its factory return null with container.resolveOrFail", async () => {
        //     const nodeA = dependency()
        //         .factory(() => null as null | string)
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();
        //     await container.init();

        //     await expect(
        //         container.run({
        //             scope: async () => {
        //                 await container.resolveOrFail(nodeA.token);
        //             },
        //         }),
        //     ).rejects.toThrowError();
        // });

        test("Should resolve successfully when resolving scoped dependency inside run block scope with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "_")
                .createToken("A");

            container.registerFactory(nodeA).scoped();
            await container.init();

            let value: undefined | string | null = undefined as
                | undefined
                | string
                | null;

            await container.run({
                scope: async () => {
                    value = await container.resolve(nodeA.token);
                },
            });

            const correctValue = await nodeA.callFunc();
            expect(value).toBe(correctValue);
        });

        test("should return null when resolving scoped dependency at top but inside execution context run block with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "")
                .createToken("A");

            container.registerFactory(nodeA).scoped();
            await container.init();
            let value: string | undefined | null = undefined;

            await executionContext.run(async () => {
                value = await container.resolve(nodeA.token);
            });

            expect(value).toBe(null);
        });

        // test("Should resolve successfully when resolving scoped dependency inside run block scope with container.resolveOr", async () => {
        //     const nodeA = dependency()
        //         .factory(() => "_")
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();
        //     await container.init();

        //     let value: undefined | string | null = undefined as
        //         | undefined
        //         | string
        //         | null;

        //     await container.run({
        //         scope: async () => {
        //             value = await container.resolveOr(nodeA.token, "_");
        //         },
        //     });

        //     const correctValue = await nodeA.callFunc();
        //     expect(value).toBe(correctValue);
        // });

        // test("Should resolve successfully when resolving scoped dependency inside run block scope with container.resolveOrFail", async () => {
        //     const nodeA = dependency()
        //         .factory(() => "_")
        //         .createToken("A");

        //     container.registerFactory(nodeA).scoped();
        //     await container.init();

        //     let value: undefined | string | null = undefined as
        //         | undefined
        //         | string
        //         | null;

        //     await container.run({
        //         scope: async () => {
        //             value = await container.resolveOrFail(nodeA.token);
        //         },
        //     });

        //     const correctValue = await nodeA.callFunc();
        //     expect(value).toBe(correctValue);
        // });

        // test("Should resolve successfully deep scoped chain dependency at top inside run block scope with container.resolve", async () => {
        //     const nodeA = dependency()
        //         .factory(() => "1")
        //         .createToken("A");

        //     const nodeB = dependency(nodeA.token)
        //         .factory((a) => [a, "2"].join(""))
        //         .createToken("B");

        //     const nodeC = dependency(nodeB.token)
        //         .factory((b) => [b, "3"].join(""))
        //         .createToken("C");

        //     const nodeD = dependency(nodeC.token)
        //         .factory((c) => [c, "4"].join(""))
        //         .createToken("D");

        //     container.registerFactory(nodeA).scoped();

        //     container.registerFactory(nodeB).scoped();

        //     container.registerFactory(nodeC).scoped();

        //     container.registerFactory(nodeD).scoped();

        //     let value: string | undefined | null = undefined;
        //     await container.init();
        //     await container.run({
        //         scope: async () => {
        //             value = await container.resolve(nodeD.token);
        //         },
        //     });

        //     const correctValue = await nodeD.callFunc(
        //         await nodeC.callFunc(
        //             await nodeB.callFunc(await nodeA.callFunc()),
        //         ),
        //     );
        //     expect(value).toBe(correctValue);
        // });

        test("Should resolve a scoped dependency defined by factory that uses executionContext with container.resolve", async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container
                .registerFactory({
                    deps: [],
                    token: tokenA,
                    factory: (_, executionContext_) => {
                        const date = executionContext_.getOrFail(dateKey);
                        return date;
                    },
                })
                .scoped();

            const correctValue0 = new Date(1786699358026);

            let valueA: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            await container.init();
            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue0);
                await container.run({
                    scope: async () => {
                        valueA = await container.resolve(tokenA);
                    },
                });
            });

            expect(valueA).toBe(correctValue0);
        });

        // TODO improve name
        test("Should resolve a scoped dependency eagerly defined by factory that uses executionContext with container.resolve", async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container
                .registerFactory({
                    deps: [],
                    token: tokenA,
                    factory: (_, executionContext_) => {
                        const date = executionContext_.getOrFail(dateKey);
                        return date;
                    },
                })
                .scoped();

            const correctValue0 = new Date(1786699358026);
            const correctValue1 = new Date(correctValue0.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            let valueB: Date | undefined | null = undefined as
                | Date
                | undefined
                | null;

            await container.init();
            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue0);
                await container.run({
                    scope: async () => {
                        executionContext.put(dateKey, correctValue1);
                        valueA = await container.resolve(tokenA);

                        await container.run({
                            scope: async () => {
                                valueB = await container.resolve(tokenA);
                            },
                        });
                    },
                });
            });

            expect(valueA).toBe(correctValue0);

            expect(valueB).toBe(correctValue1);
        });

        test("Should not equal by reference when comparing two items resolved by same token with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            container.registerFactory(nodeA).scoped();
            await container.init();
            const valueA = container.resolve(nodeA.token);
            const valueB = container.resolve(nodeA.token);
            expect(valueA).not.toBe(valueB);
        });

        test("Should equal by reference when comparing two items resolved by same token in same scope depth with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            let valueB: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            container.registerFactory(nodeA).scoped();
            await container.init();

            await container.run({
                scope: async () => {
                    valueA = await container.resolve(nodeA.token);
                    valueB = await container.resolve(nodeA.token);
                },
            });
            expect(valueA).toBe(valueB);
        });

        test("Should not equal by reference when comparing two items resolved by same token in same scope depth consecutively with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            let valueB: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            container.registerFactory(nodeA).scoped();
            await container.init();

            await container.run({
                scope: async () => {
                    await container.run({
                        scope: async () => {
                            valueA = await container.resolve(nodeA.token);
                        },
                    });

                    await container.run({
                        scope: async () => {
                            valueB = await container.resolve(nodeA.token);
                        },
                    });
                },
            });
            expect(valueA).not.toBe(valueB);
        });

        test("Should not equal by reference when comparing two items resolved by same token in different scope depth with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            let valueB: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            container.registerFactory(nodeA).scoped();
            await container.init();

            await container.run({
                scope: async () => {
                    valueA = await container.resolve(nodeA.token);
                    await container.run({
                        scope: async () => {
                            valueB = await container.resolve(nodeA.token);
                        },
                    });
                },
            });
            expect(valueA).not.toBe(valueB);
        });

        // TODO improve name
        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are scoped "b","c" and resolved in same scope should have own instance of "a" and hence "resolved_d.b" !== "resolved_d.c".
        test("Should equal by reference when comparing two items resolved by same token in same scope depth with container.resolve2", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");
            const nodeB = dependency(nodeA.token)
                .factory((nodeValueA) => nodeValueA)
                .createToken("B");
            const nodeC = dependency(nodeA.token)
                .factory((nodeValueA) => nodeValueA)
                .createToken("C");
            const nodeD = dependency(nodeB.token, nodeC.token)
                .factory((nodeValueA0, nodeValueA1) => ({
                    nodeValueA0,
                    nodeValueA1,
                }))
                .createToken("D");

            let value: Awaited<ReturnType<(typeof nodeD)["callFunc"]>> | null =
                null as Awaited<ReturnType<(typeof nodeD)["callFunc"]>> | null;

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).scoped();
            container.registerFactory(nodeC).scoped();
            container.registerFactory(nodeD).scoped();
            await container.init();

            await container.run({
                scope: async () => {
                    value = await container.resolve(nodeD.token);
                },
            });

            expect(value?.nodeValueA0).not.toBeUndefined();
            expect(value?.nodeValueA0).toBe(value?.nodeValueA1);
        });
    });

    describe("dynamic", () => {
        test("should return null when resolving dynamic dependency at top with container.resolve", async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);

            await container.init();
            await expect(container.resolve(tokenA)).resolves.toBe(null);
        });

        test("Should fail when resolving dynamic dependency inside run scope block where its factory return null with container.resolveOrFail", async () => {
            const tokenA = genericToken<string | null>("A");

            container.registerDynamic(tokenA);
            await container.init();

            await expect(
                container.run({
                    scope: async () => {
                        await container.resolveOrFail(tokenA);
                    },
                }),
            ).rejects.toThrowError(ServiceCanNotBeResolvedError);
        });

        test("Should resolve successfully when resolving dynamic dependency inside run block scope with container.resolve", async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);
            const correctValueA = "_";
            let valueA: undefined | string | null = null as
                | undefined
                | string
                | null;

            await container.init();
            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({
                        token: tokenA,
                        value: correctValueA,
                    });
                },
                scope: async () => {
                    valueA = await container.resolve(tokenA);
                },
            });

            expect(valueA).toBe(correctValueA);
        });

        test("Should resolve successfully dynamic value from closet scope successfully", async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);
            const scope0ValueOfA = "0";
            const scope1ValueOfA = "1";

            let valueA: undefined | string | null = null as
                | undefined
                | string
                | null;

            await container.init();
            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({
                        token: tokenA,
                        value: scope0ValueOfA,
                    });
                },
                scope: async () => {
                    await container.run({
                        dynamicRegistration: async (serviceRegister) => {
                            await serviceRegister.set({
                                token: tokenA,
                                value: scope1ValueOfA,
                            });
                        },
                        scope: async () => {
                            await container.run({
                                scope: async () => {
                                    valueA = await container.resolve(tokenA);
                                },
                            });
                        },
                    });
                },
            });

            expect(valueA).toBe(scope1ValueOfA);
        });

        test("Should equal by reference when comparing two items resolved by same token in same scope depth with container.resolve", async () => {
            const tokenA = genericToken<object>("A");

            let valueA: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            let valueB: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            container.registerDynamic(tokenA);
            await container.init();

            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({ token: tokenA, value: {} });
                },
                scope: async () => {
                    valueA = await container.resolve(tokenA);
                    valueB = await container.resolve(tokenA);
                },
            });
            expect(valueA).toBe(valueB);
        });

        test("Should equal by reference when comparing two items resolved by same token in different scope depth with container.resolve", async () => {
            const tokenA = genericToken<object>("A");

            let valueA: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            let valueB: undefined | object | null = undefined as
                | undefined
                | object
                | null;

            container.registerDynamic(tokenA);
            await container.init();

            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({ token: tokenA, value: {} });
                },
                scope: async () => {
                    valueA = await container.resolve(tokenA);
                    await container.run({
                        scope: async () => {
                            valueB = await container.resolve(tokenA);
                        },
                    });
                },
            });
            expect(valueA).toBe(valueB);
        });

        test("should return null when resolving existent dynamic token with no value provided inside run block scope with with container.resolve", async () => {
            const tokenA = genericToken<string>("A");
            let value: undefined | string | null = undefined as
                | undefined
                | string
                | null;

            container.registerDynamic(tokenA);
            await container.init();

            await container.run({
                scope: async () => {
                    value = await container.resolve(tokenA);
                },
            });

            expect(value).toBe(null);
        });
    });

    describe("scoped & dynamic", () => {
        // TODO better name
        // short version: two scoped at different levels but refer to same dynamic item and dynamic is set only once.
        test("should equal by reference when comparing field reference of two scoped item referencing dynamic at different scope level and dynamic set before", async () => {
            const tokenA = genericToken<object>("A");
            const nodeB = dependency(tokenA)
                .factory((tokenAValue) => tokenAValue)
                .createToken("B");

            let valueAScope0: undefined | null | object = undefined as
                | undefined
                | null
                | object;

            let valueAScope1: undefined | null | object = undefined as
                | undefined
                | null
                | object;

            container.registerDynamic(tokenA);
            container.registerFactory(nodeB).scoped();
            await container.init();
            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({ token: tokenA, value: {} });
                },
                scope: async () => {
                    valueAScope0 = await container.resolve(nodeB.token);
                    await container.run({
                        scope: async () => {
                            valueAScope1 = await container.resolve(nodeB.token);
                        },
                    });
                },
            });

            expect(valueAScope0).not.toBeUndefined();
            expect(valueAScope0).not.toBeNull();
            expect(valueAScope0).toBe(valueAScope1);
        });

        // TODO better name
        // short version: two scoped at different levels but refer to same dynamic item and dynamic is set twice: one before scope resolve to reference and other after.
        test("should equal by reference when comparing field reference of two scoped item referencing dynamic at different scope level and dynamic set twice", async () => {
            const tokenA = genericToken<object>("A");
            const nodeB = dependency(tokenA)
                .factory((tokenAValue) => tokenAValue)
                .createToken("B");

            let valueAScope0: undefined | null | object = undefined as
                | undefined
                | null
                | object;

            let valueAScope1: undefined | null | object = undefined as
                | undefined
                | null
                | object;

            container.registerDynamic(tokenA);
            container.registerFactory(nodeB).scoped();

            await container.init();
            await container.run({
                dynamicRegistration: async (serviceRegister) => {
                    await serviceRegister.set({ token: tokenA, value: {} });
                },
                scope: async () => {
                    valueAScope0 = await container.resolve(nodeB.token);
                    await container.run({
                        dynamicRegistration: async (serviceRegister) => {
                            await serviceRegister.set({
                                token: tokenA,
                                value: {},
                            });
                        },
                        scope: async () => {
                            valueAScope1 = await container.resolve(nodeB.token);
                        },
                    });
                },
            });

            expect(valueAScope0).not.toBeUndefined();
            expect(valueAScope0).not.toBeNull();
            expect(valueAScope0).not.toBe(valueAScope1);
        });
    });

    describe("singleton & scoped", () => {
        test("Should equal by reference when comparing two singleton object referenced by two scoped items resolved by two different token in different scope depth with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).scoped();
            container.registerFactory(nodeC).scoped();

            await container.init();

            await container.run({
                scope: async () => {
                    valueB = await container.resolve(nodeB.token);
                    await container.run({
                        scope: async () => {
                            valueC = await container.resolve(nodeC.token);
                        },
                    });
                },
            });
            expect(valueB?.nodeAValue).not.toBeUndefined();
            expect(valueB?.nodeAValue).toBe(valueC?.nodeAValue);
        });
    });

    describe("singleton & transient", () => {
        test("Should equal by reference when comparing two singleton object referenced by two transient items resolved by two different token with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).transient();
            container.registerFactory(nodeC).transient();

            await container.init();

            const valueB = await container.resolve(nodeB.token);
            const valueC = await container.resolve(nodeC.token);

            expect(valueB?.nodeAValue).not.toBeUndefined();
            expect(valueB?.nodeAValue).toBe(valueC?.nodeAValue);
        });
    });

    describe("scoped & transient", () => {
        test("should return null when resolving transient dependency dependent on scoped dependency at top with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "")
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory(() => "")
                .createToken("B");

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).transient();
            await container.init();
            await expect(container.resolve(nodeB.token)).resolves.toBe(null);
        });

        test("should resolve successfully when resolving transient dependency dependent on scoped dependency inside run block scope with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => "")
                .createToken("A");
            const nodeB = dependency(nodeA.token)
                .factory(() => "")
                .createToken("B");

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).transient();
            await container.init();

            let value: undefined | null | string = undefined;
            await container.run({
                scope: async () => {
                    value = await container.resolve(nodeB.token);
                },
            });

            const correctValue = await nodeB.callFunc(await nodeA.callFunc());
            expect(value).toBe(correctValue);
        });

        test("Should equal by reference when comparing two scoped object referenced by two transient items resolved by two different token in same scope depth with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).transient();
            container.registerFactory(nodeC).transient();

            await container.init();

            await container.run({
                scope: async () => {
                    valueB = await container.resolve(nodeB.token);
                    valueC = await container.resolve(nodeC.token);
                },
            });
            expect(valueB?.nodeAValue).not.toBeUndefined();
            expect(valueB?.nodeAValue).toBe(valueC?.nodeAValue);
        });

        test("Should not equal by reference when comparing two scoped object referenced by two transient items resolved by two different token in different scope depth with container.resolve", async () => {
            const nodeA = dependency()
                .factory(() => ({}))
                .createToken("A");

            const nodeB = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            const nodeC = dependency(nodeA.token)
                .factory((nodeAValue) => ({ nodeAValue }))
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).transient();
            container.registerFactory(nodeC).transient();

            await container.init();

            await container.run({
                scope: async () => {
                    valueB = await container.resolve(nodeB.token);
                    await container.run({
                        scope: async () => {
                            valueC = await container.resolve(nodeC.token);
                        },
                    });
                },
            });
            expect(valueB?.nodeAValue).not.toBeUndefined();
            expect(valueB?.nodeAValue).not.toBe(valueC?.nodeAValue);
        });
    });

    describe("singleton,scoped, dynamic and transient", () => {
        test.todo("grand test", () => {});
    });
});

describe("graph validation", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    /**
     * Undeclared detection can implemented independent of node type.
     * Therefore only singleton tested.
     */
    describe("undeclared nodes", () => {
        test("should throw when undeclared nodes exist", async () => {
            const tokenA = genericToken<string>("A");
            const undeclaredToken = genericToken<string>("undeclared");

            const nodeA = dependency(undeclaredToken)
                .factory(() => "A")
                .reuseToken(tokenA);

            container.registerFactory(nodeA).singleton();

            await expect(container.init()).rejects.toThrowError();
        });
    });

    describe("invalid edge detection", () => {
        test("should throw when an singleton -> scoped edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            const nodeB = dependency()
                .factory(() => "B")
                .reuseToken(tokenB);

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).scoped();

            await expect(container.init()).rejects.toThrowError();
        });

        test("should throw when an singleton -> dynamic edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            container.registerFactory(nodeA).singleton();
            container.registerDynamic(tokenB);

            await expect(container.init()).rejects.toThrowError();
        });

        test("should throw when an singleton -> transient edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            const nodeB = dependency()
                .factory(() => "B")
                .reuseToken(tokenB);

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).transient();

            await expect(container.init()).rejects.toThrowError();
        });

        test("should throw when an scoped -> transient edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            const nodeB = dependency()
                .factory(() => "B")
                .reuseToken(tokenB);

            container.registerFactory(nodeA).scoped();
            container.registerFactory(nodeB).transient();

            await expect(container.init()).rejects.toThrowError();
        });

        test("should throw when an transient -> dynamic edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            container.registerFactory(nodeA).transient();
            container.registerDynamic(tokenB);

            await expect(container.init()).rejects.toThrowError();
        });
    });

    /**
     * Cycle detection can implemented independent of node type.
     * Therefore only singleton tested.
     */
    describe("cycle detection", () => {
        test("should throw when a singleton cycle A->B->A is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency(tokenB)
                .factory(() => "A")
                .reuseToken(tokenA);

            const nodeB = dependency(tokenA)
                .factory(() => "B")
                .reuseToken(tokenB);

            container.registerFactory(nodeA).singleton();
            container.registerFactory(nodeB).singleton();

            await expect(container.init()).rejects.toThrowError();
        });

        test("should throw when a singleton cycle A->A is detected", async () => {
            const tokenA = genericToken("A");
            container
                .registerFactory({
                    deps: [tokenA],
                    factory: () => "_",
                    token: tokenA,
                })
                .singleton();

            await expect(container.init()).rejects.toThrowError();
        });
    });
});

/**
 * container.overrideFactory & overrideClass can implemented independent of node type.
 * Therefore only singleton tested.
 */
describe("override", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("should override  nodeA with overrideFactory", async () => {
        const nodeA = dependency()
            .factory(() => `A`)
            .createToken("A");

        const nodeAOverridden = dependency()
            .factory(() => `OverriddenA`)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA).singleton();

        container.overrideFactory(nodeAOverridden);

        await container.init();

        const correctA = await nodeAOverridden.callFunc();

        const resolvedA = await container.resolve(nodeAOverridden.token);

        expect(resolvedA).toBe(correctA);
    });

    /**
     * Container.overrideClass is shortcut for:
     * ```ts
     * container.overrideFactory({
     *       deps: constructorDepsArgs,
     *       token: A,
     *       factory: (args) => new A(...args),
     *   });
     * ```
     * Where is A is a class and constructorDepsArgs is the dependencies.
     * Therefore, container.overrideClass is tested only once.
     */
    test("should override with overrideClass", async () => {
        class A {
            constructor(public arg: unknown) {}
        }

        const nodeB = dependency()
            .factory(() => "0")
            .createToken("A");

        const nodeC = dependency()
            .factory(() => "1")
            .createToken("C");

        container.registerFactory(nodeB).singleton();
        container.registerFactory(nodeC).singleton();
        container.registerClass({ deps: [nodeB.token], impl: A }).singleton();

        container.overrideClass({ deps: [nodeC.token], impl: A });

        await container.init();

        const resolvedA = await container.resolve(A);

        expect(resolvedA?.arg).toBe(await nodeC.callFunc());
    });

    test("when nonexistent node should throw", () => {
        const nodeA = dependency()
            .factory(() => `A`)
            .createToken("A");

        expect(() => {
            container.overrideFactory(nodeA);
        }).toThrowError();
    });

    test("when dynamic node should throw", () => {
        const tokenA = genericToken<string>("dynamic");

        const nodeAOverridden = dependency()
            .factory(() => `OverriddenA`)
            .reuseToken(tokenA);

        container.registerDynamic(tokenA);

        // TODO add specific error object
        expect(() => {
            container.overrideFactory(nodeAOverridden);
        }).toThrowError();
    });

    test("when double should fail", () => {
        const nodeA = dependency()
            .factory(() => `A`)
            .createToken("A");

        const nodeAOverride1 = dependency()
            .factory(() => `Node A override first time`)
            .reuseToken(nodeA.token);

        const nodeAOverride2 = dependency()
            .factory(() => `Node A override second time`)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA).singleton();

        container.overrideFactory(nodeAOverride1);

        expect(() => {
            container.overrideFactory(nodeAOverride2);
        }).toThrowError();
    });

    test("when override A where B -> A should effect both A and B value", async () => {
        const nodeA = dependency()
            .factory(() => `A`)
            .createToken("A");

        const nodeB = dependency(nodeA.token)
            .factory((a) => wrapInParenthesis("B", a))
            .createToken("B");

        const nodeAOverridden = dependency()
            .factory(() => `OverriddenA`)
            .reuseToken(nodeA.token);

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
            .createToken("A");

        const nodeB = dependency(nodeA.token)
            .factory((a) => wrapInParenthesis("B", a))
            .createToken("B");

        const nodeBOverridden = dependency(nodeA.token)
            .factory((a) => wrapInParenthesis("OverriddenB", a))
            .reuseToken(nodeB.token);

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
            .createToken("A");

        const nodeB = dependency(nodeA.token)
            .factory((a) => wrapInParenthesis("B", a))
            .createToken("B");

        const nodeC = dependency(nodeB.token)
            .factory((a) => wrapInParenthesis("C", a))
            .createToken("C");

        const nodeAOverridden = dependency()
            .factory(() => `OverriddenA`)
            .reuseToken(nodeA.token);

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
            .createToken("A");

        const nodeB = dependency(nodeA.token)
            .factory((a) => wrapInParenthesis("B", a))
            .createToken("B");

        const nodeC = dependency()
            .factory(() => `C`)
            .createToken("C");

        const overriddenNodeB = dependency(nodeC.token)
            .factory((a) => wrapInParenthesis("B", a))
            .reuseToken(nodeB.token);

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
});

describe("graph validation & override", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainer().container;
    });

    test("when override introduce invalid edge graph validation should fail", async () => {
        const nodeA = dependency()
            .factory(() => "")
            .createToken("A");

        const nodeB = dependency()
            .factory(() => "")
            .createToken("B");

        const nodeC = dependency(nodeA.token)
            .factory(() => "")
            .createToken("C");

        const nodeCOverridden = dependency(nodeB.token)
            .factory(() => "")
            .reuseToken(nodeC.token);

        container.registerFactory(nodeA).singleton();
        container.registerFactory(nodeB).transient();
        container.registerFactory(nodeC).singleton();

        container.overrideFactory(nodeCOverridden);
        await expect(container.init()).rejects.toThrowError();
    });

    test("when override introduce cycle graph validation should fail", async () => {
        const nodeA = dependency()
            .factory(() => "")
            .createToken("A");
        const nodeB = dependency(nodeA.token)
            .factory(() => "")
            .createToken("B");

        const nodeAOverridden = dependency(nodeB.token)
            .factory(() => "")
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA).singleton();
        container.registerFactory(nodeB).singleton();
        container.overrideFactory(nodeAOverridden);

        await expect(container.init()).rejects.toThrowError();
    });

    test("when override introduce non existent dependency graph validation should fail", async () => {
        const nonExistent = genericToken<string>("");

        const nodeA = dependency()
            .factory(() => "")
            .createToken("A");
        const nodeAOverridden = dependency(nonExistent)
            .factory(() => "")
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA).singleton();
        container.overrideFactory(nodeAOverridden);
        await expect(container.init()).rejects.toThrowError();
    });
});

describe("forked container", () => {
    let containerA: Container;
    beforeEach(() => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        containerA = new Container({ executionContext });
    });

    test("adding a node in fork does not affect the original container", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        const containerB = containerA.fork();

        containerB.registerFactory(nodeA).transient();

        await containerA.init();
        await containerB.init();

        const hasNodeBContainerA = await containerA.has(nodeA.token);
        const hasNodeBContainerB = await containerB.has(nodeA.token);

        expect(hasNodeBContainerA).toBe(false);
        expect(hasNodeBContainerB).toBe(true);
    });

    test("adding a node in original does not affect the fork", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        const containerB = containerA.fork();

        containerA.registerFactory(nodeA).transient();

        await containerA.init();
        await containerB.init();

        const hasNodeBContainerA = await containerA.has(nodeA.token);
        const hasNodeBContainerB = await containerB.has(nodeA.token);

        expect(hasNodeBContainerA).toBe(true);
        expect(hasNodeBContainerB).toBe(false);
    });

    test("fork copies all nodes from the original", async () => {
        class NodeA {
            private _: unknown;
        }

        const nodeB = dependency()
            .factory(() => "B")
            .createToken("B");

        const tokenC = genericToken<string>("C");

        containerA.registerClass({ deps: [], impl: NodeA }).singleton();
        containerA.registerFactory(nodeB).transient();
        containerA.registerValue({ token: tokenC, value: "C" });

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        const hasNodeA = await containerB.has(NodeA);
        const hasNodeB = await containerB.has(nodeB.token);
        const hasTokenC = await containerB.has(tokenC);

        expect(hasNodeA).toBe(true);
        expect(hasNodeB).toBe(true);
        expect(hasTokenC).toBe(true);
    });
});

describe("forked container & override", () => {
    let containerA: Container;
    beforeEach(() => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        containerA = new Container({ executionContext });
    });

    test("fork copies all override nodes from the original", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        const nodeAOverride1 = dependency()
            .factory(() => "A overridden first")
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA).singleton();
        containerA.overrideFactory(nodeAOverride1);

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        const resolvedContainerA = await containerA.resolve(nodeA.token);
        const resolvedContainerB = await containerB.resolve(nodeA.token);

        const correctA = await nodeAOverride1.callFunc();

        expect(resolvedContainerA).toBe(correctA);
        expect(resolvedContainerB).toBe(correctA);
    });

    test("overriding a node in fork does not affect the original container", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        const nodeAOverride = dependency()
            .factory(() => "A overridden second")
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA).singleton();
        const containerB = containerA.fork();
        containerB.overrideFactory(nodeAOverride);

        await containerA.init();
        await containerB.init();

        const correctContainerB = await nodeAOverride.callFunc();
        const resolvedContainerB = await containerB.resolve(nodeA.token);
        expect(resolvedContainerB).toBe(correctContainerB);
    });

    test("overriding a node in original does not affect the forked container", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        const nodeAOverride = dependency()
            .factory(() => "A overridden second")
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA).singleton();
        const containerB = containerA.fork();
        containerA.overrideFactory(nodeAOverride);

        await containerA.init();
        await containerB.init();

        const correctContainerA = await nodeAOverride.callFunc();
        const resolvedContainerA = await containerA.resolve(nodeA.token);
        expect(resolvedContainerA).toBe(correctContainerA);
    });
});

describe("forked container & hooks", () => {
    let containerA: Container;
    beforeEach(() => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        containerA = new Container({ executionContext });
    });

    // uncessary ?
    test("deInit of fork does not deInit the original container", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        containerA.registerFactory(nodeA).singleton();

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        await containerB.deInit();

        await expect(containerA.resolve(nodeA.token)).resolves.toBe("A");
        await expect(containerB.resolve(nodeA.token)).rejects.toThrowError(
            ContainerNotActiveException,
        );
    });

    // uncessary ?
    test("deInit of original does not deInit the fork", async () => {
        const nodeA = dependency()
            .factory(() => "A")
            .createToken("A");

        containerA.registerFactory(nodeA).singleton();

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        await containerA.deInit();

        await expect(containerB.resolve(nodeA.token)).resolves.toBe("A");
        await expect(containerA.resolve(nodeA.token)).rejects.toThrowError(
            ContainerNotActiveException,
        );
    });

    // TODO dedice if it good thing to copy init and deInit hooks from original?
    test("fork inherits init and deInit hooks from the original", async () => {
        let inheritedInitCalls = 0;
        let inheritedDeInitCalls = 0;

        containerA.onContainerInit(() => {
            inheritedInitCalls += 1;
        });
        containerA.onContainerDeInit(() => {
            inheritedDeInitCalls += 1;
        });

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        // the hook registered before forking runs for both containers
        expect(inheritedInitCalls).toBe(2);

        await containerA.deInit();
        await containerB.deInit();

        expect(inheritedDeInitCalls).toBe(2);
    });
});
