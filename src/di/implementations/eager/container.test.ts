/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable @typescript-eslint/no-extraneous-class */
import { describe, test, expect, beforeEach, vi } from "vitest";

import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import {
    InvalidGraphDiError,
    InvalidMethodCallDiError,
    CanNotRegisterServiceDiError,
    CanNotBeResolvedDiError,
    CanNotOverrideServiceDiError,
} from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { RegistryManager } from "@/di/implementations/eager/registry-manager.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { callInvocable, UnexpectedError } from "@/utilities/_module.js";

import type {
    IServiceRegister,
    IServiceProvider,
    DiToken,
    IContainer,
    IDynamicServiceRegister,
    EmptyDepRecord,
    DepRecord,
    FactoryRegistration,
    ServiceFactory,
    DepsTokens,
    Lifetime,
} from "@/di/contracts/container.contract.js";
import type { IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";

// ---------------------------------------------------------------------------
// Helper tokens and test classes
// ---------------------------------------------------------------------------

type ILogger = {
    log(message: string): void;
};

type IDatabase = {
    query(sql: string): Promise<unknown>;
};

type IUserService = {
    getUser(id: string): Promise<{ name: string }>;
};

type IConfig = {
    apiUrl: string;
    timeout: number;
};

const ILOGGER = genericToken<ILogger>("ILogger");
const IDATABASE = genericToken<IDatabase>("IDatabase");
const IUSER_SERVICE = genericToken<IUserService>("IUserService");
const ICONFIG = genericToken<IConfig>("IConfig");
const REQUEST_ID = genericToken<string>("RequestId");

class ConsoleLogger implements ILogger {
    public readonly logs: Array<string> = [];
    log(message: string): void {
        this.logs.push(message);
    }
}

class FileLogger implements ILogger {
    public readonly logs: Array<string> = [];
    log(message: string): void {
        this.logs.push(message);
    }
}

class Database implements IDatabase {
    query(_sql: string): Promise<unknown> {
        return Promise.resolve([]);
    }
}

class MockDatabase implements IDatabase {
    query(_sql: string): Promise<unknown> {
        return Promise.resolve([{ mock: true }]);
    }
}

class UserService implements IUserService {
    constructor(private readonly db: IDatabase) {}
    async getUser(id: string): Promise<{ name: string }> {
        await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
        return { name: "John" };
    }
}

class UserController {
    constructor(
        private readonly userService: IUserService,
        private readonly logger: ILogger,
    ) {}
    async handleRequest(userId: string): Promise<void> {
        const user = await this.userService.getUser(userId);
        this.logger.log(`Found user: ${user.name}`);
    }
}

class ScopedService {
    public readonly id = Math.random();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createExecutionContext(): IExecutionContext {
    return new ExecutionContext(new AlsExecutionContextAdapter());
}

function wrapInParenthesis(word: string, ...args: Array<unknown>): string {
    const str = args.join(",");
    return `${word}(${str})`;
}

function dependency<TDeps extends DepRecord = EmptyDepRecord>(
    deps: DepsTokens<TDeps>,
): {
    factory: <TRegisteredType = unknown>(
        func: ServiceFactory<TDeps, TRegisteredType>,
    ) => {
        lifeTime: (lifetime: Lifetime) => {
            reuseToken: (
                token: DiToken<TRegisteredType>,
            ) => FactoryRegistration<TDeps, TRegisteredType>;

            createToken: (
                description: string,
            ) => FactoryRegistration<TDeps, TRegisteredType>;
        };
    };
} {
    return {
        factory: (func) => {
            return {
                lifeTime: (lifetime) => {
                    return {
                        reuseToken: (token) => {
                            return {
                                deps,
                                factory: func,
                                token,
                                lifetime,
                            };
                        },
                        createToken: (text) => {
                            return {
                                deps,
                                factory: func,
                                token: genericToken(text),
                                lifetime,
                            };
                        },
                    };
                },
            };
        },
    };
}

function createContainerAndExecutionContext(): {
    container: IContainer;
    executionContext: IExecutionContext;
} {
    const executionContext = new ExecutionContext(
        new AlsExecutionContextAdapter(),
    );
    const container = new Container({ executionContext });
    return { container, executionContext };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("class: Container", () => {
    // -----------------------------------------------------------------------
    // constructor
    // -----------------------------------------------------------------------
    describe("constructor", () => {
        test("Should create a container instance with a valid execution context", () => {
            const ec = createExecutionContext();
            const container = new Container({ executionContext: ec });
            expect(container).toBeInstanceOf(Container);
        });
    });

    // -----------------------------------------------------------------------
    // registerFactory
    // -----------------------------------------------------------------------
    describe("method: registerFactory", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should register a factory with a singleton lifetime type", async () => {
            container.registerFactory({
                token: ILOGGER,
                factory: () => ({ log: () => {} }),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            await container.init();
            const result = await container.resolveOrFail(ILOGGER);
            expect(result).toBeDefined();
        });

        test("Should register a factory with dependencies", () => {
            expect(() => {
                container.registerValue({
                    token: IDATABASE,
                    value: { query: () => Promise.resolve([]) },
                });

                container.registerFactory({
                    token: IUSER_SERVICE,
                    factory: ({ db }) => ({
                        getUser: async () => {
                            await db.query("");
                            return { name: "Test" };
                        },
                    }),
                    deps: { db: IDATABASE },
                    lifetime: LIFETIME.SINGLETON,
                });
            }).not.toThrow();
        });

        test("Should support singleton lifetime", () => {
            expect(() => {
                container.registerFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
            }).not.toThrow();
        });

        test("Should support scoped lifetime", () => {
            expect(() => {
                container.registerFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.SCOPED,
                });
            }).not.toThrow();
        });

        test("Should support transient lifetime", () => {
            expect(() => {
                container.registerFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.TRANSIENT,
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerValue
    // -----------------------------------------------------------------------
    describe("method: registerValue", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should register a pre-constructed value", () => {
            expect(() => {
                container.registerValue({
                    token: ICONFIG,
                    value: { apiUrl: "https://api.example.com", timeout: 5000 },
                });
            }).not.toThrow();
        });

        test("Should register a value with a generic token", () => {
            expect(() => {
                const TOKEN = genericToken<string>("MyToken");
                container.registerValue({
                    token: TOKEN,
                    value: "hello",
                });
            }).not.toThrow();
        });

        test("Should register a value with a class token", () => {
            expect(() => {
                const logger = new ConsoleLogger();
                container.registerValue({
                    token: ConsoleLogger,
                    value: logger,
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerDynamic
    // -----------------------------------------------------------------------
    describe("method: registerDynamic", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should register a dynamic token", () => {
            expect(() => {
                container.registerDynamic(REQUEST_ID);
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerProvider
    // -----------------------------------------------------------------------
    describe("method: registerProvider", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should register a service provider as a plain function", () => {
            expect(() => {
                function loggingProvider(register: IServiceRegister): void {
                    register.registerFactory({
                        token: ConsoleLogger,
                        factory: () => new ConsoleLogger(),
                        deps: {},
                        lifetime: LIFETIME.SINGLETON,
                    });
                }

                container.registerProvider(loggingProvider);
            }).not.toThrow();
        });

        test("Should register a service provider as an object with an invoke method", () => {
            expect(() => {
                class DatabaseProvider implements IServiceProvider {
                    invoke(register: IServiceRegister): void {
                        register.registerFactory({
                            token: Database,
                            factory: () => new Database(),
                            deps: {},
                            lifetime: LIFETIME.SINGLETON,
                        });
                    }
                }

                container.registerProvider(new DatabaseProvider());
            }).not.toThrow();
        });

        test("Should register multiple services from a single provider", () => {
            expect(() => {
                function appProvider(register: IServiceRegister): void {
                    register.registerFactory({
                        token: ConsoleLogger,
                        factory: () => new ConsoleLogger(),
                        deps: {},
                        lifetime: LIFETIME.SINGLETON,
                    });

                    register.registerFactory({
                        token: Database,
                        factory: () => new Database(),
                        deps: {},
                        lifetime: LIFETIME.SINGLETON,
                    });

                    register.registerValue({
                        token: ICONFIG,
                        value: {
                            apiUrl: "https://api.example.com",
                            timeout: 5000,
                        },
                    });
                }

                container.registerProvider(appProvider);
            }).not.toThrow();
        });

        test("Should accept a provider that registers a factory", () => {
            expect(() => {
                function appProvider(register: IServiceRegister): void {
                    register.registerFactory({
                        token: ConsoleLogger,
                        factory: () => new ConsoleLogger(),
                        deps: {},
                        lifetime: LIFETIME.SINGLETON,
                    });
                }

                container.registerProvider(appProvider);
            }).not.toThrow();
        });

        test("Should reject a promise-returning (async) provider", () => {
            function asyncProvider(register: IServiceRegister): Promise<void> {
                return Promise.resolve().then(() => {
                    register.registerFactory({
                        token: ConsoleLogger,
                        factory: () => new ConsoleLogger(),
                        deps: {},
                        lifetime: LIFETIME.SINGLETON,
                    });
                });
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                container.registerProvider(asyncProvider);
            }).toThrow(UnexpectedError);
        });
    });

    // -----------------------------------------------------------------------
    // resolve
    // -----------------------------------------------------------------------
    describe("method: resolve", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should return null when token is not registered", async () => {
            await container.init();
            const result = await container.resolve(ILOGGER);
            expect(result).toBeNull();
        });

        test("Should return the registered service when a value is registered for the token", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            await container.init();
            const result = await container.resolve(ICONFIG);
            expect(result).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // resolveOr
    // -----------------------------------------------------------------------
    describe("method: resolveOr", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should return default value when token is not registered", async () => {
            const defaultValue: IConfig = { apiUrl: "default", timeout: 1000 };

            await container.init();
            const result = await container.resolveOr(ICONFIG, defaultValue);
            expect(result).toBe(defaultValue);
        });

        test("Should return registered value when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            await container.init();
            const result = await container.resolveOr(ICONFIG, {
                apiUrl: "default",
                timeout: 1000,
            });
            expect(result).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // resolveOrFail
    // -----------------------------------------------------------------------
    describe("method: resolveOrFail", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should return the service when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            await container.init();
            const result = await container.resolveOrFail(ICONFIG);
            expect(result).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // has
    // -----------------------------------------------------------------------
    describe("method: has", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should return false when token is not registered", async () => {
            await container.init();
            const result = await container.has(ILOGGER);
            expect(result).toBe(false);
        });

        test("Should return true when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            await container.init();
            const result = await container.has(ICONFIG);
            expect(result).toBe(true);
        });

        test("Should return false for a registered dynamic token when no value exists for it yet", async () => {
            container.registerDynamic(REQUEST_ID);

            await container.init();
            const result = await container.has(REQUEST_ID);
            expect(result).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // method: run (scoped execution)
    // -----------------------------------------------------------------------
    describe("method: run", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should execute a scope callback within an isolated scope", async () => {
            const scopeFn = vi.fn();

            await container.init();
            await container.run({
                scope: scopeFn,
            });

            expect(scopeFn).toHaveBeenCalledOnce();
        });

        test("Should set dynamic values before scope execution", async () => {
            container.registerDynamic(REQUEST_ID);

            let capturedRequestId: string | undefined;
            await container.init();
            await container.run({
                dynamicRegistration: async (register) => {
                    await register.set({
                        token: REQUEST_ID,
                        value: "req-123",
                    });
                },
                scope: async () => {
                    capturedRequestId =
                        await container.resolveOrFail(REQUEST_ID);
                },
            });

            expect(capturedRequestId).toBe("req-123");
        });

        test("Should set dynamic values using a DynamicValue callback", async () => {
            container.registerDynamic(REQUEST_ID);

            let capturedRequestId: string | undefined;
            await container.init();
            await container.run({
                dynamicRegistration: async (register) => {
                    await register.set({
                        token: REQUEST_ID,
                        value: {
                            dynamicValue: (_executionContext) =>
                                "req-from-callback",
                        },
                    });
                },
                scope: async () => {
                    capturedRequestId =
                        await container.resolveOrFail(REQUEST_ID);
                },
            });

            expect(capturedRequestId).toBe("req-from-callback");
        });

        test("Should preserve callable values as direct service values", async () => {
            const FN_TOKEN = genericToken<() => string>("FnToken");
            const OBJ_TOKEN = genericToken<{ invoke: () => string }>(
                "ObjToken",
            );

            container.registerDynamic(FN_TOKEN);
            container.registerDynamic(OBJ_TOKEN);

            const serviceFn = () => "fn-result";
            const serviceObject = { invoke: () => "obj-result" };

            await container.init();
            await container.run({
                dynamicRegistration: async (register) => {
                    // Neither value is wrapped as a DynamicValue, so both must
                    // be stored directly — never invoked as callbacks.
                    await register.set({ token: FN_TOKEN, value: serviceFn });
                    await register.set({
                        token: OBJ_TOKEN,
                        value: serviceObject,
                    });
                },
                scope: async () => {
                    const resolvedFn = await container.resolveOrFail(FN_TOKEN);
                    const resolvedObj =
                        await container.resolveOrFail(OBJ_TOKEN);
                    expect(resolvedFn).toBe(serviceFn);
                    expect(resolvedObj).toBe(serviceObject);
                },
            });
        });

        test("Should share scoped services within the same run() call", async () => {
            container.registerFactory({
                token: ScopedService,
                factory: () => new ScopedService(),
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            await container.init();
            await container.run({
                scope: async () => {
                    const instance1 =
                        await container.resolveOrFail(ScopedService);
                    const instance2 =
                        await container.resolveOrFail(ScopedService);
                    expect(instance1).toBe(instance2);
                },
            });
        });
    });

    // -----------------------------------------------------------------------
    // overrideFactory
    // -----------------------------------------------------------------------
    describe("method: overrideFactory", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });
        test("Should override an existing factory registration", () => {
            container.registerFactory({
                token: ILOGGER,
                factory: () => new ConsoleLogger(),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            expect(() => {
                container.overrideFactory({
                    token: ILOGGER,
                    factory: () => new FileLogger(),
                    deps: {},
                });
            }).not.toThrow();
        });

        test("Should override a factory registration with different dependencies", () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "old", timeout: 1000 },
            });

            container.registerFactory({
                token: ILOGGER,
                factory: () => new ConsoleLogger(),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            expect(() => {
                container.overrideFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: { config: ICONFIG },
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // overrideValue
    // -----------------------------------------------------------------------
    describe("method: overrideValue", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should override an existing value registration", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://old.example.com", timeout: 1000 },
            });

            container.overrideValue({
                token: ICONFIG,
                value: { apiUrl: "https://new.example.com", timeout: 5000 },
            });

            await container.init();
            const result = await container.resolveOrFail(ICONFIG);
            expect(result).toEqual({
                apiUrl: "https://new.example.com",
                timeout: 5000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // lifecycle hooks: onContainerInit / onContainerDeInit
    // -----------------------------------------------------------------------
    describe("lifecycle hooks", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should register an onContainerInit hook", () => {
            expect(() => {
                container.onContainerInit((_resolver) => {
                    // Hook registered
                });
            }).not.toThrow();
        });

        test("Should register an onContainerDeInit hook", () => {
            expect(() => {
                container.onContainerDeInit((_resolver) => {
                    // Hook registered
                });
            }).not.toThrow();
        });

        test("Should call onContainerInit hooks when init() is called", async () => {
            const hook = vi.fn();

            container.onContainerInit(hook);

            await container.init();

            expect(hook).toHaveBeenCalledOnce();
        });

        test("Should call onContainerDeInit hooks when deInit() is called", async () => {
            const hook = vi.fn();

            container.onContainerDeInit(hook);

            await container.init();
            await container.deInit();

            expect(hook).toHaveBeenCalledOnce();
        });

        test("Should call multiple onContainerInit hooks in registration order", async () => {
            const hook1 = vi.fn();
            const hook2 = vi.fn();

            container.onContainerInit(hook1);
            container.onContainerInit(hook2);

            await container.init();

            expect(hook1).toHaveBeenCalledOnce();
            expect(hook2).toHaveBeenCalledOnce();
            expect(hook1.mock.invocationCallOrder[0]).toBeLessThan(
                hook2.mock.invocationCallOrder[0] as number,
            );
        });

        test("Should call multiple onContainerDeInit hooks in registration order", async () => {
            const hook1 = vi.fn();
            const hook2 = vi.fn();

            container.onContainerDeInit(hook1);
            container.onContainerDeInit(hook2);

            await container.init();
            await container.deInit();

            expect(hook1).toHaveBeenCalledOnce();
            expect(hook2).toHaveBeenCalledOnce();
            expect(hook1.mock.invocationCallOrder[0]).toBeLessThan(
                hook2.mock.invocationCallOrder[0] as number,
            );
        });

        test("Should allow resolving services within init hooks", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            let resolvedConfig: IConfig | null = null;

            container.onContainerInit(async (resolver) => {
                resolvedConfig = await resolver.resolveOrFail(ICONFIG);
            });

            await container.init();

            expect(resolvedConfig).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });

        test("Should allow resolving services within deInit hooks", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            let resolvedConfig: IConfig | null = null;

            container.onContainerDeInit(async (resolver) => {
                resolvedConfig = await resolver.resolveOrFail(ICONFIG);
            });

            await container.init();
            await container.deInit();

            expect(resolvedConfig).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // init / deInit
    // -----------------------------------------------------------------------
    describe("method: init / deInit", () => {
        let container: IContainer;

        beforeEach(() => {
            container = createContainerAndExecutionContext().container;
        });

        test("Should initialize without error when no hooks are registered", async () => {
            await expect(container.init()).resolves.toBeUndefined();
        });

        test("Should deInit without error when no hooks are registered", async () => {
            await container.init();
            await expect(container.deInit()).resolves.toBeUndefined();
        });

        test("Should support full lifecycle: init → use → deInit", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            await container.init();

            const config = await container.resolveOrFail(ICONFIG);
            expect(config.apiUrl).toBe("https://api.example.com");

            await container.deInit();
        });
    });

    // -----------------------------------------------------------------------
    // initTransientFactories (memory-leak regression)
    // -----------------------------------------------------------------------
    describe("initTransientFactories", () => {
        test("Should keep the factory closure set bounded across repeated transient resolutions", async () => {
            const { container } = createContainerAndExecutionContext();

            const DEP = genericToken<{ value: number }>("Dep");
            const OTHER = genericToken<{ value: number }>("Other");
            const SERVICE = genericToken<{
                dep: { value: number };
                other: { value: number };
            }>("Service");

            container.registerFactory({
                token: DEP,
                factory: () => ({ value: 1 }),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            container.registerFactory({
                token: OTHER,
                factory: () => ({ value: 2 }),
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            container.registerFactory({
                token: SERVICE,
                factory: ({ dep, other }) => ({ dep, other }),
                deps: { dep: DEP, other: OTHER },
                lifetime: LIFETIME.TRANSIENT,
            });

            const saveInBaseRegistrySpy = vi.spyOn(
                RegistryManager.prototype,
                "saveInBaseRegistry",
            );

            await container.init();
            const savesAfterInit = saveInBaseRegistrySpy.mock.calls.length;
            expect(savesAfterInit).toBeGreaterThan(0);

            const resolved = new Array<{
                dep: { value: number };
                other: { value: number };
            }>(100);
            for (let i = 0; i < resolved.length; i++) {
                resolved[i] = await container.resolveOrFail(SERVICE);
            }

            // Repeated resolutions must not write new closures or resolved
            // instances into the registry. The factory closure set is fixed
            // during init and bounded by the transient node count, so it
            // cannot grow with the number of resolutions.
            expect(saveInBaseRegistrySpy.mock.calls.length).toBe(
                savesAfterInit,
            );

            // Transient semantics: every resolution returns a fresh instance
            // instead of reusing a retained one.
            expect(new Set(resolved).size).toBe(resolved.length);

            saveInBaseRegistrySpy.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // method: fork
    // -----------------------------------------------------------------------
    describe("method: fork", () => {
        let parentContainer: IContainer;

        beforeEach(() => {
            parentContainer = createContainerAndExecutionContext().container;
        });

        test("Should create a child container from the parent", () => {
            const child = parentContainer.fork();
            expect(child).toBeDefined();
        });

        test("Should inherit value registrations from parent", async () => {
            parentContainer.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            const child = parentContainer.fork();
            await child.init();
            const result = await child.resolveOrFail(ICONFIG);

            expect(result).toEqual({
                apiUrl: "https://api.example.com",
                timeout: 5000,
            });
        });

        test("Should allow child to override registrations without affecting parent", async () => {
            parentContainer.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://parent.example.com", timeout: 5000 },
            });

            const child = parentContainer.fork();

            child.overrideValue({
                token: ICONFIG,
                value: { apiUrl: "https://child.example.com", timeout: 100 },
            });

            await parentContainer.init();
            const parentConfig = await parentContainer.resolveOrFail(ICONFIG);
            await child.init();
            const childConfig = await child.resolveOrFail(ICONFIG);

            expect(parentConfig.apiUrl).toBe("https://parent.example.com");
            expect(childConfig.apiUrl).toBe("https://child.example.com");
        });

        test("Should support forking and overriding specific services for test isolation", async () => {
            parentContainer.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://real.example.com", timeout: 5000 },
            });

            const testContainer = parentContainer.fork();

            testContainer.overrideValue({
                token: ICONFIG,
                value: { apiUrl: "https://test.example.com", timeout: 100 },
            });

            // Verify parent still has original config

            await parentContainer.init();
            const parentConfig = await parentContainer.resolveOrFail(ICONFIG);
            expect(parentConfig.apiUrl).toBe("https://real.example.com");

            // Verify child has overridden config
            await testContainer.init();
            const childConfig = await testContainer.resolveOrFail(ICONFIG);
            expect(childConfig.apiUrl).toBe("https://test.example.com");
        });
    });

    // -----------------------------------------------------------------------
    // feature: edge cases
    // -----------------------------------------------------------------------
    describe("feature: edge cases", () => {
        test("Should handle registration with no dependencies", () => {
            const container = createContainerAndExecutionContext().container;

            expect(() => {
                container.registerFactory({
                    token: ConsoleLogger,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
            }).not.toThrow();
        });

        test("Should handle registration of a chain of dependent factories", () => {
            const container = createContainerAndExecutionContext().container;

            expect(() => {
                container.registerFactory({
                    token: Database,
                    factory: () => new Database(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });

                container.registerFactory({
                    token: UserService,
                    factory: (args) => new UserService(args.db),
                    deps: { db: Database },
                    lifetime: LIFETIME.SINGLETON,
                });

                container.registerFactory({
                    token: UserController,
                    factory: (args) =>
                        new UserController(args.userService, args.consoleLoger),
                    deps: {
                        userService: UserService,
                        consoleLoger: ConsoleLogger,
                    },
                    lifetime: LIFETIME.TRANSIENT,
                });
            }).not.toThrow();
        });

        test("Should handle multiple unique tokens independently", async () => {
            const container = createContainerAndExecutionContext().container;
            const TOKEN_A = genericToken<string>("A");
            const TOKEN_B = genericToken<string>("B");

            container.registerValue({ token: TOKEN_A, value: "value-a" });
            container.registerValue({ token: TOKEN_B, value: "value-b" });

            await container.init();
            const a = await container.resolveOrFail(TOKEN_A);
            const b = await container.resolveOrFail(TOKEN_B);

            expect(a).toBe("value-a");
            expect(b).toBe("value-b");
        });

        test("Should handle a factory that returns an async value", async () => {
            const container = createContainerAndExecutionContext().container;

            container.registerFactory({
                token: ILOGGER,
                factory: async () => {
                    await Promise.resolve();
                    return new ConsoleLogger();
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            await container.init();
            const logger = await container.resolveOrFail(ILOGGER);
            expect(logger).toBeDefined();
            expect(typeof logger.log).toBe("function");
        });

        test("Should handle a factory that ignores the execution context parameter", () => {
            const container = createContainerAndExecutionContext().container;

            expect(() => {
                container.registerFactory({
                    token: ILOGGER,
                    factory: () => {
                        return new ConsoleLogger();
                    },
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
            }).not.toThrow();
        });

        test("Should allow using a class as the factory token", () => {
            const container = createContainerAndExecutionContext().container;

            expect(() => {
                container.registerFactory({
                    token: ConsoleLogger,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // feature: full integration scenarios
    // -----------------------------------------------------------------------
    describe("feature: full integration scenarios", () => {
        test("Should support a complete DI workflow: register → resolve → scope", async () => {
            const container = createContainerAndExecutionContext().container;

            // Register configuration
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            // Register database
            container.registerFactory({
                token: Database,
                factory: () => new Database(),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            // Register user service (depends on DB)
            container.registerFactory({
                token: IUSER_SERVICE,
                factory: ({ db }) => ({
                    getUser: async (id: string) => {
                        await db.query(`SELECT * FROM users WHERE id = ${id}`);
                        return { name: "John Doe" };
                    },
                }),
                deps: { db: Database },
                lifetime: LIFETIME.SCOPED,
            });

            // Register logger
            container.registerFactory({
                token: ConsoleLogger,
                factory: () => new ConsoleLogger(),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            // Register dynamic request ID
            container.registerDynamic(REQUEST_ID);

            // Execute within a scope (simulating a request)
            await container.init();
            await container.run({
                dynamicRegistration: async (register) => {
                    await register.set({
                        token: REQUEST_ID,
                        value: "req-001",
                    });
                },
                scope: async () => {
                    const requestId = await container.resolveOrFail(REQUEST_ID);
                    expect(requestId).toBe("req-001");

                    const userService =
                        await container.resolveOrFail(IUSER_SERVICE);
                    const user = await userService.getUser("42");
                    expect(user).toEqual({ name: "John Doe" });

                    const config = await container.resolveOrFail(ICONFIG);
                    expect(config.apiUrl).toBe("https://api.example.com");
                },
            });
        });

        test("Should support testing workflow: register → fork → override → resolve", async () => {
            const appContainer = createContainerAndExecutionContext().container;

            // Register real services
            appContainer.registerFactory({
                token: Database,
                factory: () => new Database(),
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });

            appContainer.registerFactory({
                token: UserService,
                factory: ({ db }) => new UserService(db),
                deps: { db: Database },
                lifetime: LIFETIME.SINGLETON,
            });

            // Create test container
            const testContainer = appContainer.fork();

            // Override only the database with a mock
            testContainer.overrideFactory({
                token: Database,
                factory: () => new MockDatabase(),
                deps: {},
            });

            await testContainer.init();
            await appContainer.init();

            // Resolve from test container — should get UserService with MockDatabase
            const userService = await testContainer.resolveOrFail(UserService);
            expect(userService).toBeInstanceOf(UserService);

            // Parent container still has real Database
            const parentDb = await appContainer.resolveOrFail(Database);
            expect(parentDb).toBeInstanceOf(Database);
        });

        test("Should support service providers for batch registration", async () => {
            const container = createContainerAndExecutionContext().container;

            function appProvider(register: IServiceRegister): void {
                register.registerFactory({
                    token: ConsoleLogger,
                    factory: () => new ConsoleLogger(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });

                register.registerFactory({
                    token: Database,
                    factory: () => new Database(),
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });

                register.registerValue({
                    token: ICONFIG,
                    value: { apiUrl: "https://api.example.com", timeout: 5000 },
                });
            }

            container.registerProvider(appProvider);

            await container.init();

            const logger = await container.resolveOrFail(ConsoleLogger);
            expect(logger).toBeInstanceOf(ConsoleLogger);

            const db = await container.resolveOrFail(Database);
            expect(db).toBeInstanceOf(Database);

            await container.deInit();
        });
    });
});

// TODO remove duplicate tests above if any

describe(`Illegal method call before ${Container.name}.${Container.prototype.init.name} or after ${Container.name}.${Container.prototype.deInit.name} (when container not active)`, () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainerAndExecutionContext().container;
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
                    name: Container.prototype.resolve.name,
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.resolveOr(token, "_");
                    },
                    name: Container.prototype.resolveOr.name,
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.resolveOrFail(token);
                    },
                    name: Container.prototype.resolveOrFail.name,
                },
                {
                    func: async () => {
                        const token = createToken();
                        await container.has(token);
                    },
                    name: Container.prototype.has.name,
                },
            ] satisfies Array<TestData>,
    );

    const testCases2: Array<TestData> = [
        {
            func: async () => {
                await container.deInit();
            },
            name: Container.prototype.deInit.name,
        },
        {
            func: async () => {
                await container.run({
                    scope: () => {},
                });
            },
            name: Container.prototype.run.name,
        },
    ];

    const testCases = [...testCases1, ...testCases2];

    test.each(testCases)(
        `When method ${Container.name}.$name is called before ${Container.name}.${Container.prototype.init.name} then should fail with ${InvalidMethodCallDiError.name}`,
        async (testCase) => {
            const promise = testCase.func();
            await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidMethodCallDiError.FLAG.NOT_ACTIVE,
            );
        },
    );

    test.each(testCases)(
        `When $name is called after ${Container.prototype.init.name} then should not fail with ${InvalidMethodCallDiError.name}`,
        async (testCase) => {
            await container.init();
            let error: unknown = null;

            try {
                await testCase.func();
            } catch (unknownError) {
                error = unknownError;
            }

            expect(error).not.toBeInstanceOf(InvalidMethodCallDiError);
        },
    );

    test.each(testCases)(
        `When ${Container.name}.$name is called after ${Container.name}.${Container.prototype.deInit.name} then should fail with ${InvalidMethodCallDiError.name}`,
        async (testCase) => {
            await container.init();
            await container.deInit();
            const promise = testCase.func();
            await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidMethodCallDiError.FLAG.NOT_ACTIVE,
            );
        },
    );
});

describe(`illegal method call after ${Container.prototype.init.name} (when container is active)`, () => {
    class A {
        private: unknown;
    }
    let container: IContainer;
    beforeEach(() => {
        container = createContainerAndExecutionContext().container;
    });

    type TestData = {
        func: () => Promise<void> | void;
        name: string;
    };

    const allRegistration = [
        {
            func: () => {
                container.registerFactory({
                    deps: {},
                    factory: () => new A(),
                    token: A,
                    lifetime: LIFETIME.SINGLETON,
                });
            },

            name: Container.prototype.registerFactory.name,
        },

        {
            func: () => {
                container.registerDynamic(A);
            },
            name: Container.prototype.registerDynamic.name,
        },
        {
            func: () => {
                container.registerValue({ token: A, value: new A() });
            },
            name: Container.prototype.registerValue.name,
        },
        {
            func: () => {
                container.registerProvider(() => {});
            },
            name: Container.prototype.registerProvider.name,
        },
    ];

    const containerHooks: Array<TestData> = [
        {
            func() {
                container.onContainerInit(() => {});
            },
            name: Container.prototype.onContainerInit.name,
        },
        {
            func() {
                container.onContainerDeInit(() => {});
            },
            name: Container.prototype.onContainerDeInit.name,
        },
    ];

    const overrides: Array<TestData> = [
        {
            func() {
                container.overrideFactory({
                    deps: {},
                    token: A,
                    factory: () => new A(),
                });
            },
            name: Container.prototype.overrideFactory.name,
        },
        {
            func() {
                container.overrideValue({ token: A, value: new A() });
            },
            name: Container.prototype.overrideValue.name,
        },
    ];

    const init: Array<TestData> = [
        {
            async func() {
                await container.init();
            },
            name: Container.prototype.init.name,
        },
    ];

    const fork: Array<TestData> = [
        {
            func() {
                container.fork();
            },
            name: Container.prototype.fork.name,
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
        `When ${Container.name}.$name is called after ${Container.name}.${Container.prototype.init.name} then should fail with ${InvalidMethodCallDiError.name}`,
        async (testCase) => {
            await container.init();
            const promise = (async () => {
                await testCase.func();
            })();
            await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidMethodCallDiError.FLAG.ALREADY_INITIALIZED,
            );
        },
    );
});

describe(`illegal method call inside ${Container.prototype.run.name}`, () => {
    test(`${Container.prototype.fork.name} method call inside ${Container.prototype.run.name} should fail`, async () => {
        const container = createContainerAndExecutionContext().container;
        await container.init();

        const promise = container.run({
            scope: async () => {
                await container.deInit();
            },
        });
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        //await promise;
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.INSIDE_RUN,
        );
    });
});

describe(`illegal method call inside DynamicServiceProvider in ${Container.prototype.run.name} block`, () => {
    test(`${Container.prototype.resolve.name} method should fail inside DynamicServiceProvider`, async () => {
        const container = createContainerAndExecutionContext().container;
        await container.init();
        const tokenA = genericToken("A");

        const promise = container.run({
            dynamicRegistration: async () => {
                await container.resolve(tokenA);
            },
            scope: async () => {},
        });
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION,
        );
    });

    test(`${Container.prototype.resolveOr.name} method should fail inside DynamicServiceProvider`, async () => {
        const container = createContainerAndExecutionContext().container;
        await container.init();
        const tokenA = genericToken("A");

        const promise = container.run({
            dynamicRegistration: async () => {
                await container.resolveOr(tokenA, "_");
            },
            scope: async () => {},
        });
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION,
        );
    });

    test(`${Container.prototype.resolveOrFail.name} method should fail inside DynamicServiceProvider`, async () => {
        const container = createContainerAndExecutionContext().container;
        await container.init();
        const tokenA = genericToken("A");

        const promise = container.run({
            dynamicRegistration: async () => {
                await container.resolveOrFail(tokenA);
            },
            scope: async () => {},
        });
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.INSIDE_DYNAMIC_REGISTRATION,
        );
    });
});

describe(`illegal method call outside ${Container.prototype.run.name}`, () => {
    test("DynamicServiceProvider.set()", async () => {
        const container = createContainerAndExecutionContext().container;
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
        const promise = (async () => {
            await regCapture?.set({ token, value: "_" });
        })();
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.OUTSIDE_RUN,
        );
    });
});

describe(`${Container.prototype.onContainerInit.name} & ${Container.prototype.init.name}`, () => {
    let container: IContainer;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const res = createContainerAndExecutionContext();
        container = res.container;
        executionContext = res.executionContext;
    });

    test(`should register all and call ${Container.prototype.init.name} hooks in the correct order`, async () => {
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

    test(`should resolve successfully in the ${Container.prototype.init.name} handler`, async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        container.registerFactory(nodeA);
        let value: string | null | undefined = undefined as
            string | null | undefined;

        container.onContainerInit(async (serviceResolver) => {
            value = await serviceResolver.resolve(nodeA.token);
        });

        await container.init();
        expect(value).toBe(
            await callInvocable(nodeA.factory, {}, executionContext),
        );
    });
});

describe(`${Container.prototype.onContainerDeInit.name} & ${Container.prototype.deInit.name}`, () => {
    let container: IContainer;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const res = createContainerAndExecutionContext();
        container = res.container;
        executionContext = res.executionContext;
    });

    test(`should register all and call ${Container.prototype.deInit.name} hooks in the correct order`, async () => {
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

    test(`should resolve successfully in the ${Container.prototype.deInit.name} handler`, async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        container.registerFactory(nodeA);
        let value: string | null | undefined = undefined as
            string | null | undefined;

        container.onContainerDeInit(async (serviceResolver) => {
            value = await serviceResolver.resolve(nodeA.token);
        });

        await container.init();
        await container.deInit();

        expect(value).toBe(
            await callInvocable(nodeA.factory, {}, executionContext),
        );
    });
});

describe("init / deInit failure semantics", () => {
    test("Should move to a non-active state when an init hook rejects", async () => {
        const { container } = createContainerAndExecutionContext();

        container.onContainerInit(() => {
            throw new Error("init hook failed");
        });

        await expect(container.init()).rejects.toThrow("init hook failed");

        // A failed init must not leave the container usable: resolves and
        // re-inits are both blocked.
        await expect(container.resolve(ICONFIG)).rejects.toThrow(
            InvalidMethodCallDiError,
        );
        await expect(container.init()).rejects.toThrow(
            InvalidMethodCallDiError,
        );
    });

    test("Should run every deInit hook and still terminate when one rejects", async () => {
        const { container } = createContainerAndExecutionContext();

        const hook1 = vi.fn();
        const hook2 = vi.fn();
        container.onContainerDeInit(hook1);
        container.onContainerDeInit(() => {
            throw new Error("deInit hook failed");
        });
        container.onContainerDeInit(hook2);

        await container.init();
        await expect(container.deInit()).rejects.toThrow("deInit hook failed");

        // Every deInit handler runs even though one rejects.
        expect(hook1).toHaveBeenCalled();
        expect(hook2).toHaveBeenCalled();

        // Cleanup still ran: the container is terminated.
        await expect(container.resolve(ICONFIG)).rejects.toThrow(
            InvalidMethodCallDiError,
        );
    });
});

describe("has", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainerAndExecutionContext().container;
    });

    test("should return true when called on a singleton node", async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        container.registerFactory(nodeA);
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(true);
    });

    test("should return true when called on a transient node", async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.TRANSIENT)
            .createToken("A");

        container.registerFactory(nodeA);
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(true);
    });

    test("should return false when called on a scoped node at top", async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.SCOPED)
            .createToken("A");

        container.registerFactory(nodeA);
        await container.init();

        const value = await container.has(nodeA.token);
        expect(value).toBe(false);
    });

    test("should return false when called on a dynamic node at top", async () => {
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
        container = createContainerAndExecutionContext().container;
    });

    test(`When a token is registered twice should fail with ${CanNotRegisterServiceDiError.name}`, () => {
        const node = dependency({})
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("");
        container.registerFactory(node);

        let error: unknown = null;
        try {
            container.registerFactory(node);
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(CanNotRegisterServiceDiError);
        expect(error).toHaveProperty(
            "flag",
            CanNotRegisterServiceDiError.FLAG.ALREADY_REGISTERED,
        );
    });
});

describe(`${Container.prototype.resolve.name} & ${Container.name}.${Container.prototype.init.name} & ${Container.name}.${Container.prototype.run.name}`, () => {
    let container: IContainer;
    let tokenA: DiToken<string>;
    beforeEach(async () => {
        container = createContainerAndExecutionContext().container;
        tokenA = genericToken<string>("token");
        await container.init();
    });

    describe("nonexistent token", () => {
        test(`should return null when resolving a nonexistent token at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
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
        test(`should fail when resolving a nonexistent token at top with ${Container.name}.${Container.prototype.resolveOrFail.name}`, async () => {
            const promise = container.resolveOrFail(tokenA);
            await expect(promise).rejects.toThrow(CanNotBeResolvedDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                CanNotBeResolvedDiError.FLAG.NOT_REGISTERED_TOKEN,
            );
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
        test(`should return the default value when resolving a nonexistent token at top with ${Container.name}.${Container.prototype.resolveOr.name}`, async () => {
            const defaultValue = "_";
            await expect(
                container.resolveOr(tokenA, defaultValue),
            ).resolves.toBe(defaultValue);
        });

        test(`should return null when resolving a nonexistent token inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            let value: undefined | string | null = undefined as
                undefined | string | null;

            await container.run({
                scope: async () => {
                    value = await container.resolve(tokenA);
                },
            });

            expect(value).toBe(null);
        });

        test(`should fail when resolving a nonexistent token inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolveOrFail.name}`, async () => {
            const promise = container.run({
                scope: async () => {
                    return await container.resolveOrFail(tokenA);
                },
            });
            await expect(promise).rejects.toThrow(CanNotBeResolvedDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                CanNotBeResolvedDiError.FLAG.NOT_REGISTERED_TOKEN,
            );
        });

        test(`should return the default value when resolving a nonexistent token inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolveOr.name}`, async () => {
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

describe(`register & ${Container.name}.${Container.prototype.init.name} & ${Container.prototype.resolve.name}`, () => {
    let container: IContainer;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const value = createContainerAndExecutionContext();
        container = value.container;
        executionContext = value.executionContext;
    });

    describe("singleton", () => {
        test(`Should resolve successfully when resolving a singleton dependency at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "_")
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();

            const correctValue = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        test(`Should resolve successfully a deep singleton dependency chain at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "1")
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            const nodeB = dependency({ a: nodeA.token })
                .factory(({ a }) => [a, "2"].join(""))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("B");

            const nodeC = dependency({ b: nodeB.token })
                .factory(({ b }) => [b, "3"].join(""))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("C");

            const nodeD = dependency({ c: nodeC.token })
                .factory(({ c }) => [c, "4"].join(""))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("D");
            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);
            container.registerFactory(nodeD);

            await container.init();

            const value = await container.resolve(nodeD.token);
            const valueA = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            const valueB = await callInvocable(
                nodeB.factory,
                { a: valueA },
                executionContext,
            );
            const valueC = await callInvocable(
                nodeC.factory,
                { b: valueB },
                executionContext,
            );
            const correctValue = await callInvocable(
                nodeD.factory,
                { c: valueC },
                executionContext,
            );

            expect(value).toBe(correctValue);
        });

        /**
         * container.registerProvider is shortcut for registering multiple factories at once and is independent of node type.
         * Only singleton registration through container.registerProvider is tested because implementation of container.registerProvider can done independent of node type.
         * The method lambda argument to container.registerProvider can be implemented as proxy object of IContainer.
         */
        test(`Should resolve successfully when resolving a singleton dependency through ${Container.name}.${Container.prototype.registerProvider.name} with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "_")
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerProvider((provider) => {
                provider.registerFactory(nodeA);
            });

            await container.init();

            const correctValue = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        /**
         * This behavior is independent of node type and should apply for singleton scoped, dynamic and transient nodes.
         * Only singleton is tested because behavior and implementation of container.resolveOr can done independent of node type.
         */
        test(`Should resolve to the default value when resolving a singleton dependency at top where its factory returns null with ${Container.name}.${Container.prototype.resolveOr.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => null as null | string)
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerFactory(nodeA);
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
        test(`Should fail when resolving a singleton dependency at top where its factory returns null with ${Container.name}.${Container.prototype.resolveOrFail.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => null as null | string)
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();

            const promise = container.resolveOrFail(nodeA.token);
            await expect(promise).rejects.toThrow(CanNotBeResolvedDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                CanNotBeResolvedDiError.FLAG.RESOLVED_VALUE_IS_NULL,
            );
        });

        test(`Should resolve successfully a singleton dependency defined by a factory that uses the executionContext with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container.registerFactory({
                deps: {},
                token: tokenA,
                factory: (_, executionContext_) => {
                    const date = executionContext_.getOrFail(dateKey);
                    return date;
                },
                lifetime: LIFETIME.SINGLETON,
            });

            const correctValue = new Date(1786699358026);

            let valueA: Date | undefined | null = undefined as
                Date | undefined | null;

            await executionContext.run(async () => {
                executionContext.put(dateKey, correctValue);
                await container.init();
                valueA = await container.resolve(tokenA);
            });

            expect(valueA).toBe(correctValue);
        });

        test(`Should resolve successfully eagerly a singleton dependency defined by a factory that uses the executionContext with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container.registerFactory({
                deps: {},
                token: tokenA,
                factory: (_, executionContext_) => {
                    const date = executionContext_.getOrFail(dateKey);
                    return date;
                },
                lifetime: LIFETIME.SINGLETON,
            });

            const correctValue = new Date(1786699358026);
            const newValue = new Date(correctValue.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                Date | undefined | null;

            let valueB: Date | undefined | null = undefined as
                Date | undefined | null;

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

        test(`Should equal by reference when comparing two items resolved from the same token with ${Container.name}.${Container.prototype.resolve.name} at different scope depths`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerFactory(nodeA);
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

        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are singleton "b","c" should have same instance of "a" and hence "resolved_d.b" === "resolved_d.c".
        test(`Should equal by reference when resolving a singleton diamond where two nodes reference the same singleton instance with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => nodeAValue)
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => nodeAValue)
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("C");

            const nodeD = dependency({
                nodeBValue: nodeB.token,
                nodeCValue: nodeC.token,
            })
                .factory(({ nodeBValue, nodeCValue }) => ({
                    nodeAValue0: nodeBValue,
                    nodeAValue1: nodeCValue,
                }))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("D");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);
            container.registerFactory(nodeD);

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
         *            deps:{},
         *            token:token,
         *            factory: () => value,
         *        }).singleton();
         * ```
         * Therefore, container.registerValue should behave same as container.registerFactory().singleton().
         */
        test(`Should resolve a singleton value successfully after registration with ${Container.name}.${Container.prototype.registerValue.name} at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const value = "_";
            const tokenA = genericToken<string>("A");
            container.registerValue({ token: tokenA, value });
            await container.init();

            await expect(container.resolve(tokenA)).resolves.toBe(value);
        });
    });

    describe("transient", () => {
        test(`Should resolve successfully when resolving a transient dependency at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "_")
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();

            const correctValue = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            await expect(container.resolve(nodeA.token)).resolves.toBe(
                correctValue,
            );
        });

        test(`Should resolve successfully a deep transient dependency chain at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "1")
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("A");

            const nodeB = dependency({ a: nodeA.token })
                .factory(({ a }) => [a, "2"].join(""))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            const nodeC = dependency({ b: nodeB.token })
                .factory(({ b }) => [b, "3"].join(""))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("C");

            const nodeD = dependency({ c: nodeC.token })
                .factory(({ c }) => [c, "4"].join(""))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("D");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);
            container.registerFactory(nodeD);

            await container.init();

            const valueA = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            const valueB = await callInvocable(
                nodeB.factory,
                { a: valueA },
                executionContext,
            );
            const valueC = await callInvocable(
                nodeC.factory,
                { b: valueB },
                executionContext,
            );
            const correctValue = await callInvocable(
                nodeD.factory,
                { c: valueC },
                executionContext,
            );

            const value = await container.resolve(nodeD.token);

            expect(value).toBe(correctValue);
        });

        test(`Should resolve successfully a transient dependency defined by a factory that uses the executionContext with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container.registerFactory({
                deps: {},
                token: tokenA,
                factory: (_, executionContext_) => {
                    const date = executionContext_.getOrFail(dateKey);
                    return date;
                },
                lifetime: LIFETIME.TRANSIENT,
            });

            const correctValue0 = new Date(1786699358026);
            const correctValue1 = new Date(correctValue0.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                Date | undefined | null;

            let valueB: Date | undefined | null = undefined as
                Date | undefined | null;

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

        test(`Should not equal by reference when comparing two items resolved by the same token with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();
            const valueA = container.resolve(nodeA.token);
            const valueB = container.resolve(nodeA.token);
            expect(valueA).not.toBe(valueB);
        });

        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are transient "b","c" should have own instance of "a" and hence "resolved_d.b" !== "resolved_d.c".
        test(`Should not equal by reference when resolving a transient diamond where two nodes reference distinct transient instances with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => nodeAValue)
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("A");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => nodeAValue)
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("C");

            const nodeD = dependency({
                nodeBValue: nodeB.token,
                nodeCValue: nodeC.token,
            })
                .factory(({ nodeBValue, nodeCValue }) => ({
                    nodeAValue0: nodeBValue,
                    nodeAValue1: nodeCValue,
                }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("D");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);
            container.registerFactory(nodeD);

            await container.init();
            const valueA = await container.resolve(nodeD.token);
            expect(valueA?.nodeAValue0).not.toBeUndefined();
            expect(valueA?.nodeAValue0).not.toBe(valueA?.nodeAValue1);
        });
    });

    describe("scoped", () => {
        test(`should return null when resolving a scoped dependency at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "")
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();
            await expect(container.resolve(nodeA.token)).resolves.toBe(null);
        });

        test(`Should resolve successfully when resolving a scoped dependency inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "_")
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();

            let value: undefined | string | null = undefined as
                undefined | string | null;

            await container.run({
                scope: async () => {
                    value = await container.resolve(nodeA.token);
                },
            });

            const correctValue = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            expect(value).toBe(correctValue);
        });

        test(`should return null when resolving a scoped dependency at top but inside an execution context ${Container.prototype.run.name} block with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "")
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();
            let value: string | undefined | null = undefined;

            await executionContext.run(async () => {
                value = await container.resolve(nodeA.token);
            });

            expect(value).toBe(null);
        });

        test(`Should resolve a scoped dependency defined by a factory that uses the executionContext with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container.registerFactory({
                deps: {},
                token: tokenA,
                factory: (_, executionContext_) => {
                    const date = executionContext_.getOrFail(dateKey);
                    return date;
                },
                lifetime: LIFETIME.SCOPED,
            });

            const correctValue0 = new Date(1786699358026);

            let valueA: Date | undefined | null = undefined as
                Date | undefined | null;

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

        test(`Should eagerly create a distinct scoped instance per scope from the executionContext value at scope entry with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<Date>("A");
            const dateKey = genericToken<Date>("date");

            container.registerFactory({
                deps: {},
                token: tokenA,
                factory: (_, executionContext_) => {
                    const date = executionContext_.getOrFail(dateKey);
                    return date;
                },
                lifetime: LIFETIME.SCOPED,
            });

            const correctValue0 = new Date(1786699358026);
            const correctValue1 = new Date(correctValue0.getTime() + 1000);

            let valueA: Date | undefined | null = undefined as
                Date | undefined | null;

            let valueB: Date | undefined | null = undefined as
                Date | undefined | null;

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

        test(`Should not equal by reference when comparing two items resolved by the same token with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            container.registerFactory(nodeA);
            await container.init();
            const valueA = container.resolve(nodeA.token);
            const valueB = container.resolve(nodeA.token);
            expect(valueA).not.toBe(valueB);
        });

        test(`Should equal by reference when comparing two items resolved by the same token in the same scope depth with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                undefined | object | null;

            let valueB: undefined | object | null = undefined as
                undefined | object | null;

            container.registerFactory(nodeA);
            await container.init();

            await container.run({
                scope: async () => {
                    valueA = await container.resolve(nodeA.token);
                    valueB = await container.resolve(nodeA.token);
                },
            });
            expect(valueA).toBe(valueB);
        });

        test(`Should not equal by reference when comparing two items resolved by the same token in the same scope depth consecutively with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                undefined | object | null;

            let valueB: undefined | object | null = undefined as
                undefined | object | null;

            container.registerFactory(nodeA);
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

        test(`Should not equal by reference when comparing two items resolved by the same token in different scope depths with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            let valueA: undefined | object | null = undefined as
                undefined | object | null;

            let valueB: undefined | object | null = undefined as
                undefined | object | null;

            container.registerFactory(nodeA);
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

        // simple diamond case
        // where "b","c" depends on "a" and where factory_b=()=>factory_a(),factory_b =()=> factory_a()
        // "d" depends on "b","c" and factory_d = (factory_b,factory_c)=>({b:factory_b(),c:factory_c()}).
        // Since all nodes are scoped and resolved within the same scope "b","c" share the same scoped instance of "a" and hence "resolved_d.b" === "resolved_d.c".
        test(`Should equal by reference when resolving a scoped diamond where two nodes reference the same scoped instance within a scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");
            const nodeB = dependency({ nodeValueA: nodeA.token })
                .factory(({ nodeValueA }) => nodeValueA)
                .lifeTime(LIFETIME.SCOPED)
                .createToken("B");
            const nodeC = dependency({ nodeValueA: nodeA.token })
                .factory(({ nodeValueA }) => nodeValueA)
                .lifeTime(LIFETIME.SCOPED)
                .createToken("C");
            const nodeD = dependency({
                nodeValueA0: nodeB.token,
                nodeValueA1: nodeC.token,
            })
                .factory(({ nodeValueA0, nodeValueA1 }) => ({
                    nodeValueA0,
                    nodeValueA1,
                }))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("D");

            let value: { nodeValueA0: object; nodeValueA1: object } | null =
                null as { nodeValueA0: object; nodeValueA1: object } | null;

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);
            container.registerFactory(nodeD);
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
        test(`should return null when resolving a dynamic dependency at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);

            await container.init();
            await expect(container.resolve(tokenA)).resolves.toBe(null);
        });

        test(`Should fail when resolving a dynamic dependency inside ${Container.prototype.run.name} scope block where its factory returns null with ${Container.name}.${Container.prototype.resolveOrFail.name}`, async () => {
            const tokenA = genericToken<string | null>("A");

            container.registerDynamic(tokenA);
            await container.init();

            const promise = container.run({
                scope: async () => {
                    await container.resolveOrFail(tokenA);
                },
            });
            await expect(promise).rejects.toThrow(CanNotBeResolvedDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                CanNotBeResolvedDiError.FLAG.NO_DYNAMIC_VALUE_SET_FOR_TOKENS,
            );
        });

        test(`Should resolve successfully when resolving a dynamic dependency inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);
            const correctValueA = "_";
            let valueA: undefined | string | null = null as
                undefined | string | null;

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

        test("Should resolve a dynamic value from the closest scope", async () => {
            const tokenA = genericToken<string>("A");
            container.registerDynamic(tokenA);
            const scope0ValueOfA = "0";
            const scope1ValueOfA = "1";

            let valueA: undefined | string | null = null as
                undefined | string | null;

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

        test(`Should equal by reference when comparing two items resolved by the same token in the same scope depth with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<object>("A");

            let valueA: undefined | object | null = undefined as
                undefined | object | null;

            let valueB: undefined | object | null = undefined as
                undefined | object | null;

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

        test(`Should equal by reference when comparing two items resolved by the same token in different scope depths with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<object>("A");

            let valueA: undefined | object | null = undefined as
                undefined | object | null;

            let valueB: undefined | object | null = undefined as
                undefined | object | null;

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

        test(`should return null when resolving an existing dynamic token with no value provided inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const tokenA = genericToken<string>("A");
            let value: undefined | string | null = undefined as
                undefined | string | null;

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
        // short version: two scoped at different levels but refer to same dynamic item and dynamic is set only once.
        test("should share the same dynamic value across nested scopes when the dynamic value is set only in the outer scope", async () => {
            const tokenA = genericToken<object>("A");
            const nodeB = dependency({ tokenAValue: tokenA })
                .factory(({ tokenAValue }) => tokenAValue)
                .lifeTime(LIFETIME.SCOPED)
                .createToken("B");

            let valueAScope0: undefined | null | object = undefined as
                undefined | null | object;

            let valueAScope1: undefined | null | object = undefined as
                undefined | null | object;

            container.registerDynamic(tokenA);
            container.registerFactory(nodeB);
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

        // short version: two scoped at different levels but refer to same dynamic item and dynamic is set twice: one before scope resolve to reference and other after.
        test("should use the inner scope dynamic value for a scoped node when the dynamic value is overridden in the inner scope", async () => {
            const tokenA = genericToken<object>("A");
            const nodeB = dependency({ tokenAValue: tokenA })
                .factory(({ tokenAValue }) => tokenAValue)
                .lifeTime(LIFETIME.SCOPED)
                .createToken("B");

            let valueAScope0: undefined | null | object = undefined as
                undefined | null | object;

            let valueAScope1: undefined | null | object = undefined as
                undefined | null | object;

            container.registerDynamic(tokenA);
            container.registerFactory(nodeB);

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
        test(`Should equal by reference when comparing two singleton objects referenced by two scoped items resolved by two different tokens in different scope depths with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("B");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);

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
        test(`Should equal by reference when comparing two singleton objects referenced by two transient items resolved by two different tokens with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);

            await container.init();

            const valueB = await container.resolve(nodeB.token);
            const valueC = await container.resolve(nodeC.token);

            expect(valueB?.nodeAValue).not.toBeUndefined();
            expect(valueB?.nodeAValue).toBe(valueC?.nodeAValue);
        });
    });

    describe("scoped & transient", () => {
        test(`should return null when resolving a transient dependency that depends on a scoped dependency at top with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "")
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            const nodeB = dependency({ a: nodeA.token })
                .factory(() => "")
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            await container.init();
            await expect(container.resolve(nodeB.token)).resolves.toBe(null);
        });

        test(`should resolve successfully when resolving a transient dependency that depends on a scoped dependency inside ${Container.prototype.run.name} block scope with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => "")
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");
            const nodeB = dependency({ a: nodeA.token })
                .factory(() => "")
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            await container.init();

            let value: undefined | null | string = undefined;
            await container.run({
                scope: async () => {
                    value = await container.resolve(nodeB.token);
                },
            });

            const valueA = await callInvocable(
                nodeA.factory,
                {},
                executionContext,
            );
            const correctValue = await callInvocable(
                nodeB.factory,
                { a: valueA },
                executionContext,
            );
            expect(value).toBe(correctValue);
        });

        test(`Should equal by reference when comparing two scoped objects referenced by two transient items resolved by two different tokens in the same scope depth with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);

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

        test(`Should not equal by reference when comparing two scoped objects referenced by two transient items resolved by two different tokens in different scope depths with ${Container.name}.${Container.prototype.resolve.name}`, async () => {
            const nodeA = dependency({})
                .factory(() => ({}))
                .lifeTime(LIFETIME.SCOPED)
                .createToken("A");

            const nodeB = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            const nodeC = dependency({ nodeAValue: nodeA.token })
                .factory(({ nodeAValue }) => ({ nodeAValue }))
                .lifeTime(LIFETIME.TRANSIENT)
                .createToken("B");

            let valueB: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            let valueC: undefined | { nodeAValue: object } | null =
                undefined as undefined | { nodeAValue: object } | null;

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);
            container.registerFactory(nodeC);

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
});

describe("graph validation", () => {
    let container: IContainer;
    beforeEach(() => {
        container = createContainerAndExecutionContext().container;
    });

    /**
     * Undeclared detection can implemented independent of node type.
     * Therefore only singleton tested.
     */
    describe("undeclared nodes", () => {
        test("should throw when undeclared nodes exist", async () => {
            const undeclaredToken = genericToken<string>("undeclared");

            const nodeA = dependency({ undeclared: undeclaredToken })
                .factory(() => "A")
                .lifeTime(LIFETIME.SINGLETON)
                .createToken("A");

            container.registerFactory(nodeA);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES,
            );
        });
    });

    describe("invalid edge detection", () => {
        test("should throw when a singleton -> scoped edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.SINGLETON)
                .reuseToken(tokenA);

            const nodeB = dependency({})
                .factory(() => "B")
                .lifeTime(LIFETIME.SCOPED)
                .reuseToken(tokenB);

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
            );
        });

        test("should throw when a singleton -> dynamic edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.SINGLETON)
                .reuseToken(tokenA);

            container.registerFactory(nodeA);
            container.registerDynamic(tokenB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
            );
        });

        test("should throw when a singleton -> transient edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.SINGLETON)
                .reuseToken(tokenA);

            const nodeB = dependency({})
                .factory(() => "B")
                .lifeTime(LIFETIME.TRANSIENT)
                .reuseToken(tokenB);

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
            );
        });

        test("should throw when a scoped -> transient edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.SCOPED)
                .reuseToken(tokenA);

            const nodeB = dependency({})
                .factory(() => "B")
                .lifeTime(LIFETIME.TRANSIENT)
                .reuseToken(tokenB);

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
            );
        });

        test("should throw when a transient -> dynamic edge is detected", async () => {
            const tokenA = genericToken<string>("A");
            const tokenB = genericToken<string>("B");

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.TRANSIENT)
                .reuseToken(tokenA);

            container.registerFactory(nodeA);
            container.registerDynamic(tokenB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
            );
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

            const nodeA = dependency({ b: tokenB })
                .factory(() => "A")
                .lifeTime(LIFETIME.SINGLETON)
                .reuseToken(tokenA);

            const nodeB = dependency({ a: tokenA })
                .factory(() => "B")
                .lifeTime(LIFETIME.SINGLETON)
                .reuseToken(tokenB);

            container.registerFactory(nodeA);
            container.registerFactory(nodeB);

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY,
            );
        });

        test("should throw when a singleton cycle A->A is detected", async () => {
            const tokenA = genericToken("A");
            container.registerFactory({
                deps: { a: tokenA },
                factory: () => "_",
                token: tokenA,
                lifetime: LIFETIME.SINGLETON,
            });

            const promise = container.init();
            await expect(promise).rejects.toThrow(InvalidGraphDiError);
            await expect(promise).rejects.toHaveProperty(
                "flag",
                InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY,
            );
        });
    });
});

/**
 * container.overrideFactory & overrideClass can implemented independent of node type.
 * Therefore only singleton tested.
 */
describe("override", () => {
    let container: IContainer;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const res = createContainerAndExecutionContext();
        container = res.container;
        executionContext = res.executionContext;
    });

    test(`should override nodeA with ${Container.prototype.overrideFactory.name}`, async () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeAOverridden = dependency({})
            .factory(() => `OverriddenA`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);

        container.overrideFactory(nodeAOverridden);

        await container.init();

        const correctA = await callInvocable(
            nodeAOverridden.factory,
            {},
            executionContext,
        );

        const resolvedA = await container.resolve(nodeAOverridden.token);

        expect(resolvedA).toBe(correctA);
    });

    test("should throw when overriding a node that is not registered", () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        let error: unknown = null;
        try {
            container.overrideFactory(nodeA);
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(CanNotOverrideServiceDiError);
        expect((error as CanNotOverrideServiceDiError).flag).toBe(
            CanNotOverrideServiceDiError.FLAG.TOKEN_NOT_REGISTERED,
        );
    });

    test("should throw when overriding a dynamic node", () => {
        const tokenA = genericToken<string>("dynamic");

        const nodeAOverridden = dependency({})
            .factory(() => `OverriddenA`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(tokenA);

        container.registerDynamic(tokenA);

        let error: unknown = null;
        try {
            container.overrideFactory(nodeAOverridden);
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(CanNotOverrideServiceDiError);
        expect((error as CanNotOverrideServiceDiError).flag).toBe(
            CanNotOverrideServiceDiError.FLAG.DYNAMIC_TOKEN,
        );
    });

    test("should fail when a node is overridden twice", () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeAOverride1 = dependency({})
            .factory(() => `Node A override first time`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        const nodeAOverride2 = dependency({})
            .factory(() => `Node A override second time`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);

        container.overrideFactory(nodeAOverride1);

        let error: unknown = null;
        try {
            container.overrideFactory(nodeAOverride2);
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(CanNotOverrideServiceDiError);
        expect((error as CanNotOverrideServiceDiError).flag).toBe(
            CanNotOverrideServiceDiError.FLAG.ALREADY_OVERRIDDEN,
        );
    });

    test("should affect both A and B when overriding A where B depends on A", async () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({ a: nodeA.token })
            .factory(({ a }) => wrapInParenthesis("B", a))
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("B");

        const nodeAOverridden = dependency({})
            .factory(() => `OverriddenA`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);

        container.registerFactory(nodeB);
        container.overrideFactory(nodeAOverridden);

        await container.init();

        const correctA = await callInvocable(
            nodeAOverridden.factory,
            {},
            executionContext,
        );
        const correctB = await callInvocable(
            nodeB.factory,
            { a: correctA },
            executionContext,
        );

        const resolvedA = await container.resolve(nodeAOverridden.token);
        const resolvedB = await container.resolve(nodeB.token);

        expect(resolvedA).toBe(correctA);
        expect(resolvedB).toBe(correctB);
    });

    test("should affect B but not A when overriding B where B depends on A", async () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({ a: nodeA.token })
            .factory(({ a }) => wrapInParenthesis("B", a))
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("B");

        const nodeBOverridden = dependency({ a: nodeA.token })
            .factory(({ a }) => wrapInParenthesis("OverriddenB", a))
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeB.token);

        container.registerFactory(nodeA);
        container.registerFactory(nodeB);
        container.overrideFactory(nodeBOverridden);

        await container.init();

        const correctA = await callInvocable(
            nodeA.factory,
            {},
            executionContext,
        );
        const correctB = await callInvocable(
            nodeBOverridden.factory,
            { a: correctA },
            executionContext,
        );

        const resolvedA = await container.resolve(nodeA.token);
        const resolvedB = await container.resolve(nodeBOverridden.token);

        expect(resolvedA).toBe(correctA);
        expect(resolvedB).toBe(correctB);
    });

    test("should not affect B but should affect both A and C when overriding A where B depends on A and C depends on B", async () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({ a: nodeA.token })
            .factory(({ a }) => wrapInParenthesis("B", a))
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("B");

        const nodeC = dependency({ b: nodeB.token })
            .factory(({ b }) => wrapInParenthesis("C", b))
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("C");

        const nodeAOverridden = dependency({})
            .factory(() => `OverriddenA`)
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);

        container.registerFactory(nodeB);
        container.registerFactory(nodeC);
        container.overrideFactory(nodeAOverridden);

        await container.init();

        const correctA = await callInvocable(
            nodeAOverridden.factory,
            {},
            executionContext,
        );
        const correctB = await callInvocable(
            nodeB.factory,
            { a: correctA },
            executionContext,
        );
        const correctC = await callInvocable(
            nodeC.factory,
            { b: correctB },
            executionContext,
        );

        const resolvedA = await container.resolve(nodeAOverridden.token);
        const resolvedB = await container.resolve(nodeB.token);
        const resolvedC = await container.resolve(nodeC.token);

        expect(resolvedA).toBe(correctA);
        expect(resolvedB).toBe(correctB);
        expect(resolvedC).toBe(correctC);
    });

    test("should affect only B when overriding B's dependency from A to C", async () => {
        const nodeA = dependency({})
            .factory(() => `A`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({ a: nodeA.token })
            .factory(({ a }) => wrapInParenthesis("B", a))
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("B");

        const nodeC = dependency({})
            .factory(() => `C`)
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("C");

        const overriddenNodeB = dependency({ c: nodeC.token })
            .factory(({ c }) => wrapInParenthesis("B", c))
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeB.token);

        container.registerFactory(nodeA);
        container.registerFactory(nodeB);
        container.registerFactory(nodeC);
        container.overrideFactory(overriddenNodeB);

        await container.init();

        const correctA = await callInvocable(
            nodeA.factory,
            {},
            executionContext,
        );
        const correctC = await callInvocable(
            nodeC.factory,
            {},
            executionContext,
        );
        const correctB = await callInvocable(
            overriddenNodeB.factory,
            { c: correctC },
            executionContext,
        );
        const inCorrectB = await callInvocable(
            nodeB.factory,
            { a: correctA },
            executionContext,
        );

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
        container = createContainerAndExecutionContext().container;
    });

    test("should fail graph validation when an override introduces an invalid edge", async () => {
        const nodeA = dependency({})
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({})
            .factory(() => "")
            .lifeTime(LIFETIME.TRANSIENT)
            .createToken("B");

        const nodeC = dependency({ a: nodeA.token })
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("C");

        const nodeCOverridden = dependency({ b: nodeB.token })
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeC.token);

        container.registerFactory(nodeA);
        container.registerFactory(nodeB);
        container.registerFactory(nodeC);

        container.overrideFactory(nodeCOverridden);
        const promise = container.init();
        await expect(promise).rejects.toThrow(InvalidGraphDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidGraphDiError.FLAG.INVALID_EDGE_RELATIONSHIP,
        );
    });

    test("should fail graph validation when an override introduces a cycle", async () => {
        const nodeA = dependency({})
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");
        const nodeB = dependency({ a: nodeA.token })
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("B");

        const nodeAOverridden = dependency({ b: nodeB.token })
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);
        container.registerFactory(nodeB);
        container.overrideFactory(nodeAOverridden);

        const promise = container.init();
        await expect(promise).rejects.toThrow(InvalidGraphDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidGraphDiError.FLAG.CYCLE_DEPENDENCY,
        );
    });

    test("should fail graph validation when an override introduces a non-existent dependency", async () => {
        const nonExistent = genericToken<string>("");

        const nodeA = dependency({})
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");
        const nodeAOverridden = dependency({ nonexistent: nonExistent })
            .factory(() => "")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        container.registerFactory(nodeA);
        container.overrideFactory(nodeAOverridden);
        const promise = container.init();
        await expect(promise).rejects.toThrow(InvalidGraphDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidGraphDiError.FLAG.UNDECLARED_DEPENDENCIES,
        );
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

    test("adding a node in a fork does not affect the original container", async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.TRANSIENT)
            .createToken("A");

        const containerB = containerA.fork();

        containerB.registerFactory(nodeA);

        await containerA.init();
        await containerB.init();

        const hasNodeBContainerA = await containerA.has(nodeA.token);
        const hasNodeBContainerB = await containerB.has(nodeA.token);

        expect(hasNodeBContainerA).toBe(false);
        expect(hasNodeBContainerB).toBe(true);
    });

    test("adding a node in the original does not affect the fork", async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.TRANSIENT)
            .createToken("A");

        const containerB = containerA.fork();

        containerA.registerFactory(nodeA);

        await containerA.init();
        await containerB.init();

        const hasNodeBContainerA = await containerA.has(nodeA.token);
        const hasNodeBContainerB = await containerB.has(nodeA.token);

        expect(hasNodeBContainerA).toBe(true);
        expect(hasNodeBContainerB).toBe(false);
    });

    test("fork copies all nodes from the original", async () => {
        const nodeA = dependency({})
            .factory(() => "_")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeB = dependency({})
            .factory(() => "B")
            .lifeTime(LIFETIME.TRANSIENT)
            .createToken("B");

        const tokenC = genericToken<string>("C");

        containerA.registerFactory(nodeA);
        containerA.registerFactory(nodeB);
        containerA.registerValue({ token: tokenC, value: "C" });

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        const hasNodeA = await containerB.has(nodeA.token);
        const hasNodeB = await containerB.has(nodeB.token);
        const hasTokenC = await containerB.has(tokenC);

        expect(hasNodeA).toBe(true);
        expect(hasNodeB).toBe(true);
        expect(hasTokenC).toBe(true);
    });
});

describe("forked container & override", () => {
    let containerA: Container;
    let executionContext: IExecutionContext;
    beforeEach(() => {
        const executionContext_ = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        containerA = new Container({ executionContext: executionContext_ });
        executionContext = executionContext_;
    });

    test("fork copies all override nodes from the original", async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeAOverride1 = dependency({})
            .factory(() => "A overridden first")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA);
        containerA.overrideFactory(nodeAOverride1);

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        const resolvedContainerA = await containerA.resolve(nodeA.token);
        const resolvedContainerB = await containerB.resolve(nodeA.token);

        const correctA = await callInvocable(
            nodeAOverride1.factory,
            {},
            executionContext,
        );

        expect(resolvedContainerA).toBe(correctA);
        expect(resolvedContainerB).toBe(correctA);
    });

    test("overriding a node in a fork does not affect the original container", async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeAOverride = dependency({})
            .factory(() => "A overridden second")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA);
        const containerB = containerA.fork();
        containerB.overrideFactory(nodeAOverride);

        await containerA.init();
        await containerB.init();

        const correctContainerB = await callInvocable(
            nodeAOverride.factory,
            {},
            executionContext,
        );
        const resolvedContainerB = await containerB.resolve(nodeA.token);
        expect(resolvedContainerB).toBe(correctContainerB);
    });

    test("overriding a node in the original does not affect the forked container", async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        const nodeAOverride = dependency({})
            .factory(() => "A overridden second")
            .lifeTime(LIFETIME.SINGLETON)
            .reuseToken(nodeA.token);

        containerA.registerFactory(nodeA);
        const containerB = containerA.fork();
        containerA.overrideFactory(nodeAOverride);

        await containerA.init();
        await containerB.init();

        const correctContainerA = await callInvocable(
            nodeAOverride.factory,
            {},
            executionContext,
        );
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

    test(`${Container.prototype.deInit.name} of fork does not ${Container.prototype.deInit.name} the original container`, async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        containerA.registerFactory(nodeA);

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        await containerB.deInit();

        await expect(containerA.resolve(nodeA.token)).resolves.toBe("A");
        const promise = containerB.resolve(nodeA.token);
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.NOT_ACTIVE,
        );
    });

    test(`${Container.prototype.deInit.name} of original does not ${Container.prototype.deInit.name} the fork`, async () => {
        const nodeA = dependency({})
            .factory(() => "A")
            .lifeTime(LIFETIME.SINGLETON)
            .createToken("A");

        containerA.registerFactory(nodeA);

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        await containerA.deInit();

        await expect(containerB.resolve(nodeA.token)).resolves.toBe("A");
        const promise = containerA.resolve(nodeA.token);
        await expect(promise).rejects.toThrow(InvalidMethodCallDiError);
        await expect(promise).rejects.toHaveProperty(
            "flag",
            InvalidMethodCallDiError.FLAG.NOT_ACTIVE,
        );
    });

    test(`fork inherits ${Container.prototype.init.name} and ${Container.prototype.deInit.name} hooks from the original`, async () => {
        const inheritedInitSpy = vi.fn();
        const inheritedDeInitSpy = vi.fn();

        containerA.onContainerInit(inheritedInitSpy);
        containerA.onContainerDeInit(inheritedDeInitSpy);

        const containerB = containerA.fork();

        await containerA.init();
        await containerB.init();

        // the hook registered before forking runs for both containers
        expect(inheritedInitSpy).toHaveBeenCalledTimes(2);

        await containerA.deInit();
        await containerB.deInit();

        expect(inheritedDeInitSpy).toHaveBeenCalledTimes(2);
    });
});
