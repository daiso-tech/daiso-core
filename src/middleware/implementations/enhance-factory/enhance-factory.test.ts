import { afterEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";

import type {
    MiddlewareFn,
    NextFn,
    Use,
} from "@/middleware/contracts/_module.js";

describe("function: enhanceFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call underlying Use when enhancing a object literal method", () => {
        const use = vi.fn(useFactory()) as Use;
        const enhance = enhanceFactory(use);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(objectLiteral, "methodA", middlewareA);

        const value = "value";
        objectLiteral.methodA(value);

        expect(use).toHaveBeenCalledOnce();
    });
    test("Should call underlying middleware with correct args when enhanced object literal method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };
        const methodName = objectLiteral.methodA.name;

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(objectLiteral, "methodA", middlewareA);

        const value = "value";
        objectLiteral.methodA(value);

        expect(middlewareA).toHaveBeenCalledExactlyOnceWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
            name: methodName,
        });
    });
    test("Should not call underlying middleware when non-enhanced object literal method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);

        const objectLiteral = {
            methodA(_value: string): void {},
            methodB(_value: string): void {},
        };

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(objectLiteral, "methodA", middlewareA);

        const value = "value";
        objectLiteral.methodB(value);

        expect(middlewareA).not.toHaveBeenCalled();
    });
    test("Should call underlying Use when enhancing a class instance method", () => {
        const use = vi.fn(useFactory()) as Use;
        const enhance = enhanceFactory(use);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(instance, "methodA", middlewareA);

        const value = "value";
        instance.methodA(value);

        expect(use).toHaveBeenCalledOnce();
    });
    test("Should call underlying middleware with correct args when enhanced class instance method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();
        const methodName = instance.methodA.name;

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(instance, "methodA", middlewareA);

        const value = "value";
        instance.methodA(value);

        expect(middlewareA).toHaveBeenCalledExactlyOnceWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
            name: methodName,
        });
    });
    test("Should not call underlying middleware when non-enhanced class instance method is invoked", () => {
        const use = useFactory();
        const enhance = enhanceFactory(use);

        class Test {
            methodA(_value: string): void {}
            methodB(_value: string): void {}
        }
        const instance = new Test();

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(instance, "methodA", middlewareA);

        const value = "value";
        instance.methodB(value);

        expect(middlewareA).not.toHaveBeenCalled();
    });

    test("Should execute middlewares in last-in-first-out order when enhancing the same method multiple times", () => {
        const enhance = enhanceFactory(useFactory());
        const obj = {
            method(_value: string): string {
                return "original";
            },
        };

        const executionOrder: Array<string> = [];

        enhance(obj, "method", ({ args, next }) => {
            executionOrder.push("first before");
            const result = next(args);
            executionOrder.push("first after");
            return result;
        });

        enhance(obj, "method", ({ args, next }) => {
            executionOrder.push("second before");
            const result = next(args);
            executionOrder.push("second after");
            return result;
        });

        obj.method("test");

        expect(executionOrder).toEqual([
            "second before",
            "first before",
            "first after",
            "second after",
        ]);
    });
});
