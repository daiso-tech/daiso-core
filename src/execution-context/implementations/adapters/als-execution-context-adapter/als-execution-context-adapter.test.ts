import { describe, test, expect } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";

describe("class: AlsExecutionContextAdapter", () => {
    describe("method: get", () => {
        test("Should return null when no context is set", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            expect(adapter.get()).toBeNull();
        });
        test("Should return the context value during run()", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            const contextValue = "test-context";

            adapter.run(contextValue, () => {
                expect(adapter.get()).toBe(contextValue);
            });
        });
        test("Should return null after run() completes", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            adapter.run("test-context", () => {
                // Context is available inside
            });
            // Context should be cleared after run completes
            expect(adapter.get()).toBeNull();
        });
    });
    describe("method: run", () => {
        test("Should execute the provided function", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            let functionExecuted = false;

            adapter.run("context", () => {
                functionExecuted = true;
            });

            expect(functionExecuted).toBe(true);
        });
        test("Should return the function's return value", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            const expectedValue = 42;

            const result = adapter.run("context", () => {
                return expectedValue;
            });

            expect(result).toBe(expectedValue);
        });
        test("Should work with different value types", () => {
            const numberAdapter = new AlsExecutionContextAdapter<number>();
            numberAdapter.run(123, () => {
                expect(numberAdapter.get()).toBe(123);
            });

            const objectAdapter = new AlsExecutionContextAdapter<{
                key: string;
            }>();
            const obj = { key: "value" };
            objectAdapter.run(obj, () => {
                expect(objectAdapter.get()).toBe(obj);
            });
        });
        test("Should work with nested calls maintain separate contexts", () => {
            const adapter = new AlsExecutionContextAdapter<string>();
            let innerContextValue: string | null = null;

            adapter.run("outer", () => {
                expect(adapter.get()).toBe("outer");

                adapter.run("inner", () => {
                    innerContextValue = adapter.get();
                    expect(adapter.get()).toBe("inner");
                });

                // After inner context completes, outer context is restored
                expect(adapter.get()).toBe("outer");
            });

            // After all contexts complete, should be null
            expect(adapter.get()).toBeNull();
            expect(innerContextValue).toBe("inner");
        });
        test("Should maintain separate storage when independent adapter instances are used", () => {
            const adapter1 = new AlsExecutionContextAdapter<string>();
            const adapter2 = new AlsExecutionContextAdapter<string>();

            adapter1.run("adapter1-context", () => {
                adapter2.run("adapter2-context", () => {
                    expect(adapter1.get()).toBe("adapter1-context");
                    expect(adapter2.get()).toBe("adapter2-context");
                });
            });
        });
        test("Should modify and use context", () => {
            const adapter = new AlsExecutionContextAdapter<{ count: number }>();
            const context = { count: 0 };

            const result = adapter.run(context, () => {
                const current = adapter.get();
                expect(current).not.toBeNull();
                if (current) {
                    current.count += 1;
                    return current.count;
                }
                return 0;
            });

            expect(result).toBe(1);
            expect(context.count).toBe(1);
        });
    });
});
