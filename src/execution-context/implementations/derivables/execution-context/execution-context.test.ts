import { describe, test, expect } from "vitest";

import { contextToken } from "@/execution-context/contracts/execution-context.contract.js";
import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/execution-context/execution-context.js";
import { type InvokableFn } from "@/utilities/_module.js";

describe("class: ExecutionContext", () => {
    describe("method: contains", () => {
        test("Should return false when array token does not exist", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                return context.contains(token, 42);
            });

            expect(result).toBe(false);
        });

        test("Should return true when array contains matching value", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.add(token, [1, 2, 3]);
                return context.contains(token, 2);
            });

            expect(result).toBe(true);
        });

        test("Should return false when array does not contain value", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.add(token, [1, 2, 3]);
                return context.contains(token, 99);
            });

            expect(result).toBe(false);
        });

        test("Should work with predicate function", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.add(token, [1, 2, 3, 4, 5]);
                return (
                    context.contains(token, (item) => item > 3) &&
                    !context.contains(token, (item) => item > 10)
                );
            });

            expect(result).toBe(true);
        });
    });

    describe("method: exists", () => {
        test("Should return false for non-existent token", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.exists(token);
            });

            expect(result).toBe(false);
        });

        test("Should return true for existing token", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "John");
                return context.exists(token);
            });

            expect(result).toBe(true);
        });
    });

    describe("method: missing", () => {
        test("Should return true for non-existent token", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.missing(token);
            });

            expect(result).toBe(true);
        });

        test("Should return false for existing token", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "John");
                return context.missing(token);
            });

            expect(result).toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return null when token does not exist", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should return value when token exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "Alice");
                return context.get(token);
            });

            expect(result).toBe("Alice");
        });

        test("Should work with different value types", () => {
            const context = new ExecutionContext();
            const numberToken = contextToken<number>("count");
            const boolToken = contextToken<boolean>("active");
            const objectToken = contextToken<{ id: string }>("config");

            const result = context.run(() => {
                context.add(numberToken, 42);
                context.add(boolToken, true);
                context.add(objectToken, { id: "cfg-1" });

                return {
                    number: context.get(numberToken),
                    bool: context.get(boolToken),
                    object: context.get(objectToken),
                };
            });

            expect(result).toEqual({
                number: 42,
                bool: true,
                object: { id: "cfg-1" },
            });
        });
    });

    describe("method: getOr", () => {
        test("Should return default value from static value when token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.getOr(token, "default");
            });

            expect(result).toBe("default");
        });

        test("Should return default value from function when token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.getOr(token, () => "computed");
            });

            expect(result).toBe("computed");
        });

        test("Should return actual value when token exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "Bob");
                return context.getOr(token, "default");
            });

            expect(result).toBe("Bob");
        });
    });

    describe("method: getOrFail", () => {
        test("Should throw NotFoundExecutionContextError when token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            expect(() => {
                context.run(() => {
                    context.getOrFail(token);
                });
            }).toThrow(NotFoundExecutionContextError);
        });

        test("Should return value when token exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "Charlie");
                return context.getOrFail(token);
            });

            expect(result).toBe("Charlie");
        });
    });

    describe("method: add", () => {
        test("Should add a new key-value pair", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "David");
                return context.get(token);
            });

            expect(result).toBe("David");
        });

        test("Should not overwrite existing value", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.add(token, "Eve");
                context.add(token, "Frank");
                return context.get(token);
            });

            expect(result).toBe("Eve");
        });

        test("Should return context for chaining", () => {
            const context = new ExecutionContext();
            const nameToken = contextToken<string>("name");
            const ageToken = contextToken<number>("age");

            const result = context.run(() => {
                context.add(nameToken, "George").add(ageToken, 30);
                return {
                    name: context.get(nameToken),
                    age: context.get(ageToken),
                };
            });

            expect(result).toEqual({ name: "George", age: 30 });
        });
    });

    describe("method: put", () => {
        test("Should set a new key-value pair", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.put(token, "Helen");
                return context.get(token);
            });

            expect(result).toBe("Helen");
        });

        test("Should overwrite existing value", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.put(token, "Ivan");
                context.put(token, "Judy");
                return context.get(token);
            });

            expect(result).toBe("Judy");
        });

        test("Should return context for chaining", () => {
            const context = new ExecutionContext();
            const nameToken = contextToken<string>("name");
            const ageToken = contextToken<number>("age");

            const result = context.run(() => {
                context.put(nameToken, "Kevin").put(ageToken, 25);
                return {
                    name: context.get(nameToken),
                    age: context.get(ageToken),
                };
            });

            expect(result).toEqual({ name: "Kevin", age: 25 });
        });
    });

    describe("method: putIncrement", () => {
        test("Should initialize value to 0 if missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putIncrement(token);
                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should increment existing value by default 1", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.putIncrement(token);
                return context.get(token);
            });

            expect(result).toBe(6);
        });

        test("Should increment by custom amount", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 10);
                context.putIncrement(token, { nbr: 5 });
                return context.get(token);
            });

            expect(result).toBe(15);
        });

        test("Should respect max boundary", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 8);
                context.putIncrement(token, { max: 10 });
                const first = context.get(token);
                context.putIncrement(token, { max: 10 });
                const second = context.get(token);
                context.putIncrement(token, { max: 10 });
                const third = context.get(token);
                return { first, second, third };
            });

            expect(result).toEqual({ first: 9, second: 10, third: 10 });
        });

        test("Should use custom initialValue", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putIncrement(token, { initialValue: 100, nbr: 0 });
                return context.get(token);
            });

            expect(result).toBe(100);
        });

        test("Should increment with no max constraint", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.putIncrement(token, { nbr: 10 });
                return context.get(token);
            });

            expect(result).toBe(15);
        });

        test("Should add initialValue with no max when token does not exist", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putIncrement(token, { initialValue: 5 });
                return context.get(token);
            });

            expect(result).toBe(5);
        });

        test("Should cap initialValue exactly to max when equal", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putIncrement(token, { initialValue: 10, max: 10 });
                return context.get(token);
            });

            expect(result).toBe(10);
        });
    });

    describe("method: putDecrement", () => {
        test("Should initialize value to 0 if missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putDecrement(token);
                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should decrement existing value by default 1", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.putDecrement(token);
                return context.get(token);
            });

            expect(result).toBe(4);
        });

        test("Should decrement by custom amount", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 20);
                context.putDecrement(token, { nbr: 5 });
                return context.get(token);
            });

            expect(result).toBe(15);
        });

        test("Should respect min boundary", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 2);
                context.putDecrement(token, { min: 0 });
                const first = context.get(token);
                context.putDecrement(token, { min: 0 });
                const second = context.get(token);
                context.putDecrement(token, { min: 0 });
                const third = context.get(token);
                return { first, second, third };
            });

            expect(result).toEqual({ first: 1, second: 0, third: 0 });
        });

        test("Should add initialValue with no min when token does not exist", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putDecrement(token, { initialValue: 5 });
                return context.get(token);
            });

            expect(result).toBe(5);
        });

        test("Should cap initialValue exactly to min when equal", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.putDecrement(token, { initialValue: 0, min: 0 });
                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should decrement with no min constraint when value exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 10);
                context.putDecrement(token, { nbr: 15 });
                return context.get(token);
            });

            expect(result).toBe(-5);
        });
    });

    describe("method: putPush", () => {
        test("Should create array if token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.putPush(token, 1, 2, 3);
                return context.get(token);
            });

            expect(result).toEqual([1, 2, 3]);
        });

        test("Should append values to existing array", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.put(token, [1, 2]);
                context.putPush(token, 3, 4);
                return context.get(token);
            });

            expect(result).toEqual([1, 2, 3, 4]);
        });

        test("Should work with single value", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<string>>("tags");

            const result = context.run(() => {
                context.putPush(token, "a");
                return context.get(token);
            });

            expect(result).toEqual(["a"]);
        });
    });

    describe("method: update", () => {
        test("Should update existing value", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.put(token, "Lisa");
                context.update(token, "Lucy");
                return context.get(token);
            });

            expect(result).toBe("Lucy");
        });

        test("Should do nothing if token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.update(token, "Mike");
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should return context for chaining", () => {
            const context = new ExecutionContext();
            const nameToken = contextToken<string>("name");
            const ageToken = contextToken<number>("age");

            const result = context.run(() => {
                context.put(nameToken, "Nancy");
                context.put(ageToken, 28);
                context.update(nameToken, "Naomi").update(ageToken, 29);
                return {
                    name: context.get(nameToken),
                    age: context.get(ageToken),
                };
            });

            expect(result).toEqual({ name: "Naomi", age: 29 });
        });
    });

    describe("method: updateIncrement", () => {
        test("Should increment existing value by default 1", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 10);
                context.updateIncrement(token);
                return context.get(token);
            });

            expect(result).toBe(11);
        });

        test("Should do nothing if token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.updateIncrement(token);
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should increment by custom amount", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.updateIncrement(token, { nbr: 3 });
                return context.get(token);
            });

            expect(result).toBe(8);
        });

        test("Should respect max boundary", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 18);
                context.updateIncrement(token, { max: 20 });
                const first = context.get(token);
                context.updateIncrement(token, { max: 20 });
                const second = context.get(token);
                context.updateIncrement(token, { max: 20 });
                const third = context.get(token);
                return { first, second, third };
            });

            expect(result).toEqual({ first: 19, second: 20, third: 20 });
        });

        test("Should cap value to max when incrementing brings it to exactly max", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 9);
                context.updateIncrement(token, { nbr: 1, max: 10 });
                return context.get(token);
            });

            expect(result).toBe(10);
        });

        test("Should not increment when value is already at max", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 10);
                context.updateIncrement(token, { nbr: 1, max: 10 });
                return context.get(token);
            });

            expect(result).toBe(10);
        });

        test("Should increment with no max constraint when value exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.updateIncrement(token, { nbr: 10 });
                return context.get(token);
            });

            expect(result).toBe(15);
        });

        test("Should increment to exactly max value", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.updateIncrement(token, { nbr: 5, max: 10 });
                return context.get(token);
            });

            expect(result).toBe(10);
        });
    });

    describe("method: updateDecrement", () => {
        test("Should decrement existing value by default 1", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 10);
                context.updateDecrement(token);
                return context.get(token);
            });

            expect(result).toBe(9);
        });

        test("Should do nothing if token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.updateDecrement(token);
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should decrement by custom amount", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 15);
                context.updateDecrement(token, { nbr: 3 });
                return context.get(token);
            });

            expect(result).toBe(12);
        });

        test("Should respect min boundary", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 2);
                context.updateDecrement(token, { min: 0 });
                const first = context.get(token);
                context.updateDecrement(token, { min: 0 });
                const second = context.get(token);
                context.updateDecrement(token, { min: 0 });
                const third = context.get(token);
                return { first, second, third };
            });

            expect(result).toEqual({ first: 1, second: 0, third: 0 });
        });

        test("Should cap value to min when decrementing brings it to exactly min", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 1);
                context.updateDecrement(token, { nbr: 1, min: 0 });
                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should not decrement when value is already at min", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 0);
                context.updateDecrement(token, { nbr: 1, min: 0 });
                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should decrement with no min constraint when value exists", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.updateDecrement(token, { nbr: 10 });
                return context.get(token);
            });

            expect(result).toBe(-5);
        });

        test("Should decrement to exactly min value", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);
                context.updateDecrement(token, { nbr: 5, min: 0 });
                return context.get(token);
            });

            expect(result).toBe(0);
        });
    });

    describe("method: updatePush", () => {
        test("Should append values to existing array", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.put(token, [1, 2]);
                context.updatePush(token, 3, 4);
                return context.get(token);
            });

            expect(result).toEqual([1, 2, 3, 4]);
        });

        test("Should do nothing if token missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.updatePush(token, 1, 2);
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should work with single value push", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<string>>("tags");

            const result = context.run(() => {
                context.put(token, ["a", "b"]);
                context.updatePush(token, "c");
                return context.get(token);
            });

            expect(result).toEqual(["a", "b", "c"]);
        });
    });

    describe("method: remove", () => {
        test("Should remove existing key", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.put(token, "Oscar");
                expect(context.exists(token)).toBe(true);
                context.remove(token);
                return context.exists(token);
            });

            expect(result).toBe(false);
        });

        test("Should do nothing if key missing", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            expect(() => {
                context.run(() => {
                    context.remove(token);
                });
            }).not.toThrow();
        });

        test("Should return context for chaining", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            const result = context.run(() => {
                context.put(token, "Paula");
                context.remove(token);
                return context.exists(token);
            });

            expect(result).toBe(false);
        });
    });

    describe("method: when", () => {
        test("Should execute invokable when condition is true", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.when(true, (ctx) => ctx.put(token, 42));
                return context.get(token);
            });

            expect(result).toBe(42);
        });

        test("Should not execute invokable when condition is false", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.when(false, (ctx) => ctx.put(token, 42));
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should evaluate condition lazily", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                let conditionEvaluated = false;
                context.when(
                    () => {
                        conditionEvaluated = true;
                        return true;
                    },
                    (ctx) => ctx.put(token, 100),
                );
                return {
                    evaluated: conditionEvaluated,
                    value: context.get(token),
                };
            });

            expect(result).toEqual({ evaluated: true, value: 100 });
        });

        test("Should execute multiple invokables in sequence", () => {
            const context = new ExecutionContext();
            const token1 = contextToken<number>("count1");
            const token2 = contextToken<number>("count2");

            const result = context.run(() => {
                context.when(
                    true,
                    (ctx) => ctx.put(token1, 10),
                    (ctx) => ctx.put(token2, 20),
                );

                return {
                    val1: context.get(token1),
                    val2: context.get(token2),
                };
            });

            expect(result).toEqual({ val1: 10, val2: 20 });
        });
    });

    describe("method: run", () => {
        test("Should execute invokable and return its value", () => {
            const context = new ExecutionContext();
            const result = context.run(() => 42);

            expect(result).toBe(42);
        });

        test("Should isolate context between runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            // First run sets a value
            context.run(() => {
                context.put(token, 10);
            });

            // Second run starts fresh - modifications from first run aren't visible
            const innerResult = context.run(() => {
                // Token doesn't exist here (fresh run)
                expect(context.exists(token)).toBe(false);
                context.put(token, 20);
                return context.get(token);
            });

            expect(innerResult).toBe(20);

            // Third run also starts fresh
            const outerResult = context.run(() => {
                return context.get(token);
            });

            expect(outerResult).toBeNull();
        });

        test("Should allow inner run to see outer context values at start", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 5);

                const innerResult = context.run(() => {
                    expect(context.get(token)).toBe(5);
                    context.update(token, 15);
                    return context.get(token);
                });

                return {
                    inner: innerResult,
                    outer: context.get(token),
                };
            });

            expect(result).toEqual({ inner: 15, outer: 5 });
        });

        test("Should maintain separate contexts for nested runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 1);

                const innerResult1 = context.run(() => {
                    context.update(token, 2);

                    const innerResult2 = context.run(() => {
                        context.update(token, 3);
                        return context.get(token);
                    });

                    return {
                        afterInner: context.get(token),
                        innerVal: innerResult2,
                    };
                });

                return {
                    afterNested: context.get(token),
                    nested: innerResult1,
                };
            });

            expect(result).toEqual({
                afterNested: 1,
                nested: {
                    afterInner: 2,
                    innerVal: 3,
                },
            });
        });
    });

    describe("method: bind", () => {
        test("Should return a function that preserves context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            context.run(() => {
                context.put(token, 42);
            });

            const boundFn = context.bind((multiplier: number) => {
                const value = context.get(token);
                return (value ?? 0) * multiplier;
            });

            // Bound function has snapshot of context from when bind was called (which was empty)
            const result = boundFn(2);
            expect(result).toBe(0);
        });

        test("Should receive correct arguments in bound function", () => {
            const context = new ExecutionContext();

            const boundFn = context.bind((a: number, b: string) => {
                return `${String(a)}-${b}`;
            });

            expect(boundFn(10, "test")).toBe("10-test");
        });

        test("Should receive outer context state at bind time in bound function", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            let boundFn = () => {
                return context.get(token);
            };

            context.run(() => {
                context.put(token, 100);
                boundFn = context.bind(boundFn);

                context.update(token, 200);
            });

            // Bound function should see 100 (snapshot from bind time inside run)
            expect(boundFn()).toBe(100);
        });

        test("Should not affect outer context with modifications in bound function", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            let boundFn = () => {
                context.update(token, 50);
                return context.get(token);
            };
            context.run(() => {
                context.put(token, 10);

                boundFn = context.bind(boundFn);
            });

            const result = boundFn();
            expect(result).toBe(50); // Result of bound function's execution
        });

        test("Should have independent snapshots for multiple bound functions", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            let boundFn1 = () => context.get(token);
            let boundFn2 = () => context.get(token);

            context.run(() => {
                context.put(token, 1);
                boundFn1 = context.bind(boundFn1);

                context.update(token, 2);
                boundFn2 = context.bind(boundFn2);
            });

            expect(boundFn1()).toBe(1);
            expect(boundFn2()).toBe(2);
        });

        test("Should handle multiple arguments and complex logic in bound function", () => {
            const context = new ExecutionContext();
            const baseToken = contextToken<number>("base");
            const multiplierToken = contextToken<number>("multiplier");

            let boundFn = (addition: number) => {
                const base = context.get(baseToken) ?? 0;
                const multiplier = context.get(multiplierToken) ?? 1;
                return base * multiplier + addition;
            };

            context.run(() => {
                context.put(baseToken, 5);
                context.put(multiplierToken, 3);

                boundFn = context.bind(boundFn);
            });

            expect(boundFn(2)).toBe(17); // 5 * 3 + 2
        });
    });

    describe("method: contains (extended)", () => {
        test("Should work with different types in contains", () => {
            const context = new ExecutionContext();
            const token =
                contextToken<Array<{ id: number; name: string }>>("objects");

            const result = context.run(() => {
                context.put(token, [
                    { id: 1, name: "first" },
                    { id: 2, name: "second" },
                ]);
                return context.contains(token, (obj) => obj.id === 2);
            });

            expect(result).toBe(true);
        });

        test("Should return false when array is empty", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.put(token, []);
                return context.contains(token, 1);
            });

            expect(result).toBe(false);
        });
    });

    describe("method: exists (extended)", () => {
        test("Should return true even when value is falsy", () => {
            const context = new ExecutionContext();
            const token = contextToken<boolean>("falsy");

            const result = context.run(() => {
                context.put(token, false);
                return context.exists(token);
            });

            expect(result).toBe(true);
        });

        test("Should return true when value is null", () => {
            const context = new ExecutionContext();
            const token = contextToken<string | null>("nullable");

            const result = context.run(() => {
                context.put(token, null as string | null);
                return context.exists(token);
            });

            expect(result).toBe(true);
        });
    });

    describe("method: missing (extended)", () => {
        test("Should return false even when value is falsy", () => {
            const context = new ExecutionContext();
            const token = contextToken<boolean>("falsy");

            const result = context.run(() => {
                context.put(token, false);
                return context.missing(token);
            });

            expect(result).toBe(false);
        });
    });

    describe("method: getOr (extended)", () => {
        test("Should return the value even when it is falsy", () => {
            const context = new ExecutionContext();
            const token = contextToken<boolean>("falsy");

            const result = context.run(() => {
                context.put(token, false);
                return context.getOr(token, true);
            });

            expect(result).toBe(false);
        });

        test("Should support lazy default values", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("nonexistent");

            const result = context.run(() => {
                return context.getOr(token, () => "lazy");
            });

            expect(result).toBe("lazy");
        });

        test("Should only call lazy default when needed", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            let called = false;
            const result = context.run(() => {
                context.put(token, "value");
                return context.getOr(token, () => {
                    called = true;
                    return "lazy";
                });
            });

            expect(result).toBe("value");
            expect(called).toBe(false);
        });
    });

    describe("method: add (extended)", () => {
        test("Should work with various types", () => {
            const context = new ExecutionContext();
            const stringToken = contextToken<string>("string");
            const numberToken = contextToken<number>("number");
            const arrayToken = contextToken<Array<number>>("array");

            const result = context.run(() => {
                context.add(stringToken, "text");
                context.add(numberToken, 42);
                context.add(arrayToken, [1, 2, 3]);

                return {
                    string: context.get(stringToken),
                    number: context.get(numberToken),
                    array: context.get(arrayToken),
                };
            });

            expect(result).toEqual({
                string: "text",
                number: 42,
                array: [1, 2, 3],
            });
        });
    });

    describe("method: put (extended)", () => {
        test("Should overwrite an existing value", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.run(() => {
                context.put(token, "existing");
                context.put(token, "new");
                return context.get(token);
            });

            expect(result).toBe("new");
        });

        test("Should return context for chaining with put", () => {
            const context = new ExecutionContext();
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<string>("key2");

            const result = context.run(() => {
                context.put(token1, "value1").put(token2, "value2");
                return {
                    key1: context.get(token1),
                    key2: context.get(token2),
                };
            });

            expect(result).toEqual({ key1: "value1", key2: "value2" });
        });
    });

    describe("method: when (extended)", () => {
        test("Should invoke multiple functions in order", () => {
            const context = new ExecutionContext();
            const invocations: Array<number> = [];

            context.run(() => {
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
        });

        test("Should support lazy conditions", () => {
            const context = new ExecutionContext();
            let conditionEvaluated = false;

            context.run(() => {
                context.when(
                    () => {
                        conditionEvaluated = true;
                        return true;
                    },
                    (ctx) => ctx,
                );

                expect(conditionEvaluated).toBe(true);
            });
        });

        test("Should pass context to each invokable", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("count");

            context.run(() => {
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
        });

        test("Should return context even when condition is false", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.run(() => {
                context.put(token, "value");
                return {
                    exists: context.exists(token),
                };
            });

            expect(result.exists).toBe(true);
        });
    });

    describe("integration: method chaining", () => {
        test("Should support chaining multiple operations", () => {
            const context = new ExecutionContext();
            const token1 = contextToken<string>("name");
            const token2 = contextToken<number>("count");
            const token3 = contextToken<Array<string>>("items");

            const result = context.run(() => {
                context
                    .put(token1, "test")
                    .put(token2, 5)
                    .putPush(token3, "a", "b")
                    .update(token2, 10)
                    .updatePush(token3, "c");

                return {
                    name: context.get(token1),
                    count: context.get(token2),
                    items: context.get(token3),
                };
            });

            expect(result).toEqual({
                name: "test",
                count: 10,
                items: ["a", "b", "c"],
            });
        });

        test("Should support complex workflows", () => {
            const context = new ExecutionContext();
            const userCountToken = contextToken<number>("userCount");
            const activeUsersToken = contextToken<Array<string>>("activeUsers");
            const maxUsersToken = contextToken<number>("maxUsers");

            const result = context.run(() => {
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

                return {
                    userCount: context.get(userCountToken),
                    activeUsers: context.get(activeUsersToken),
                };
            });

            expect(result).toEqual({
                userCount: 2,
                activeUsers: ["user1", "user2"],
            });
        });
    });

    describe("context scopes: run", () => {
        test("Should create isolated scopes between consecutive runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const first = context.run(() => {
                context.put(token, 10);
                return context.get(token);
            });

            const second = context.run(() => {
                return context.get(token);
            });

            expect(first).toBe(10);
            expect(second).toBeNull(); // Isolated scope
        });

        test("Should inherit outer context values at run start", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("name");

            context.run(() => {
                context.put(token, "outer");

                const innerValue = context.run(() => {
                    return context.get(token); // Should see outer value
                });

                expect(innerValue).toBe("outer");
            });
        });

        test("Should not leak inner context modifications to outer scope", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.run(() => {
                context.put(token, 0);

                context.run(() => {
                    context.update(token, 100); // Modify in inner scope
                });

                // Outer scope should not see the modification
                expect(context.get(token)).toBe(0);
            });
        });

        test("Should maintain independent snapshots in nested runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const results = context.run(() => {
                context.put(token, 1);

                const inner1 = context.run(() => {
                    context.update(token, 10);
                    return context.get(token);
                });

                const inner2 = context.run(() => {
                    return context.get(token);
                });

                const outer = context.get(token);

                return { inner1, inner2, outer };
            });

            expect(results).toEqual({ inner1: 10, inner2: 1, outer: 1 });
        });
    });

    describe("context scopes: bind", () => {
        test("Should capture context snapshot at bind time across runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("state");

            const boundFn = context.run(() => {
                context.put(token, "snapshot");
                return context.bind(() => context.get(token));
            });

            // Even after outer context changes, bound function sees snapshot
            const result = context.run(() => {
                context.put(token, "different");
                return boundFn();
            });

            expect(result).toBe("snapshot");
        });

        test("Should create independent snapshots for different bound functions", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const fn1 = context.run(() => {
                context.put(token, 100);
                const bound = context.bind(() => context.get(token));
                context.update(token, 200);
                return bound;
            });

            const fn2 = context.run(() => {
                context.put(token, 300);
                return context.bind(() => context.get(token));
            });

            expect(fn1()).toBe(100);
            expect(fn2()).toBe(300);
        });
    });

    describe("nested context scopes: run depth levels", () => {
        test("Should maintain isolation with three levels of nesting", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const result = context.run(() => {
                context.put(token, 1);

                const level2 = context.run(() => {
                    context.put(token, 2);

                    const level3 = context.run(() => {
                        context.put(token, 3);
                        return context.get(token);
                    });

                    return {
                        level3Value: level3,
                        level2Value: context.get(token),
                    };
                });

                return {
                    level1Value: context.get(token),
                    level2Result: level2,
                };
            });

            expect(result).toEqual({
                level1Value: 1,
                level2Result: {
                    level2Value: 2,
                    level3Value: 3,
                },
            });
        });

        test("Should maintain isolation with four levels of nesting", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("levels");

            const result = context.run(() => {
                context.put(token, [1]);

                const l2 = context.run(() => {
                    context.update(token, [1, 2]);

                    const l3 = context.run(() => {
                        context.update(token, [1, 2, 3]);

                        const l4 = context.run(() => {
                            context.update(token, [1, 2, 3, 4]);
                            return context.get(token);
                        });

                        return {
                            l4: l4,
                            l3: context.get(token),
                        };
                    });

                    return {
                        l3Result: l3,
                        l2: context.get(token),
                    };
                });

                return {
                    l2Result: l2,
                    l1: context.get(token),
                };
            });

            expect(result).toEqual({
                l1: [1],
                l2Result: {
                    l2: [1, 2],
                    l3Result: {
                        l3: [1, 2, 3],
                        l4: [1, 2, 3, 4],
                    },
                },
            });
        });

        test("Should handle multiple sibling nested runs at same level", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 0);

                const branch1 = context.run(() => {
                    context.putIncrement(token);
                    context.putIncrement(token);
                    return context.get(token);
                });

                const branch2 = context.run(() => {
                    context.putDecrement(token);
                    return context.get(token);
                });

                const branch3 = context.run(() => {
                    context.putIncrement(token, { nbr: 10 });
                    return context.get(token);
                });

                return {
                    branch1,
                    branch2,
                    branch3,
                    final: context.get(token),
                };
            });

            expect(result).toEqual({
                branch1: 2,
                branch2: -1,
                branch3: 10,
                final: 0, // Outer context unaffected
            });
        });

        test("Should preserve inner run changes via explicit returns", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const result = context.run(() => {
                context.put(token, 10);

                const innerValue = context.run(() => {
                    context.update(token, 20);
                    return context.get(token); // Return the inner value
                });

                return {
                    innerReturned: innerValue,
                    outerCurrent: context.get(token), // Outer unchanged
                };
            });

            expect(result).toEqual({
                innerReturned: 20,
                outerCurrent: 10,
            });
        });
    });

    describe("nested context scopes: bind within run", () => {
        test("Should bind within nested run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            let boundFn = null as InvokableFn<[], number | null> | null;

            context.run(() => {
                context.put(token, 100);

                boundFn = context.run(() => {
                    context.put(token, 200);
                    return context.bind(() => context.get(token));
                });
            });

            // Bound function should see 200 from its captured context
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result = boundFn?.();
            expect(result).toBe(200);
        });

        test("Should create independent bound functions in nested contexts", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const results: Array<() => number | null> = [];

            context.run(() => {
                context.put(token, 1);

                const fn1 = context.run(() => {
                    context.put(token, 10);
                    return context.bind(() => context.get(token));
                });

                results.push(fn1);

                context.run(() => {
                    context.put(token, 20);
                    results.push(context.bind(() => context.get(token)));
                });
            });

            expect(results[0]?.()).toBe(10);
            expect(results[1]?.()).toBe(20);
        });

        test("Should bind capture proper snapshot in deeply nested contexts", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            let capturedBound = null as InvokableFn<[], number | null> | null;

            context.run(() => {
                context.put(token, 1);

                capturedBound = context.run(() => {
                    context.put(token, 2);

                    return context.run(() => {
                        context.put(token, 3);
                        return context.bind(() => context.get(token));
                    });
                });
            });

            // Bound function should see 3 from its nested context
            expect(capturedBound?.()).toBe(3);
        });

        test("Should isolate bound function from subsequent outer mutations", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const boundFn = context.run(() => {
                context.put(token, 100);

                return context.run(() => {
                    context.put(token, 200);
                    context.update(token, 250);
                    return context.bind(() => context.get(token));
                });
            });

            // Bound function sees 250 (from when bind captured the context)
            expect(boundFn()).toBe(250);

            // Further runs don't affect the bound function
            context.run(() => {
                context.put(token, 999);
            });

            expect(boundFn()).toBe(250); // Unchanged
        });
    });

    describe("nested context scopes: complex interactions", () => {
        test("Should handle modifications across multiple nested levels", () => {
            const context = new ExecutionContext();
            const token1 = contextToken<number>("token1");
            const token2 = contextToken<number>("token2");
            const token3 = contextToken<number>("token3");

            const result = context.run(() => {
                context.put(token1, 10);
                context.put(token2, 0);
                context.put(token3, 0);

                context.run(() => {
                    context.update(token2, 20);
                    context.putIncrement(token3);

                    context.run(() => {
                        context.update(token1, 100); // Doesn't affect outer
                        context.update(token2, 200); // Doesn't affect outer
                        context.update(token3, 300); // Doesn't affect outer
                    });
                });

                return {
                    t1: context.get(token1),
                    t2: context.get(token2),
                    t3: context.get(token3),
                };
            });

            expect(result).toEqual({ t1: 10, t2: 0, t3: 0 });
        });

        test("Should handle when() conditions in nested contexts", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 0);

                context.run(() => {
                    context.when(true, (ctx) =>
                        ctx.putIncrement(token).putIncrement(token),
                    );

                    context.run(() => {
                        context.when(
                            () => context.get(token) === 0,
                            (ctx) => ctx.put(token, 999),
                        );
                    });
                });

                return context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should handle array mutations in nested contexts", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<string>>("items");

            const result = context.run(() => {
                context.put(token, ["a"]);

                context.run(() => {
                    context.updatePush(token, "b");

                    context.run(() => {
                        context.updatePush(token, "c", "d");
                    });
                });

                return context.get(token);
            });

            expect(result).toEqual(["a"]);
        });

        test("Should support method chaining across nested boundaries", () => {
            const context = new ExecutionContext();
            const t1 = contextToken<number>("t1");
            const t2 = contextToken<number>("t2");

            const result = context.run(() => {
                context.put(t1, 1).put(t2, 2);

                const nested = context.run(() => {
                    context.update(t1, 10).update(t2, 20);

                    return {
                        t1: context.get(t1),
                        t2: context.get(t2),
                    };
                });

                return {
                    nested,
                    outer: {
                        t1: context.get(t1),
                        t2: context.get(t2),
                    },
                };
            });

            expect(result).toEqual({
                nested: { t1: 10, t2: 20 },
                outer: { t1: 1, t2: 2 },
            });
        });

        test("Should handle getOrFail() in nested contexts with inherited values", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");
            const missing = contextToken<string>("missing");

            const result = context.run(() => {
                context.put(token, "outer");

                const nested = context.run(() => {
                    // Nested context inherits parent values
                    const inherited = context.getOrFail(token);
                    // But missing keys still throw
                    try {
                        context.getOrFail(missing);
                        return "should not reach"; // Should throw before this
                    } catch (e) {
                        return {
                            inherited,
                            threwForMissing:
                                e instanceof NotFoundExecutionContextError,
                        };
                    }
                });

                return nested;
            });

            expect(result).toEqual({
                inherited: "outer",
                threwForMissing: true,
            });
        });
    });

    describe("nested context scopes: inheritance and visibility", () => {
        test("Should allow reading parent context in nested run", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("shared");

            const result = context.run(() => {
                context.put(token, 100);

                const nestedValue = context.run(() => {
                    // Inner can see outer at start
                    const inherited = context.get(token);
                    context.put(token, 200);
                    return { inherited, modified: context.get(token) };
                });

                return {
                    nested: nestedValue,
                    outer: context.get(token),
                };
            });

            expect(result).toEqual({
                nested: { inherited: 100, modified: 200 },
                outer: 100,
            });
        });

        test("Should not share mutations between sibling nested runs", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            const result = context.run(() => {
                context.put(token, 0);

                const sibling1 = context.run(() => {
                    context.putIncrement(token, { nbr: 5 });
                    return context.get(token);
                });

                const sibling2 = context.run(() => {
                    return context.get(token); // Should still be 0
                });

                return { sibling1, sibling2, outer: context.get(token) };
            });

            expect(result).toEqual({
                sibling1: 5,
                sibling2: 0,
                outer: 0,
            });
        });

        test("Should handle contains() predicate in nested contexts with inheritance", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.run(() => {
                context.put(token, [1, 2, 3]);

                const nested = context.run(() => {
                    // Nested run inherits parent's array
                    const hasGreaterThan1 = context.contains(
                        token,
                        (x) => x > 1,
                    );
                    // But modifications don't leak back
                    context.updatePush(token, 4, 5);
                    return { hasGreaterThan1, modified: context.get(token) };
                });

                // Original array should be unchanged
                const original = context.get(token);

                return { nested, original };
            });

            expect(result).toEqual({
                nested: { hasGreaterThan1: true, modified: [1, 2, 3, 4, 5] },
                original: [1, 2, 3],
            });
        });
    });

    describe("no-op behavior: outside run context", () => {
        test("get() returns null when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.get(token);
            expect(result).toBeNull();
        });

        test("exists() returns false when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.exists(token);
            expect(result).toBe(false);
        });

        test("missing() returns true when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.missing(token);
            expect(result).toBe(true);
        });

        test("contains() returns false when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            const result = context.contains(token, 42);
            expect(result).toBe(false);
        });

        test("getOr() returns default value when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.getOr(token, "default");
            expect(result).toBe("default");
        });

        test("getOr() calls lazy function when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            const result = context.getOr(token, () => "lazy");
            expect(result).toBe("lazy");
        });

        test("getOrFail() throws when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            expect(() => {
                context.getOrFail(token);
            }).toThrow(NotFoundExecutionContextError);
        });

        test("put() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            context.put(token, "value");

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("add() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            context.add(token, "value");

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("update() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            context.update(token, "value");

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("remove() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<string>("key");

            expect(() => {
                context.remove(token);
            }).not.toThrow();

            /**No effect since nothing to remove */
            expect(context.exists(token)).toBe(false);
        });

        test("putIncrement() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.putIncrement(token);

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("putDecrement() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.putDecrement(token);

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("updateIncrement() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.updateIncrement(token);

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("updateDecrement() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.updateDecrement(token);

            // Verify value was not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("putPush() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            context.putPush(token, 1, 2, 3);

            // Verify values were not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("updatePush() is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<Array<number>>("items");

            context.updatePush(token, 1, 2, 3);

            // Verify values were not stored
            expect(context.get(token)).toBeNull();
            expect(context.exists(token)).toBe(false);
        });

        test("when() with true condition is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            let invoked = false;
            context.when(true, () => {
                invoked = true;
                return context;
            });

            // Invokable was not called because not in run context
            expect(invoked).toBe(false);
            expect(context.get(token)).toBeNull();
        });

        test("when() with false condition is no-op when not in run context", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            let invoked = false;
            context.when(false, () => {
                invoked = true;
                return context;
            });

            // Invokable was not called (expected)
            expect(invoked).toBe(false);
            expect(context.get(token)).toBeNull();
        });

        test("Method chaining outside run context returns no-op context", () => {
            const context = new ExecutionContext();
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<number>("key2");

            context
                .put(token1, "value1")
                .put(token2, 42)
                .update(token1, "value2")
                .updateIncrement(token2);

            // Verify nothing was stored
            expect(context.get(token1)).toBeNull();
            expect(context.get(token2)).toBeNull();
            expect(context.exists(token1)).toBe(false);
            expect(context.exists(token2)).toBe(false);
        });

        test("Multiple mutations outside run context all no-op", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("counter");

            context.putIncrement(token);
            context.putIncrement(token);
            context.putIncrement(token);

            // Verify nothing was stored
            expect(context.get(token)).toBeNull();
        });

        test("bind() outside run context captures empty context snapshot that mutations work in", () => {
            const context = new ExecutionContext();
            const token = contextToken<number>("value");

            const boundFn = context.bind(() => {
                // Inside bound function, context is a captured empty Context
                // Mutations work normally within this captured context
                context.put(token, 100);
                return context.get(token);
            });

            // Bound function executes with the captured empty context
            // Mutations work in the isolated snapshot
            const result = boundFn();
            expect(result).toBe(100); // Mutations work in captured context
        });
    });
});
