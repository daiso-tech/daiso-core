import { describe, expect, test, vi } from "vitest";

import {
    type MiddlewareArgs,
    type MiddlewareFn,
    type NextFn,
} from "@/middleware/contracts/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/use-factory.js";

describe("function: useFactory", () => {
    test("Should call middleware before next function", () => {
        const order: Array<string> = [];
        const use = useFactory();
        const fn = use(
            (a: number, b: number) => {
                order.push("fn");
                return a + b;
            },
            ({ args, next }) => {
                order.push("before");
                return next(args);
            },
        );
        const result = fn(1, 2);
        expect(result).toBe(3);
        expect(order).toEqual(["before", "fn"]);
    });
    test("Should call middleware after next function", () => {
        const order: Array<string> = [];
        const use = useFactory();
        const fn = use(
            (a: number, b: number) => {
                order.push("fn");
                return a + b;
            },
            ({ args, next }) => {
                const result = next(args);
                order.push("after");
                return result;
            },
        );
        const result = fn(1, 2);
        expect(result).toBe(3);
        expect(order).toEqual(["fn", "after"]);
    });
    test("Should allow middleware to return early without calling next", () => {
        const order: Array<string> = [];
        const use = useFactory();
        const fn = use(
            (_a: number, _b: number) => {
                order.push("fn");
                return 0;
            },
            ({ args: _args }) => {
                order.push("middleware");
                return 42;
            },
        );
        const result = fn(1, 2);
        expect(result).toBe(42);
        expect(order).toEqual(["middleware"]);
    });
    test("Should execute middlewares in priority order (lower first)", () => {
        const order: Array<string> = [];
        const use = useFactory();
        const fn = use(() => {
            order.push("fn");
            return "done";
        }, [
            {
                priority: 20,
                invoke({ args, next }) {
                    order.push("priority-20");
                    return next(args);
                },
            },
            {
                priority: 0,
                invoke({ args, next }) {
                    order.push("priority-0");
                    return next(args);
                },
            },
            {
                priority: 10,
                invoke({ args, next }) {
                    order.push("priority-10");
                    return next(args);
                },
            },
        ]);
        fn();
        expect(order).toEqual([
            "priority-0",
            "priority-10",
            "priority-20",
            "fn",
        ]);
    });
    test("Should use defaultPriority for middlewares without explicit priority", () => {
        const order: Array<string> = [];
        const use = useFactory({ defaultPriority: 15 });
        const fnMiddleware: MiddlewareFn<[], string> = ({ args, next }) => {
            order.push("fn-middleware");
            return next(args);
        };
        const fn = use(() => {
            order.push("fn");
            return "done";
        }, [
            fnMiddleware,
            {
                priority: 10,
                invoke({ args, next }) {
                    order.push("priority-10");
                    return next(args);
                },
            },
        ]);
        fn();
        expect(order).toEqual(["priority-10", "fn-middleware", "fn"]);
    });
    describe("MiddlewareArgs passed to middleware handlers", () => {
        test("Should pass correct args to middleware", () => {
            const use = useFactory();
            const middleware = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const fn = use((a: number, b: number) => a + b, middleware);
            expect(fn(3, 4)).toBe(7);
            expect(middleware).toHaveBeenCalledTimes(1);
            expect(middleware).toHaveBeenCalledWith(
                expect.objectContaining({ args: [3, 4] }),
            );
        });
        test("Should pass next function that executes the wrapped function", () => {
            const use = useFactory();
            const middleware = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const wrappedFn = vi.fn((a: number, b: number) => a * b);
            const fn = use(wrappedFn, middleware);
            expect(fn(4, 5)).toBe(20);
            expect(wrappedFn).toHaveBeenCalledWith(4, 5);
        });
        test("Should pass next function that propagates modified arguments", () => {
            const use = useFactory();
            const wrappedFn = vi.fn((a: number, b: number) => a + b);
            const fn = use(
                wrappedFn,
                ({ next }: MiddlewareArgs<[number, number], number>) =>
                    next([10, 20]),
            );
            expect(fn(1, 2)).toBe(30);
            expect(wrappedFn).toHaveBeenCalledWith(10, 20);
        });
        test("Should pass next function that defaults to original args when called without arguments", () => {
            const use = useFactory();
            const wrappedFn = vi.fn((a: string, b: string) => `${a} ${b}`);
            const fn = use(
                wrappedFn,
                (_args: MiddlewareArgs<[string, string], string>) =>
                    _args.next(),
            );
            expect(fn("hello", "world")).toBe("hello world");
            expect(wrappedFn).toHaveBeenCalledWith("hello", "world");
        });
        test("Should pass the function name for a named function", () => {
            const use = useFactory();
            function add(a: number, b: number): number {
                return a + b;
            }
            const middleware = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const fn = use(add, middleware);
            fn(1, 2);
            expect(middleware).toHaveBeenCalledWith(
                expect.objectContaining({ name: "add" }),
            );
        });
        test("Should pass an empty string name for an anonymous arrow function", () => {
            const use = useFactory();
            const middleware = vi.fn(
                ({ args, next }: MiddlewareArgs<[number], number>) =>
                    next(args),
            );
            const fn = use((x: number) => x * 2, middleware);
            fn(5);
            expect(middleware).toHaveBeenCalledWith(
                expect.objectContaining({ name: "" }),
            );
        });
        test("Should pass the correct name through multiple middlewares in priority order", () => {
            const use = useFactory();
            function multiply(a: number, b: number): number {
                return a * b;
            }
            const middleware1 = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const middleware2 = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const fn = use(multiply, [
                { priority: 10, invoke: middleware1 },
                { priority: 0, invoke: middleware2 },
            ]);
            fn(6, 7);
            expect(middleware1).toHaveBeenCalledWith(
                expect.objectContaining({ name: "multiply" }),
            );
            expect(middleware2).toHaveBeenCalledWith(
                expect.objectContaining({ name: "multiply" }),
            );
        });
        test("Should pass all MiddlewareArgs properties simultaneously", () => {
            const use = useFactory();
            function compute(a: number, b: number): number {
                return a - b;
            }
            const middleware = vi.fn(
                ({ args, next }: MiddlewareArgs<[number, number], number>) =>
                    next(args),
            );
            const fn = use(compute, middleware);
            expect(fn(10, 3)).toBe(7);
            expect(middleware).toHaveBeenCalledWith({
                args: [10, 3],
                next: expect.any(Function) as NextFn,
                name: "compute",
            });
        });
    });
});
