import { describe, test, expect } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { Registry } from "@/di/implementations/eager/registry.js";

const A = genericToken<number>("A");

describe("Registry", () => {
    describe("has", () => {
        test("should return true for a locally stored null value", () => {
            const registry = new Registry<number | null>();
            registry.set(A, null);

            expect(registry.has(A)).toBe(true);
        });

        test("should return false when the token is absent and there is no parent", () => {
            const registry = new Registry<number>();

            expect(registry.has(A)).toBe(false);
        });

        test("should delegate to the parent when absent locally", () => {
            const parent = new Registry<number>();
            parent.set(A, 1);
            const child = new Registry(parent);

            expect(child.has(A)).toBe(true);
        });

        test("should let a local entry shadow a parent entry even when the local value is null", () => {
            const parent = new Registry<number | null>();
            parent.set(A, 1);
            const child = new Registry(parent);
            child.set(A, null);

            expect(child.has(A)).toBe(true);
        });
    });
});
