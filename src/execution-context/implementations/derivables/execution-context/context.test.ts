import { describe, expect, test, beforeEach } from "vitest";

import { contextToken } from "@/execution-context/contracts/execution-context.contract.js";
import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";

describe("class: Context", () => {
    let context: Context;

    beforeEach(() => {
        context = new Context(new Map());
    });

    describe("method: copy", () => {
        test("Should create a deep copy of the context", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            const copied = context.copy();

            expect(copied.get(token)).toBe("value");
        });

        test("Should not share the same map with the original context", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            const copied = context.copy();
            copied.put(token, "modified");

            expect(context.get(token)).toBe("value");
            expect(copied.get(token)).toBe("modified");
        });

        test("Should create independent copies when modifying arrays", () => {
            const token = contextToken<Array<number>>("numbers");
            context.put(token, [1, 2, 3]);

            const copied = context.copy();
            copied.putPush(token, 4);

            expect(context.get(token)).toEqual([1, 2, 3]);
            expect(copied.get(token)).toEqual([1, 2, 3, 4]);
        });
    });

    describe("method: contains", () => {
        test("Should verify array storage works", () => {
            const token = contextToken<Array<string>>("names");
            context.put(token, ["alice", "bob", "charlie"]);

            const stored = context.get(token);
            expect(stored).not.toBeNull();
            expect(Array.isArray(stored)).toBe(true);
            expect(stored).toEqual(["alice", "bob", "charlie"]);
        });

        test("Should return true when array contains matching value", () => {
            const token = contextToken<Array<string>>("names");
            context.put(token, ["alice", "bob", "charlie"]);

            expect(context.contains(token, "bob")).toBe(true);
        });

        test("Should return false when array does not contain matching value", () => {
            const token = contextToken<Array<string>>("names");
            context.put(token, ["alice", "bob", "charlie"]);

            expect(context.contains(token, "dave")).toBe(false);
        });

        test("Should return false when token does not exist", () => {
            const token = contextToken<Array<string>>("nonexistent");

            expect(context.contains(token, "value")).toBe(false);
        });

        test("Should work with custom predicate function", () => {
            const token = contextToken<Array<number>>("numbers");
            context.put(token, [1, 2, 3, 4, 5]);

            expect(context.contains(token, (n) => n > 3)).toBe(true);
            expect(context.contains(token, (n) => n > 10)).toBe(false);
        });

        test("Should work with different types", () => {
            const token =
                contextToken<Array<{ id: number; name: string }>>("objects");
            context.put(token, [
                { id: 1, name: "first" },
                { id: 2, name: "second" },
            ]);

            expect(context.contains(token, (obj) => obj.id === 2)).toBe(true);
        });
    });

    describe("method: exists", () => {
        test("Should return true when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            expect(context.exists(token)).toBe(true);
        });

        test("Should return false when token does not exist", () => {
            const token = contextToken<string>("nonexistent");

            expect(context.exists(token)).toBe(false);
        });

        test("Should return true even when value is falsy", () => {
            const token = contextToken<boolean>("falsy");
            context.put(token, false);

            expect(context.exists(token)).toBe(true);
        });

        test("Should return true when value is null", () => {
            const token = contextToken<string | null>("nullable");
            context.put(token, null as string | null);

            expect(context.exists(token)).toBe(true);
        });
    });

    describe("method: missing", () => {
        test("Should return true when token does not exist", () => {
            const token = contextToken<string>("nonexistent");

            expect(context.missing(token)).toBe(true);
        });

        test("Should return false when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            expect(context.missing(token)).toBe(false);
        });

        test("Should return false even when value is falsy", () => {
            const token = contextToken<boolean>("falsy");
            context.put(token, false);

            expect(context.missing(token)).toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return the value when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            expect(context.get(token)).toBe("value");
        });

        test("Should return null when token does not exist", () => {
            const token = contextToken<string>("nonexistent");

            expect(context.get(token)).toBeNull();
        });

        test("Should return the actual value when it is falsy", () => {
            const token = contextToken<boolean>("falsy");
            context.put(token, false);

            expect(context.get(token)).toBe(false);
        });

        test("Should return null explicitly set values", () => {
            const token = contextToken<string | null>("nullable");
            context.put(token, null as string | null);

            expect(context.get(token)).toBeNull();
        });
    });

    describe("method: getOr", () => {
        test("Should return the value when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            expect(context.getOr(token, "default")).toBe("value");
        });

        test("Should return the default value when token does not exist", () => {
            const token = contextToken<string>("nonexistent");

            expect(context.getOr(token, "default")).toBe("default");
        });

        test("Should return the value even when it is falsy", () => {
            const token = contextToken<boolean>("falsy");
            context.put(token, false);

            expect(context.getOr(token, true)).toBe(false);
        });

        test("Should support lazy default values", () => {
            const token = contextToken<string>("nonexistent");

            expect(context.getOr(token, () => "lazy")).toBe("lazy");
        });

        test("Should only call lazy default when needed", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            let called = false;
            const result = context.getOr(token, () => {
                called = true;
                return "lazy";
            });

            expect(result).toBe("value");
            expect(called).toBe(false);
        });
    });

    describe("method: getOrFail", () => {
        test("Should return the value when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            expect(context.getOrFail(token)).toBe("value");
        });

        test("Should throw NotFoundExecutionContextError when token does not exist", () => {
            const token = contextToken<string>("nonexistent");

            expect(() => context.getOrFail(token)).toThrow(
                NotFoundExecutionContextError,
            );
        });

        test("Should throw with the correct token id in the error", () => {
            const token = contextToken<string>("myKey");

            expect(() => context.getOrFail(token)).toThrow();
        });
    });

    describe("method: add", () => {
        test("Should add a value when token does not exist", () => {
            const token = contextToken<string>("key");

            context.add(token, "value");

            expect(context.get(token)).toBe("value");
        });

        test("Should not overwrite an existing value", () => {
            const token = contextToken<string>("key");
            context.put(token, "existing");

            context.add(token, "new");

            expect(context.get(token)).toBe("existing");
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<string>("key");

            const result = context.add(token, "value");

            expect(result).toBe(context);
        });

        test("Should work with various types", () => {
            const stringToken = contextToken<string>("string");
            const numberToken = contextToken<number>("number");
            const arrayToken = contextToken<Array<number>>("array");

            context.add(stringToken, "text");
            context.add(numberToken, 42);
            context.add(arrayToken, [1, 2, 3]);

            expect(context.get(stringToken)).toBe("text");
            expect(context.get(numberToken)).toBe(42);
            expect(context.get(arrayToken)).toEqual([1, 2, 3]);
        });
    });

    describe("method: put", () => {
        test("Should set a value when token does not exist", () => {
            const token = contextToken<string>("key");

            context.put(token, "value");

            expect(context.get(token)).toBe("value");
        });

        test("Should overwrite an existing value", () => {
            const token = contextToken<string>("key");
            context.put(token, "existing");

            context.put(token, "new");

            expect(context.get(token)).toBe("new");
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<string>("key");

            const result = context.put(token, "value");

            expect(result).toBe(context);
        });
    });

    describe("method: putIncrement", () => {
        test("Should initialize to initialValue when token does not exist", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token, { initialValue: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should increment by default value when token exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.putIncrement(token);

            expect(context.get(token)).toBe(6);
        });

        test("Should increment by specified nbr value", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.putIncrement(token, { nbr: 3 });

            expect(context.get(token)).toBe(8);
        });

        test("Should not exceed max value", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.putIncrement(token, { max: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should increment to max value when below max", () => {
            const token = contextToken<number>("count");
            context.put(token, 9);

            context.putIncrement(token, { max: 10, nbr: 1 });

            expect(context.get(token)).toBe(10);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<number>("count");

            const result = context.putIncrement(token);

            expect(result).toBe(context);
        });

        test("Should use default initialValue of 0 when not specified", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token);

            expect(context.get(token)).toBe(0);
        });

        test("Should cap initialValue to max when initializing and max is set", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token, { initialValue: 20, max: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should use initialValue when it does not exceed max", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token, { initialValue: 5, max: 10 });

            expect(context.get(token)).toBe(5);
        });

        test("Should cap value to max after incrementing when result exceeds max", () => {
            const token = contextToken<number>("count");
            context.put(token, 9);

            context.putIncrement(token, { nbr: 5, max: 10 });

            expect(context.get(token)).toBe(9);
        });

        test("Should increment with no max constraint", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.putIncrement(token, { nbr: 10 });

            expect(context.get(token)).toBe(15);
        });

        test("Should add initialValue with no max when token does not exist", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token, { initialValue: 5 });

            expect(context.get(token)).toBe(5);
        });

        test("Should cap initialValue exactly to max when equal", () => {
            const token = contextToken<number>("count");

            context.putIncrement(token, { initialValue: 10, max: 10 });

            expect(context.get(token)).toBe(10);
        });
    });

    describe("method: putDecrement", () => {
        test("Should initialize to initialValue when token does not exist", () => {
            const token = contextToken<number>("count");

            context.putDecrement(token, { initialValue: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should decrement by default value when token exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.putDecrement(token);

            expect(context.get(token)).toBe(4);
        });

        test("Should decrement by specified nbr value", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.putDecrement(token, { nbr: 3 });

            expect(context.get(token)).toBe(7);
        });

        test("Should not go below min value", () => {
            const token = contextToken<number>("count");
            context.put(token, 0);

            context.putDecrement(token, { min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should decrement to min value when above min", () => {
            const token = contextToken<number>("count");
            context.put(token, 1);

            context.putDecrement(token, { min: 0, nbr: 1 });

            expect(context.get(token)).toBe(0);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<number>("count");

            const result = context.putDecrement(token);

            expect(result).toBe(context);
        });

        test("Should decrement with no min constraint", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.putDecrement(token, { nbr: 3 });

            expect(context.get(token)).toBe(7);
        });

        test("Should cap initialValue to min when initializing and min is set", () => {
            const token = contextToken<number>("count");

            context.putDecrement(token, { initialValue: -5, min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should use initialValue when it does not go below min", () => {
            const token = contextToken<number>("count");

            context.putDecrement(token, { initialValue: 5, min: 0 });

            expect(context.get(token)).toBe(5);
        });

        test("Should cap value to min after decrementing when result goes below min", () => {
            const token = contextToken<number>("count");
            context.put(token, 2);

            context.putDecrement(token, { nbr: 5, min: 0 });

            expect(context.get(token)).toBe(2);
        });

        test("Should add initialValue with no min when token does not exist", () => {
            const token = contextToken<number>("count");

            context.putDecrement(token, { initialValue: 5 });

            expect(context.get(token)).toBe(5);
        });

        test("Should cap initialValue exactly to min when equal", () => {
            const token = contextToken<number>("count");

            context.putDecrement(token, { initialValue: 0, min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should decrement with no min constraint when value exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.putDecrement(token, { nbr: 15 });

            expect(context.get(token)).toBe(-5);
        });
    });

    describe("method: putPush", () => {
        test("Should create array when token does not exist", () => {
            const token = contextToken<Array<number>>("items");

            context.putPush(token, 1, 2, 3);

            expect(context.get(token)).toEqual([1, 2, 3]);
        });

        test("Should append to existing array", () => {
            const token = contextToken<Array<number>>("items");
            context.put(token, [1, 2]);

            context.putPush(token, 3, 4);

            expect(context.get(token)).toEqual([1, 2, 3, 4]);
        });

        test("Should handle single value", () => {
            const token = contextToken<Array<string>>("items");

            context.putPush(token, "hello");

            expect(context.get(token)).toEqual(["hello"]);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<Array<number>>("items");

            const result = context.putPush(token, 1);

            expect(result).toBe(context);
        });
    });

    describe("method: update", () => {
        test("Should update value when token exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "old");

            context.update(token, "new");

            expect(context.get(token)).toBe("new");
        });

        test("Should not create value when token does not exist", () => {
            const token = contextToken<string>("key");

            context.update(token, "value");

            expect(context.get(token)).toBeNull();
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            const result = context.update(token, "new");

            expect(result).toBe(context);
        });
    });

    describe("method: updateIncrement", () => {
        test("Should increment value when token exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateIncrement(token);

            expect(context.get(token)).toBe(6);
        });

        test("Should not change anything when token does not exist", () => {
            const token = contextToken<number>("count");

            context.updateIncrement(token);

            expect(context.get(token)).toBeNull();
        });

        test("Should increment by specified nbr value", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateIncrement(token, { nbr: 3 });

            expect(context.get(token)).toBe(8);
        });

        test("Should not exceed max value", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.updateIncrement(token, { max: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            const result = context.updateIncrement(token);

            expect(result).toBe(context);
        });

        test("Should cap value to max when incrementing brings it to exactly max", () => {
            const token = contextToken<number>("count");
            context.put(token, 9);

            context.updateIncrement(token, { nbr: 1, max: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should not increment when value is already at max", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.updateIncrement(token, { nbr: 1, max: 10 });

            expect(context.get(token)).toBe(10);
        });

        test("Should cap incremented value to max when exceeding", () => {
            const token = contextToken<number>("count");
            context.put(token, 8);

            context.updateIncrement(token, { nbr: 5, max: 10 });

            expect(context.get(token)).toBe(8);
        });

        test("Should increment with no max constraint when value exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateIncrement(token, { nbr: 10 });

            expect(context.get(token)).toBe(15);
        });

        test("Should increment to exactly max value", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateIncrement(token, { nbr: 5, max: 10 });

            expect(context.get(token)).toBe(10);
        });
    });

    describe("method: updateDecrement", () => {
        test("Should decrement value when token exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateDecrement(token);

            expect(context.get(token)).toBe(4);
        });

        test("Should not change anything when token does not exist", () => {
            const token = contextToken<number>("count");

            context.updateDecrement(token);

            expect(context.get(token)).toBeNull();
        });

        test("Should decrement by specified nbr value", () => {
            const token = contextToken<number>("count");
            context.put(token, 10);

            context.updateDecrement(token, { nbr: 3 });

            expect(context.get(token)).toBe(7);
        });

        test("Should not go below min value", () => {
            const token = contextToken<number>("count");
            context.put(token, 0);

            context.updateDecrement(token, { min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            const result = context.updateDecrement(token);

            expect(result).toBe(context);
        });

        test("Should cap value to min when decrementing brings it to exactly min", () => {
            const token = contextToken<number>("count");
            context.put(token, 1);

            context.updateDecrement(token, { nbr: 1, min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should not decrement when value is already at min", () => {
            const token = contextToken<number>("count");
            context.put(token, 0);

            context.updateDecrement(token, { nbr: 1, min: 0 });

            expect(context.get(token)).toBe(0);
        });

        test("Should cap decremented value to min when going below", () => {
            const token = contextToken<number>("count");
            context.put(token, 3);

            context.updateDecrement(token, { nbr: 5, min: 0 });

            expect(context.get(token)).toBe(3);
        });

        test("Should decrement with no min constraint when value exists", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateDecrement(token, { nbr: 10 });

            expect(context.get(token)).toBe(-5);
        });

        test("Should decrement to exactly min value", () => {
            const token = contextToken<number>("count");
            context.put(token, 5);

            context.updateDecrement(token, { nbr: 5, min: 0 });

            expect(context.get(token)).toBe(0);
        });
    });

    describe("method: updatePush", () => {
        test("Should append to existing array when token exists", () => {
            const token = contextToken<Array<number>>("items");
            context.put(token, [1, 2]);

            context.updatePush(token, 3, 4);

            expect(context.get(token)).toEqual([1, 2, 3, 4]);
        });

        test("Should not create array when token does not exist", () => {
            const token = contextToken<Array<number>>("items");

            context.updatePush(token, 1, 2);

            expect(context.get(token)).toBeNull();
        });

        test("Should handle single value", () => {
            const token = contextToken<Array<string>>("items");
            context.put(token, ["a"]);

            context.updatePush(token, "b");

            expect(context.get(token)).toEqual(["a", "b"]);
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<Array<number>>("items");
            context.put(token, [1]);

            const result = context.updatePush(token, 2);

            expect(result).toBe(context);
        });
    });

    describe("method: remove", () => {
        test("Should remove a token that exists", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            context.remove(token);

            expect(context.exists(token)).toBe(false);
            expect(context.get(token)).toBeNull();
        });

        test("Should not throw when removing a non-existent token", () => {
            const token = contextToken<string>("nonexistent");

            expect(() => context.remove(token)).not.toThrow();
        });

        test("Should return the context for chaining", () => {
            const token = contextToken<string>("key");
            context.put(token, "value");

            const result = context.remove(token);

            expect(result).toBe(context);
        });

        test("Should remove only the specified token", () => {
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<string>("key2");
            context.put(token1, "value1");
            context.put(token2, "value2");

            context.remove(token1);

            expect(context.exists(token1)).toBe(false);
            expect(context.exists(token2)).toBe(true);
        });
    });

    describe("method: when", () => {
        test("Should invoke functions when condition is true", () => {
            let invoked = false;

            context.when(true, () => {
                invoked = true;
                return context;
            });

            expect(invoked).toBe(true);
        });

        test("Should not invoke functions when condition is false", () => {
            let invoked = false;

            context.when(false, () => {
                invoked = true;
                return context;
            });

            expect(invoked).toBe(false);
        });

        test("Should invoke multiple functions in order", () => {
            const invocations: Array<number> = [];

            context.when(
                true,
                () => {
                    invocations.push(1);
                    return context;
                },
                () => {
                    invocations.push(2);
                    return context;
                },
                () => {
                    invocations.push(3);
                    return context;
                },
            );

            expect(invocations).toEqual([1, 2, 3]);
        });

        test("Should support lazy conditions", () => {
            let conditionEvaluated = false;

            context.when(
                () => {
                    conditionEvaluated = true;
                    return true;
                },
                () => {
                    return context;
                },
            );

            expect(conditionEvaluated).toBe(true);
        });

        test("Should pass context to each invokable", () => {
            const token = contextToken<number>("count");
            context.put(token, 0);

            context.when(
                true,
                (ctx) => {
                    ctx.update(token, 1);
                    return ctx;
                },
                (ctx) => {
                    ctx.update(token, 2);
                    return ctx;
                },
            );

            expect(context.get(token)).toBe(2);
        });

        test("Should return the context for chaining", () => {
            const result = context.when(true, (ctx) => ctx);

            expect(result).toBe(context);
        });

        test("Should return the context even when condition is false", () => {
            const result = context.when(false, (ctx) => ctx);

            expect(result).toBe(context);
        });
    });

    describe("integration: method chaining", () => {
        test("Should support chaining multiple operations", () => {
            const token1 = contextToken<string>("name");
            const token2 = contextToken<number>("count");
            const token3 = contextToken<Array<string>>("items");

            context
                .put(token1, "test")
                .put(token2, 5)
                .putPush(token3, "a", "b")
                .update(token2, 10)
                .updatePush(token3, "c");

            expect(context.get(token1)).toBe("test");
            expect(context.get(token2)).toBe(10);
            expect(context.get(token3)).toEqual(["a", "b", "c"]);
        });

        test("Should support complex workflows", () => {
            const userCountToken = contextToken<number>("userCount");
            const activeUsersToken = contextToken<Array<string>>("activeUsers");
            const maxUsersToken = contextToken<number>("maxUsers");

            context
                .put(maxUsersToken, 100)
                .put(userCountToken, 0)
                .put(activeUsersToken, [])
                .when(context.getOrFail(maxUsersToken) > 0, (ctx) =>
                    ctx
                        .putIncrement(userCountToken)
                        .putPush(activeUsersToken, "user1"),
                )
                .when(
                    () => context.getOrFail(userCountToken) < 10,
                    (ctx) =>
                        ctx
                            .putIncrement(userCountToken)
                            .putPush(activeUsersToken, "user2"),
                );

            expect(context.get(userCountToken)).toBe(2);
            expect(context.get(activeUsersToken)).toEqual(["user1", "user2"]);
        });
    });
});
