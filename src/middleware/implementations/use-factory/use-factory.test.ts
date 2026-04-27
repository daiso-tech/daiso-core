import { describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/execution-context.contract.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/use-factory.js";

describe("function: useFactory", () => {
    test("should call middleware before next function", () => {
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

    test("should call middleware after next function", () => {
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

    test("should allow middleware to return early without calling next", () => {
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

    test("should execute middlewares in priority order (lower first)", () => {
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

    test("should use defaultPriority for middlewares without explicit priority", () => {
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

    test("should provide execution context to middleware when using AlsExecutionContextAdapter", () => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const token = contextToken<number>("value");
        const use = useFactory({ executionContext });
        const fn = use(
            () => {
                return executionContext.get(token);
            },
            ({ args, next, context }) => {
                context.put(token, 99);
                return next(args);
            },
        );
        const result = fn();
        expect(result).toBe(99);
    });

    test("should isolate execution context between calls when using AlsExecutionContextAdapter", () => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const token = contextToken<number>("counter");
        const use = useFactory({ executionContext });
        const fn = use(
            () => {
                return executionContext.get(token);
            },
            ({ args, next, context }) => {
                context.put(token, (context.get(token) ?? 0) + 1);
                return next(args);
            },
        );
        const result1 = fn();
        const result2 = fn();
        expect(result1).toBe(1);
        expect(result2).toBe(1);
        expect(executionContext.get(token)).toBeNull();
    });
});
