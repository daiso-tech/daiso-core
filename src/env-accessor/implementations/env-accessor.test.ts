import { describe, test, expect } from "vitest";
import { z } from "zod";

import { UninitializedEnvAccessorError } from "@/env-accessor/contracts/_module.js";
import { EnvAccessor } from "@/env-accessor/implementations/_module.js";

describe("class: EnvAccessor", () => {
    describe("method: get", () => {
        test("Should return null when field doesnt exists", async () => {
            const schema = z.object({ FOO: z.string().optional() });
            const accessor = new EnvAccessor({ schema, sources: [{}] });
            await accessor.init();
            expect(accessor.get("FOO")).toBeNull();
        });
        test("Should return value when field exists", async () => {
            const schema = z.object({ FOO: z.string() });
            const accessor = new EnvAccessor({
                schema,
                sources: [{ FOO: "bar" }],
            });
            await accessor.init();
            expect(accessor.get("FOO")).toBe("bar");
        });
        test("Should throw UninitializedEnvAccessorError when init method is not called", () => {
            const schema = z.object({ FOO: z.string() });
            const accessor = new EnvAccessor({
                schema,
                sources: [{ FOO: "bar" }],
            });
            expect(() => accessor.get("FOO")).toThrow(
                UninitializedEnvAccessorError,
            );
        });
    });
    describe("method: getOr", () => {
        test("Should return default constant value when field doesnt exists", async () => {
            const schema = z.object({ FOO: z.string().optional() });
            const accessor = new EnvAccessor({ schema, sources: [{}] });
            await accessor.init();
            expect(accessor.getOr("FOO", "default-value")).toBe(
                "default-value",
            );
        });
        test("Should return value when field exists", async () => {
            const schema = z.object({ FOO: z.string() });
            const accessor = new EnvAccessor({
                schema,
                sources: [{ FOO: "bar" }],
            });
            await accessor.init();
            expect(accessor.getOr("FOO", "default-value")).toBe("bar");
        });
        test("Should throw UninitializedEnvAccessorError when init method is not called", () => {
            const schema = z.object({ FOO: z.string() });
            const accessor = new EnvAccessor({
                schema,
                sources: [{ FOO: "bar" }],
            });
            expect(() => accessor.getOr("FOO", "default-value")).toThrow(
                UninitializedEnvAccessorError,
            );
        });
    });
});
