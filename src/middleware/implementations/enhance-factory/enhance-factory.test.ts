import { afterEach, describe, expect, test, vi } from "vitest";

import {
    type MiddlewareFn,
    type NextFn,
    type Use,
} from "@/middleware/contracts/_module.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";

describe("function: enhanceFactory", () => {
    afterEach(() => {
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

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(objectLiteral, "methodA", middlewareA);

        const value = "value";
        objectLiteral.methodA(value);

        expect(middlewareA).toHaveBeenCalledOnce();
        expect(middlewareA).toHaveBeenCalledWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
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

        expect(middlewareA).not.toBeCalled();
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

        const middlewareA = vi.fn<MiddlewareFn<[value: string], void>>();

        enhance(instance, "methodA", middlewareA);

        const value = "value";
        instance.methodA(value);

        expect(middlewareA).toHaveBeenCalledOnce();
        expect(middlewareA).toHaveBeenCalledWith({
            args: [value],
            next: expect.any(Function) as NextFn<[value: string]>,
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

        expect(middlewareA).not.toBeCalled();
    });
});
