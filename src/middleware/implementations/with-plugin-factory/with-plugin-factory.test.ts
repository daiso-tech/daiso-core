import { afterEach, describe, expect, test, vi } from "vitest";

import {
    type Enhance,
    type MiddlewareFn,
    type NextFn,
    type PluginFn,
    type Use,
} from "@/middleware/contracts/_module.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/with-plugin-factory.js";

describe("function: withPluginFactory", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should call underlying Enhance when applying plugin on a object literal method", () => {
        const enhance = vi.fn() as Enhance;
        const withPlugin = withPluginFactory(enhance);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<typeof objectLiteral> = (
            instance,
            enhanceFn,
        ) => {
            enhanceFn(instance, "methodA", middlewareA);
        };

        withPlugin(objectLiteral, plugin);

        expect(enhance).toHaveBeenCalledOnce();
    });
    test("Should call underlying Use when applying plugin on a object literal method", () => {
        const use = vi.fn(useFactory()) as Use;
        const enhance = enhanceFactory(use);
        const withPlugin = withPluginFactory(enhance);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<typeof objectLiteral> = (
            instance,
            enhanceFn,
        ) => {
            enhanceFn(instance, "methodA", middlewareA);
        };

        const enhancedInstance = withPlugin(objectLiteral, plugin);

        const value = "value";
        enhancedInstance.methodA(value);

        expect(use).toHaveBeenCalledOnce();
    });
    test("Should call underlying middleware with correct args when enhanced object literal method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const withPlugin = withPluginFactory(enhance);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<typeof objectLiteral> = (
            instance,
            enhanceFn,
        ) => {
            enhanceFn(instance, "methodA", middlewareA);
        };

        const methodName = objectLiteral.methodA.name;
        const enhancedInstance = withPlugin(objectLiteral, plugin);

        const value = "value";
        enhancedInstance.methodA(value);

        expect(middlewareA).toHaveBeenCalledOnce();
        expect(middlewareA).toHaveBeenCalledWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
            name: methodName,
        });
    });
    test("Should call underlying Enhance when applying plugin on a class instance method", () => {
        const enhance = vi.fn() as Enhance;
        const withPlugin = withPluginFactory(enhance);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<Test> = (inst, enhanceFn) => {
            enhanceFn(inst, "methodA", middlewareA);
        };

        withPlugin(instance, plugin);

        expect(enhance).toHaveBeenCalledOnce();
    });
    test("Should call underlying Use when applying plugin on a class instance method", () => {
        const use = vi.fn(useFactory()) as Use;
        const enhance = enhanceFactory(use);
        const withPlugin = withPluginFactory(enhance);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<Test> = (inst, enhanceFn) => {
            enhanceFn(inst, "methodA", middlewareA);
        };

        const enhancedInstance = withPlugin(instance, plugin);

        const value = "value";
        enhancedInstance.methodA(value);

        expect(use).toHaveBeenCalledOnce();
    });
    test("Should call underlying middleware with correct args when enhanced class instance method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const withPlugin = withPluginFactory(enhance);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();
        const methodName = instance.methodA.name;

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        const plugin: PluginFn<Test> = (inst, enhanceFn) => {
            enhanceFn(inst, "methodA", middlewareA);
        };

        const enhancedInstance = withPlugin(instance, plugin);

        const value = "value";
        enhancedInstance.methodA(value);

        expect(middlewareA).toHaveBeenCalledOnce();
        expect(middlewareA).toHaveBeenCalledWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
            name: methodName,
        });
    });
    test("Should return false for referential equality for object literals", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const plugin = withPluginFactory(enhance);

        const obj = { a: 1, b: "hello", c: true };

        const copiedObj = plugin(obj, []);

        expect(copiedObj).not.toBe(obj);
    });
    test("Should copy the object literal", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const plugin = withPluginFactory(enhance);

        const obj = { a: 1, b: "hello", c: true };
        const copiedObj = plugin(obj, []);

        expect(copiedObj).toEqual(obj);
    });
    test("Should return false for referential equality for class instances", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const plugin = withPluginFactory(enhance);

        class Person {
            constructor(
                public name: string,
                public age: number,
            ) {}

            getGreeting(): string {
                return `Hi, I'm ${this.name} and I'm ${String(this.age)} years old.`;
            }
        }

        const instance = new Person("Alice", 30);
        const copiedInstance = plugin(instance, []);

        expect(copiedInstance).not.toBe(instance);
        expect(copiedInstance.getGreeting()).toBe(
            "Hi, I'm Alice and I'm 30 years old.",
        );
    });
    test("Should keep prototype intact when called on class instances by checking instanceof", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const plugin = withPluginFactory(enhance);

        class Animal {
            constructor(public species: string) {}

            getDescription(): string {
                return `A ${this.species}`;
            }

            getSound(): string {
                switch (this.species) {
                    case "dog":
                        return "bark";
                    case "cat":
                        return "meow";
                    default:
                        return "unknown";
                }
            }
        }

        const instance = new Animal("dog");
        const copiedInstance = plugin(instance, []);

        expect(copiedInstance).toBeInstanceOf(Animal);
        expect(copiedInstance.getDescription()).toBe("A dog");
        expect(copiedInstance.getSound()).toBe("bark");
    });
    test("Should copy the class instance", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const plugin = withPluginFactory(enhance);

        class Person {
            constructor(
                public name: string,
                public age: number,
            ) {}

            getName(): string {
                return this.name;
            }

            getAge(): number {
                return this.age;
            }

            getGreeting(): string {
                return `Hi, I'm ${this.getName()} and I'm ${String(this.getAge())} years old.`;
            }
        }

        const instance = new Person("Alice", 30);
        const copiedInstance = plugin(instance, []);

        expect(copiedInstance).toEqual(instance);
        expect(copiedInstance.getName()).toBe(instance.getName());
        expect(copiedInstance.getAge()).toBe(instance.getAge());
        expect(copiedInstance.getGreeting()).toBe(instance.getGreeting());
    });
    test("Should call plugins in reverse order when provided as an array", () => {
        const enhance = vi.fn() as Enhance;
        const withPlugin = withPluginFactory(enhance);

        const obj = {
            method(_value: string): void {},
        };

        const callOrder: Array<number> = [];

        const pluginA: PluginFn<typeof obj> = () => {
            callOrder.push(1);
        };
        const pluginB: PluginFn<typeof obj> = () => {
            callOrder.push(2);
        };
        const pluginC: PluginFn<typeof obj> = () => {
            callOrder.push(3);
        };

        withPlugin(obj, [pluginA, pluginB, pluginC]);

        expect(callOrder).toEqual([3, 2, 1]);
    });
    test("Should execute middleware from first plugin outermost when multiple plugins enhance the same method", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);
        const withPlugin = withPluginFactory(enhance);

        const obj = {
            method(_value: string): string {
                return "original";
            },
        };

        const executionOrder: Array<string> = [];

        const pluginA: PluginFn<typeof obj> = (instance, enhanceFn) => {
            enhanceFn(instance, "method", ({ args, next }) => {
                executionOrder.push("middlewareA before");
                const result = next(args);
                executionOrder.push("middlewareA after");
                return result;
            });
        };

        const pluginB: PluginFn<typeof obj> = (instance, enhanceFn) => {
            enhanceFn(instance, "method", ({ args, next }) => {
                executionOrder.push("middlewareB before");
                const result = next(args);
                executionOrder.push("middlewareB after");
                return result;
            });
        };

        const enhanced = withPlugin(obj, [pluginA, pluginB]);
        enhanced.method("test");

        expect(executionOrder).toEqual([
            "middlewareA before",
            "middlewareB before",
            "middlewareB after",
            "middlewareA after",
        ]);
    });
    test("Should call a single plugin when provided directly (not wrapped in an array)", () => {
        const enhance = vi.fn() as Enhance;
        const withPlugin = withPluginFactory(enhance);

        const obj = {
            method(_value: string): void {},
        };

        const plugin = vi.fn<PluginFn<typeof obj>>();

        withPlugin(obj, plugin);

        expect(plugin).toHaveBeenCalledOnce();
        expect(plugin).toHaveBeenCalledWith(obj, enhance);
    });
});
