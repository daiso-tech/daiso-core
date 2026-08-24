import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheSchema } from "@/cache/implementations/plugins/with-cache-schema/with-cache-schema.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { ValidationError } from "@/utilities/_module.js";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";

describe("function: withCacheSchema", () => {
    const context = new NoOpContext();
    const adapter = new NoOpCacheAdapter<string>();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const passingSchema = z.string();
    const failingSchema = z.string().min(100);

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: add", () => {
        test("Should validate input", async () => {
            const spy = vi.spyOn(adapter, "add");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.add(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );
        });
        test("Should throw when input validation fails", async () => {
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.add(
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5).toEndDate(),
                    context,
                ),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const spy = vi.spyOn(adapter, "add");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.add(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: put", () => {
        test("Should validate input", async () => {
            const spy = vi.spyOn(adapter, "put");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.put(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );
        });
        test("Should throw when input validation fails", async () => {
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.put(
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5).toEndDate(),
                    context,
                ),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const spy = vi.spyOn(adapter, "put");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.put(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: update", () => {
        test("Should validate input", async () => {
            const spy = vi.spyOn(adapter, "update");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.update("myKey", "validValue", context);

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["update"]>
            >("myKey", "validValue", context);
        });
        test("Should throw when input validation fails", async () => {
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.update("myKey", "invalidValue", context),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const spy = vi.spyOn(adapter, "update");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.update("myKey", "validValue", context);

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: get", () => {
        test("Should validate output", async () => {
            vi.spyOn(adapter, "get").mockResolvedValue("storedValue");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.get("myKey", context);

            expect(result).toBe("storedValue");
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should throw when output validation fails", async () => {
            vi.spyOn(adapter, "get").mockResolvedValue("invalidValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(enhanced.get("myKey", context)).rejects.toThrow(
                ValidationError,
            );
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should pass null through without validation when key is not found", async () => {
            vi.spyOn(adapter, "get").mockResolvedValue(null);
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.get("myKey", context);

            expect(result).toBeNull();
            expect(validateSpy).not.toHaveBeenCalled();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            vi.spyOn(adapter, "get").mockResolvedValue("someValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.get("myKey", context);

            expect(result).toBe("someValue");
            expect(validateSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: getAndRemove", () => {
        test("Should validate output", async () => {
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("storedValue");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getAndRemove("myKey", context);

            expect(result).toBe("storedValue");
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should throw when output validation fails", async () => {
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("invalidValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getAndRemove("myKey", context),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should pass null through without validation when key is not found", async () => {
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue(null);
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getAndRemove("myKey", context);

            expect(result).toBeNull();
            expect(validateSpy).not.toHaveBeenCalled();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("someValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.getAndRemove("myKey", context);

            expect(result).toBe("someValue");
            expect(validateSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: getOrAdd", () => {
        test("Should validate output", async () => {
            vi.spyOn(adapter, "getOrAdd").mockResolvedValue("storedValue");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                "new-value",
                null,
                context,
            );

            expect(result).toBe("storedValue");
            expect(validateSpy).toHaveBeenCalledTimes(2);
        });
        test("Should throw when output validation fails", async () => {
            vi.spyOn(adapter, "getOrAdd").mockResolvedValue("invalidValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getOrAdd("myKey", "new-value", null, context),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should skip output validation when shouldValidateOutput is false and input value is valid", async () => {
            vi.spyOn(adapter, "getOrAdd").mockResolvedValue("someValue");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.getOrAdd(
                "myKey",
                "new-value",
                null,
                context,
            );

            expect(result).toBe("someValue");
            expect(validateSpy).toHaveBeenCalledTimes(1);
        });
        test("Should skip output validation when shouldValidateOutput is false and input value is not valid", async () => {
            vi.spyOn(adapter, "getOrAdd").mockResolvedValue("someValue");
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = enhanced.getOrAdd(
                "myKey",
                "new-value",
                null,
                context,
            );

            await expect(result).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should validate input", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.getOrAdd(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveReturnedTimes(2);
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["getOrAdd"]>
            >(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );
        });
        test("Should throw when input validation fails", async () => {
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getOrAdd(
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5).toEndDate(),
                    context,
                ),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveReturnedTimes(1);
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const spy = vi.spyOn(adapter, "getOrAdd");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.getOrAdd(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5).toEndDate(),
                context,
            );

            expect(validateSpy).toHaveReturnedTimes(1);
            expect(spy).toHaveBeenCalledOnce();
        });
    });
});
