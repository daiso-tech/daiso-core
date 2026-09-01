import { beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MemoryCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheSchema } from "@/cache/implementations/derivables/cache/with-cache-schema.js";
import { withPlugin } from "@/middleware/implementations/_module.js";
import { ValidationError } from "@/utilities/_module.js";

describe("function: withCacheSchema", () => {
    let adapter = new MemoryCacheAdapter<string>();
    const passingSchema = z.string();
    const failingSchema = z.string().min(100);

    beforeEach(() => {
        adapter = new MemoryCacheAdapter();
    });

    describe("method: add", () => {
        test("Should store the value when input is valid", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.add("myKey", "validValue", null);

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
        test("Should throw when input validation fails", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.add("myKey", "invalidValue", null),
            ).rejects.toThrow(ValidationError);
            await expect(adapter.get("myKey")).resolves.toBeNull();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.add("myKey", "validValue", null);

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
    });
    describe("method: put", () => {
        test("Should store the value when input is valid", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.put("myKey", "validValue", null);

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
        test("Should throw when input validation fails", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.put("myKey", "invalidValue", null),
            ).rejects.toThrow(ValidationError);
            await expect(adapter.get("myKey")).resolves.toBeNull();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.put("myKey", "validValue", null);

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
    });
    describe("method: update", () => {
        test("Should update the value when input is valid", async () => {
            await adapter.add("myKey", "oldValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.update("myKey", "validValue");

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
        test("Should throw when input validation fails", async () => {
            await adapter.add("myKey", "oldValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.update("myKey", "invalidValue"),
            ).rejects.toThrow(ValidationError);
            await expect(adapter.get("myKey")).resolves.toBe("oldValue");
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            await adapter.add("myKey", "oldValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.update("myKey", "validValue");

            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
    });
    describe("method: get", () => {
        test("Should return the stored value when output is valid", async () => {
            await adapter.add("myKey", "storedValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await expect(enhanced.get("myKey")).resolves.toBe("storedValue");
        });
        test("Should throw when output validation fails", async () => {
            await adapter.add("myKey", "invalidValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(enhanced.get("myKey")).rejects.toThrow(
                ValidationError,
            );
        });
        test("Should pass null through without validation when key is not found", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await expect(enhanced.get("myKey")).resolves.toBeNull();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            await adapter.add("myKey", "someValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await expect(enhanced.get("myKey")).resolves.toBe("someValue");
        });
    });
    describe("method: getAndRemove", () => {
        test("Should return and remove the stored value when output is valid", async () => {
            await adapter.add("myKey", "storedValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await expect(enhanced.getAndRemove("myKey")).resolves.toBe(
                "storedValue",
            );
            await expect(adapter.get("myKey")).resolves.toBeNull();
        });
        test("Should throw when output validation fails", async () => {
            await adapter.add("myKey", "invalidValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(enhanced.getAndRemove("myKey")).rejects.toThrow(
                ValidationError,
            );
        });
        test("Should pass null through without validation when key is not found", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await expect(enhanced.getAndRemove("myKey")).resolves.toBeNull();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            await adapter.add("myKey", "someValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await expect(enhanced.getAndRemove("myKey")).resolves.toBe(
                "someValue",
            );
            await expect(adapter.get("myKey")).resolves.toBeNull();
        });
    });
    describe("method: getOrAdd", () => {
        test("Should return the cached value without invoking the factory", async () => {
            await adapter.add("myKey", "storedValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                () => "new-value",
                null,
            );

            expect(result).toBe("storedValue");
            await expect(adapter.get("myKey")).resolves.toBe("storedValue");
        });
        test("Should throw when output validation fails", async () => {
            await adapter.add("myKey", "invalidValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getOrAdd("myKey", () => "new-value", null),
            ).rejects.toThrow(ValidationError);
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            await adapter.add("myKey", "someValue", null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                () => "new-value",
                null,
            );

            expect(result).toBe("someValue");
        });
        test("Should store and return the factory value when input is valid", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                () => "validValue",
                null,
            );

            expect(result).toBe("validValue");
            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
        test("Should throw when input validation fails", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getOrAdd("myKey", () => "invalidValue", null),
            ).rejects.toThrow(ValidationError);
            await expect(adapter.get("myKey")).resolves.toBeNull();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                () => "validValue",
                null,
            );

            expect(result).toBe("validValue");
            await expect(adapter.get("myKey")).resolves.toBe("validValue");
        });
    });
});
