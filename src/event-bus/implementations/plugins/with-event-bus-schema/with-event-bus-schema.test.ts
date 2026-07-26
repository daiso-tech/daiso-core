import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusSchema } from "@/event-bus/implementations/plugins/with-event-bus-schema/with-event-bus-schema.js";
import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withEventBusSchema", () => {
    const context = new Context(new Map());
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const adapter = new NoOpEventBusAdapter();

    describe("method: dispatch", () => {
        test("Should validate event data when schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "dispatch");
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await enhanced.dispatch(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );
        });
        test("Should throw when dispatch event data validation fails", async () => {
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await expect(
                enhanced.dispatch(
                    "user.created",
                    {
                        userId: 123,
                    },
                    context,
                ),
            ).rejects.toThrow();
        });
        test("Should pass through without validation when no schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "dispatch");
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await enhanced.dispatch(
                "unknown.event",
                {
                    anyData: "anything",
                },
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                "unknown.event",
                {
                    anyData: "anything",
                },
                context,
            );
        });
        test("Should still validate dispatch when shouldValidateListeners is false", async () => {
            const spy = vi.spyOn(adapter, "dispatch");
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                    shouldValidateListeners: false,
                }),
            );

            await enhanced.dispatch(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("method: addListener", () => {
        test("Should wrap listener to validate event data when schema exists", async () => {
            const addListenerSpy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            expect(addListenerSpy).toHaveBeenCalledOnce();
            const wrappedListener = addListenerSpy.mock.calls[0]?.[1];

            // Calling the wrapped listener with valid data should succeed
            await expect(
                wrappedListener?.({ userId: "456" }),
            ).resolves.not.toThrow();
            expect(listener).toHaveBeenCalledOnce();
            expect(listener).toHaveBeenCalledWith({ userId: "456" });
        });
        test("Should throw in wrapped listener when event data validation fails", async () => {
            const addListenerSpy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            expect(addListenerSpy).toHaveBeenCalledOnce();
            const wrappedListener = addListenerSpy.mock.calls[0]?.[1];

            // Calling the wrapped listener with invalid data should throw
            await expect(wrappedListener?.({ userId: 123 })).rejects.toThrow();
            expect(listener).not.toHaveBeenCalled();
        });
        test("Should pass listener through without wrapping when no schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                }),
            );

            await enhanced.addListener("unknown.event", listener, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<IEventBusAdapter["addListener"]>
            >("unknown.event", listener, context);
        });
        test("Should skip listener wrapping when shouldValidateListeners is false", async () => {
            const spy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": z.object({
                            userId: z.string(),
                        }),
                    },
                    shouldValidateListeners: false,
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<IEventBusAdapter["addListener"]>
            >("user.created", listener, context);
        });
    });
});
