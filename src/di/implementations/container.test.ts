/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable @typescript-eslint/no-extraneous-class */
import { describe, test, expect, beforeEach, vi } from "vitest";

import {
    genericToken,
    type IServiceRegister,
    type IServiceProvider,
} from "@/di/contracts/_module.js";
import { Container } from "@/di/implementations/container.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/execution-context/execution-context.js";

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

class OrderService {
    constructor(private readonly db: IDatabase) {}
    async getOrders(): Promise<unknown> {
        return this.db.query("SELECT * FROM orders");
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

function createContainer(): Container {
    return new Container({
        executionContext: createExecutionContext(),
    });
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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should register a factory and return an IServiceLifetime", () => {
            const lifetime = container.registerFactory({
                token: ILOGGER,
                factory: () => ({ log: () => {} }),
                deps: [],
            });
            expect(lifetime).toBeDefined();
            expect(typeof lifetime.singleton).toBe("function");
            expect(typeof lifetime.scoped).toBe("function");
            expect(typeof lifetime.transient).toBe("function");
        });

        test("Should register a factory with dependencies", () => {
            expect(() => {
                container.registerValue({
                    token: IDATABASE,
                    value: { query: () => Promise.resolve([]) },
                });

                container
                    .registerFactory({
                        token: IUSER_SERVICE,
                        factory: (db) => ({
                            getUser: async () => {
                                await db.query("");
                                return { name: "Test" };
                            },
                        }),
                        deps: [IDATABASE],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should support singleton lifetime", () => {
            expect(() => {
                container
                    .registerFactory({
                        token: ILOGGER,
                        factory: () => new ConsoleLogger(),
                        deps: [],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should support scoped lifetime", () => {
            expect(() => {
                container
                    .registerFactory({
                        token: ILOGGER,
                        factory: () => new ConsoleLogger(),
                        deps: [],
                    })
                    .scoped();
            }).not.toThrow();
        });

        test("Should support transient lifetime", () => {
            expect(() => {
                container
                    .registerFactory({
                        token: ILOGGER,
                        factory: () => new ConsoleLogger(),
                        deps: [],
                    })
                    .transient();
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerClass
    // -----------------------------------------------------------------------
    describe("method: registerClass", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should register a class and return an IServiceLifetime", () => {
            const lifetime = container.registerClass({
                impl: ConsoleLogger,
                deps: [],
            });
            expect(lifetime).toBeDefined();
            expect(typeof lifetime.singleton).toBe("function");
            expect(typeof lifetime.scoped).toBe("function");
            expect(typeof lifetime.transient).toBe("function");
        });

        test("Should register a class with dependencies", () => {
            expect(() => {
                container
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: UserService,
                        deps: [Database],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should register a class with class token (impl serves as token)", () => {
            expect(() => {
                container
                    .registerClass({
                        impl: ConsoleLogger,
                        deps: [],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should register a class with class token and dependencies using generic tokens", () => {
            expect(() => {
                container
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: UserController,
                        deps: [IUSER_SERVICE, ConsoleLogger],
                    })
                    .transient();
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerValue
    // -----------------------------------------------------------------------
    describe("method: registerValue", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should register a dynamic token", () => {
            expect(() => {
                container.registerDynamic(REQUEST_ID);
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerContext
    // -----------------------------------------------------------------------
    describe("method: registerContext", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should register a contextual binding", () => {
            expect(() => {
                container
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: MockDatabase,
                        deps: [],
                    })
                    .singleton();

                container.registerContext({
                    when: UserService,
                    needs: IDATABASE,
                    give: Database,
                });
            }).not.toThrow();
        });

        test("Should allow different implementations for different consumers", () => {
            expect(() => {
                container
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: MockDatabase,
                        deps: [],
                    })
                    .singleton();

                container.registerContext({
                    when: UserService,
                    needs: IDATABASE,
                    give: Database,
                });

                container.registerContext({
                    when: OrderService,
                    needs: IDATABASE,
                    give: MockDatabase,
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // registerProvider
    // -----------------------------------------------------------------------
    describe("method: registerProvider", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should register a service provider as a plain function", () => {
            expect(() => {
                function loggingProvider(register: IServiceRegister): void {
                    register
                        .registerClass({
                            impl: ConsoleLogger,
                            deps: [],
                        })
                        .singleton();
                }

                container.registerProvider(loggingProvider);
            }).not.toThrow();
        });

        test("Should register a service provider as an object with invoke method", () => {
            expect(() => {
                class DatabaseProvider implements IServiceProvider {
                    invoke(register: IServiceRegister): void {
                        register
                            .registerClass({
                                impl: Database,
                                deps: [],
                            })
                            .singleton();
                    }
                }

                container.registerProvider(new DatabaseProvider());
            }).not.toThrow();
        });

        test("Should register multiple services from a single provider", () => {
            expect(() => {
                function appProvider(register: IServiceRegister): void {
                    register
                        .registerClass({
                            impl: ConsoleLogger,
                            deps: [],
                        })
                        .singleton();

                    register
                        .registerClass({
                            impl: Database,
                            deps: [],
                        })
                        .singleton();

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

        test("Should allow provider registrations to be used for resolution", () => {
            expect(() => {
                function appProvider(register: IServiceRegister): void {
                    register
                        .registerClass({
                            impl: ConsoleLogger,
                            deps: [],
                        })
                        .singleton();
                }

                container.registerProvider(appProvider);
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // resolve
    // -----------------------------------------------------------------------
    describe("method: resolve", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should return null when token is not registered", async () => {
            const result = await container.resolve(ILOGGER);
            expect(result).toBeNull();
        });

        test("Should return the service when token is registered (value)", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should return default value when token is not registered", async () => {
            const defaultValue: IConfig = { apiUrl: "default", timeout: 1000 };
            const result = await container.resolveOr(ICONFIG, defaultValue);
            expect(result).toBe(defaultValue);
        });

        test("Should return registered value when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should return the service when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should return false when token is not registered", async () => {
            const result = await container.has(ILOGGER);
            expect(result).toBe(false);
        });

        test("Should return true when token is registered", async () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            const result = await container.has(ICONFIG);
            expect(result).toBe(true);
        });

        test("Should return true for a dynamic token that has been registered", async () => {
            container.registerDynamic(REQUEST_ID);

            const result = await container.has(REQUEST_ID);
            expect(result).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // method: run (scoped execution)
    // -----------------------------------------------------------------------
    describe("method: run", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should execute a scope callback within an isolated scope", async () => {
            const scopeFn = vi.fn();

            await container.run({
                scope: scopeFn,
            });

            expect(scopeFn).toHaveBeenCalledOnce();
        });

        test("Should set dynamic values before scope execution", async () => {
            container.registerDynamic(REQUEST_ID);

            let capturedRequestId: string | undefined;

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

            await container.run({
                dynamicRegistration: async (register) => {
                    await register.set({
                        token: REQUEST_ID,
                        value: (_executionContext) => "req-from-callback",
                    });
                },
                scope: async () => {
                    capturedRequestId =
                        await container.resolveOrFail(REQUEST_ID);
                },
            });

            expect(capturedRequestId).toBe("req-from-callback");
        });

        test("Should share scoped services within the same run() call", async () => {
            container
                .registerClass({
                    impl: ScopedService,
                    deps: [],
                })
                .scoped();

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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should override an existing factory registration", () => {
            container
                .registerFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: [],
                })
                .singleton();

            expect(() => {
                container.overrideFactory({
                    token: ILOGGER,
                    factory: () => new FileLogger(),
                    deps: [],
                });
            }).not.toThrow();
        });

        test("Should override with different dependencies", () => {
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "old", timeout: 1000 },
            });

            container
                .registerFactory({
                    token: ILOGGER,
                    factory: () => new ConsoleLogger(),
                    deps: [],
                })
                .singleton();

            expect(() => {
                container.overrideFactory({
                    token: ILOGGER,
                    factory: (_config) => new ConsoleLogger(),
                    deps: [ICONFIG],
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // overrideClass
    // -----------------------------------------------------------------------
    describe("method: overrideClass", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should override an existing class registration", () => {
            container
                .registerClass({
                    impl: ConsoleLogger,
                    deps: [],
                })
                .singleton();

            expect(() => {
                container.overrideClass({
                    impl: FileLogger,
                    deps: [],
                });
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // overrideValue
    // -----------------------------------------------------------------------
    describe("method: overrideValue", () => {
        let container: Container;

        beforeEach(() => {
            container = createContainer();
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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
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
        let container: Container;

        beforeEach(() => {
            container = createContainer();
        });

        test("Should initialize without error when no hooks are registered", async () => {
            await expect(container.init()).resolves.toBeUndefined();
        });

        test("Should deinitialize without error when no hooks are registered", async () => {
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
    // method: fork
    // -----------------------------------------------------------------------
    describe("method: fork", () => {
        let parentContainer: Container;

        beforeEach(() => {
            parentContainer = createContainer();
        });

        test("Should create a child container that inherits parent registrations", () => {
            const child = parentContainer.fork();
            expect(child).toBeDefined();
        });

        test("Should inherit value registrations from parent", async () => {
            parentContainer.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            const child = parentContainer.fork();
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

            const parentConfig = await parentContainer.resolveOrFail(ICONFIG);
            const childConfig = await child.resolveOrFail(ICONFIG);

            expect(parentConfig.apiUrl).toBe("https://parent.example.com");
            expect(childConfig.apiUrl).toBe("https://child.example.com");
        });

        test("Should be useful for testing by forking and overriding only needed services", async () => {
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
            const parentConfig = await parentContainer.resolveOrFail(ICONFIG);
            expect(parentConfig.apiUrl).toBe("https://real.example.com");

            // Verify child has overridden config
            const childConfig = await testContainer.resolveOrFail(ICONFIG);
            expect(childConfig.apiUrl).toBe("https://test.example.com");
        });
    });

    // -----------------------------------------------------------------------
    // feature: edge cases
    // -----------------------------------------------------------------------
    describe("feature: edge cases", () => {
        test("Should handle registration with empty deps array", () => {
            const container = createContainer();

            expect(() => {
                container
                    .registerClass({
                        impl: ConsoleLogger,
                        deps: [],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should handle registration with nested dependencies", () => {
            const container = createContainer();

            expect(() => {
                container
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: UserService,
                        deps: [Database],
                    })
                    .singleton();

                container
                    .registerClass({
                        impl: UserController,
                        deps: [UserService, ConsoleLogger],
                    })
                    .transient();
            }).not.toThrow();
        });

        test("Should handle multiple unique tokens independently", async () => {
            const container = createContainer();
            const TOKEN_A = genericToken<string>("A");
            const TOKEN_B = genericToken<string>("B");

            container.registerValue({ token: TOKEN_A, value: "value-a" });
            container.registerValue({ token: TOKEN_B, value: "value-b" });

            const a = await container.resolveOrFail(TOKEN_A);
            const b = await container.resolveOrFail(TOKEN_B);

            expect(a).toBe("value-a");
            expect(b).toBe("value-b");
        });

        test("Should handle class token resolution with registered class", async () => {
            const container = createContainer();

            container
                .registerClass({
                    impl: ConsoleLogger,
                    deps: [],
                })
                .singleton();

            const logger = await container.resolveOrFail(ConsoleLogger);
            expect(logger).toBeInstanceOf(ConsoleLogger);
        });

        test("Should handle factory returning async values", async () => {
            const container = createContainer();

            container
                .registerFactory({
                    token: ILOGGER,
                    factory: async () => {
                        await Promise.resolve();
                        return new ConsoleLogger();
                    },
                    deps: [],
                })
                .singleton();

            const logger = await container.resolveOrFail(ILOGGER);
            expect(logger).toBeDefined();
            expect(typeof logger.log).toBe("function");
        });

        test("Should handle factory with execution context parameter", () => {
            const container = createContainer();

            expect(() => {
                container
                    .registerFactory({
                        token: ILOGGER,
                        factory: (_executionContext: IExecutionContext) => {
                            return new ConsoleLogger();
                        },
                        deps: [],
                    })
                    .singleton();
            }).not.toThrow();
        });

        test("Should allow using class token in registerFactory via token field", () => {
            const container = createContainer();

            expect(() => {
                container
                    .registerFactory({
                        token: ConsoleLogger,
                        factory: () => new ConsoleLogger(),
                        deps: [],
                    })
                    .singleton();
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // feature: full integration scenarios
    // -----------------------------------------------------------------------
    describe("feature: full integration scenarios", () => {
        test("Should support a complete DI workflow: register → resolve → scope", async () => {
            const container = createContainer();

            // Register configuration
            container.registerValue({
                token: ICONFIG,
                value: { apiUrl: "https://api.example.com", timeout: 5000 },
            });

            // Register database
            container
                .registerClass({
                    impl: Database,
                    deps: [],
                })
                .singleton();

            // Register user service (depends on DB)
            container
                .registerFactory({
                    token: IUSER_SERVICE,
                    factory: (db) => ({
                        getUser: async (id: string) => {
                            await db.query(
                                `SELECT * FROM users WHERE id = ${id}`,
                            );
                            return { name: "John Doe" };
                        },
                    }),
                    deps: [Database],
                })
                .scoped();

            // Register logger
            container
                .registerClass({
                    impl: ConsoleLogger,
                    deps: [],
                })
                .singleton();

            // Register dynamic request ID
            container.registerDynamic(REQUEST_ID);

            // Execute within a scope (simulating a request)
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
            const appContainer = createContainer();

            // Register real services
            appContainer
                .registerClass({
                    impl: Database,
                    deps: [],
                })
                .singleton();

            appContainer
                .registerClass({
                    impl: UserService,
                    deps: [Database],
                })
                .singleton();

            // Create test container
            const testContainer = appContainer.fork();

            // Override only the database with a mock
            testContainer.overrideClass({
                impl: MockDatabase,
                deps: [],
            });

            // Resolve from test container — should get UserService with MockDatabase
            const userService = await testContainer.resolveOrFail(UserService);
            expect(userService).toBeInstanceOf(UserService);

            // Parent container still has real Database
            const parentDb = await appContainer.resolveOrFail(Database);
            expect(parentDb).toBeInstanceOf(Database);
        });

        test("Should support service providers for batch registration", async () => {
            const container = createContainer();

            function appProvider(register: IServiceRegister): void {
                register
                    .registerClass({
                        impl: ConsoleLogger,
                        deps: [],
                    })
                    .singleton();

                register
                    .registerClass({
                        impl: Database,
                        deps: [],
                    })
                    .singleton();

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
