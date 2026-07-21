import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { withCacheSchema } from "@/cache/implementations/plugins/with-cache-schema/with-cache-schema.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheSchema", () => {
    const context = new Context(new Map());
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
                context,
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(
                context,
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
            );
        });

        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.add(
                    context,
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5),
                ),
            ).rejects.toThrow();
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
                context,
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(
                context,
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
            );
        });

        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.put(
                    context,
                    "myKey",
                    "invalidValue",
                    TimeSpan.fromMinutes(5),
                ),
            ).rejects.toThrow();
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

            await enhanced.update(context, "myKey", "validValue");

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(context, "myKey", "validValue");
        });

        test("Should throw when input validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(
                enhanced.update(context, "myKey", "invalidValue"),
            ).rejects.toThrow();
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

            const result = await enhanced.get(context, "myKey");

            expect(result).toBe("storedValue");
        });

        test("Should throw when output validation fails", async () => {
            const adapter = new NoOpCacheAdapter<string>();
            vi.spyOn(adapter, "get").mockResolvedValue("invalidValue");
            const enhanced = withPlugin(
                adapter,
                withCacheSchema({ schema: failingSchema }),
            );

            await expect(enhanced.get(context, "myKey")).rejects.toThrow();
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

            const result = await enhanced.getAndRemove(context, "myKey");

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
                enhanced.getAndRemove(context, "myKey"),
            ).rejects.toThrow();
        });
    });

    describe("options", () => {
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

            const result = await enhanced.get(context, "myKey");

            expect(result).toBe("someValue");
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
                context,
                "myKey",
                "validValue",
                TimeSpan.fromMinutes(5),
            );

            expect(spy).toHaveBeenCalledOnce();
        });
    });
});
