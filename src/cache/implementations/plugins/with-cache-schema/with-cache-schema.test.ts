import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheSchema } from "@/cache/implementations/plugins/with-cache-schema/with-cache-schema.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheSchema", () => {
    const noOpContext = new NoOpContext();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const passingSchema = z.string();
    const failingSchema = z.string().min(100);

    describe("method: add", () => {
        test("Should validate input", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.add(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["add"]>
            >("myKey", "validValue", TimeSpan.fromMinutes(5), noOpContext);
        });
        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.add(
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5),
                    noOpContext,
                ),
            ).rejects.toThrow();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "add");
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
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: put", () => {
        test("Should validate input", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.put(
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["put"]>
            >("myKey", "validValue", TimeSpan.fromMinutes(5), noOpContext);
        });
        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.put(
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5),
                    noOpContext,
                ),
            ).rejects.toThrow();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "put");
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
                TimeSpan.fromMinutes(5),
                noOpContext,
            );

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: update", () => {
        test("Should validate input", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "update");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            await enhanced.update("myKey", "validValue", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ICacheAdapter["update"]>
            >("myKey", "validValue", noOpContext);
        });
        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.update("myKey", "invalidValue", noOpContext),
            ).rejects.toThrow();
        });
        test("Should still validate input when shouldValidateOutput is false", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const spy = vi.spyOn(adapter, "update");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: passingSchema,
                    shouldValidateOutput: false,
                }),
            );

            await enhanced.update("myKey", "validValue", noOpContext);

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: get", () => {
        test("Should validate output", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "get").mockResolvedValue("storedValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.get("myKey", noOpContext);

            expect(result).toBe("storedValue");
        });
        test("Should throw when output validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "get").mockResolvedValue("invalidValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(enhanced.get("myKey", noOpContext)).rejects.toThrow();
        });
        test("Should pass null through without validation when key is not found", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "get").mockResolvedValue(null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.get("myKey", noOpContext);

            expect(result).toBeNull();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "get").mockResolvedValue("someValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.get("myKey", noOpContext);

            expect(result).toBe("someValue");
        });
    });

    describe("method: getAndRemove", () => {
        test("Should validate output", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("storedValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getAndRemove("myKey", noOpContext);

            expect(result).toBe("storedValue");
        });
        test("Should throw when output validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("invalidValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.getAndRemove("myKey", noOpContext),
            ).rejects.toThrow();
        });
        test("Should pass null through without validation when key is not found", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue(null);
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: passingSchema }),
            );

            const result = await enhanced.getAndRemove("myKey", noOpContext);

            expect(result).toBeNull();
        });
        test("Should skip output validation when shouldValidateOutput is false", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "getAndRemove").mockResolvedValue("someValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({
                    schema: failingSchema,
                    shouldValidateOutput: false,
                }),
            );

            const result = await enhanced.getAndRemove("myKey", noOpContext);

            expect(result).toBe("someValue");
        });
    });
});
