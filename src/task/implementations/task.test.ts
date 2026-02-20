import { describe, test, expect } from "vitest";

import { Task } from "@/task/implementations/task.js";

describe("class: Task", () => {
    describe("static method: wrapFn", () => {
        test("Should work exactly like the given function", async () => {
            async function add(a: number, b: number) {
                return Promise.resolve(a + b);
            }
            const wrappedTestFn = Task.wrapFn(add);
            expect(await wrappedTestFn(1, 1)).toBe(2);
        });
        test("Should return instance of Task", () => {
            async function add(a: number, b: number) {
                return Promise.resolve(a + b);
            }
            const wrappedTestFn = Task.wrapFn(add);
            expect(wrappedTestFn(1, 1)).toBeInstanceOf(Task);
        });
    });
    describe("method: detach", () => {
        test("Should execute the given async function when detach method is called", () => {
            let hasExecuted = false;

            const promise = new Task(async () => {
                hasExecuted = true;
                return Promise.resolve();
            });
            expect(hasExecuted).toBe(false);
            promise.detach();
            expect(hasExecuted).toBe(true);
        });
    });
    describe("method: then", () => {
        test("Should execute the given async function when awaited", async () => {
            let hasExecuted = false;

            const promise = new Task(async () => {
                hasExecuted = true;
                return Promise.resolve();
            });
            expect(hasExecuted).toBe(false);
            await promise;
            expect(hasExecuted).toBe(true);
        });
        test("Should execute the given async function when then method is called", () => {
            let hasExecuted = false;

            const promise = new Task(async () => {
                hasExecuted = true;
                return Promise.resolve();
            });
            expect(hasExecuted).toBe(false);
            promise.then();
            expect(hasExecuted).toBe(true);
        });
    });
});
