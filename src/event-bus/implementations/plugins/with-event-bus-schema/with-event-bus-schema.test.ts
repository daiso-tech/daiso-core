import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusSchema } from "@/event-bus/implementations/plugins/with-event-bus-schema/with-event-bus-schema.js";
import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { ValidationError } from "@/utilities/_module.js";

describe("function: withEventBusSchema", () => {
    const context = new NoOpContext();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const passingSchema = z.object({
        userId: z.string(),
    });
    const failingSchema = z.object({
        userId: z.string().min(100),
    });

    let adapter: IEventBusAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
        adapter = new MemoryEventBusAdapter();
    });

    describe("method: dispatch", () => {
        test("Should validate event data when schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "dispatch");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
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

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );
        });
        test("Should throw ValidationError when dispatch event data validation fails", async () => {
            const validateSpy = vi.spyOn(
                failingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": failingSchema,
                    },
                }),
            );

            await expect(
                enhanced.dispatch(
                    "user.created",
                    {
                        userId: "",
                    },
                    context,
                ),
            ).rejects.toThrow(ValidationError);
            expect(validateSpy).toHaveBeenCalledOnce();
        });
        test("Should pass through without validation when no schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "dispatch");
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
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

            expect(validateSpy).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
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
            const validateSpy = vi.spyOn(
                passingSchema["~standard"],
                "validate",
            );
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
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

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );
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
                        "user.created": passingSchema,
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
            expect(listener).toHaveBeenCalledExactlyOnceWith({
                userId: "456",
            });
        });
        test("Should throw ValidationError in wrapped listener when event data validation fails", async () => {
            const addListenerSpy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": failingSchema,
                    },
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            expect(addListenerSpy).toHaveBeenCalledOnce();
            const wrappedListener = addListenerSpy.mock.calls[0]?.[1];

            // Calling the wrapped listener with invalid data should throw
            await expect(wrappedListener?.({ userId: "" })).rejects.toThrow(
                ValidationError,
            );
            expect(listener).not.toHaveBeenCalled();
        });
        test("Should pass listener through without wrapping when no schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "addListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
                    },
                }),
            );

            await enhanced.addListener("unknown.event", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
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
                        "user.created": passingSchema,
                    },
                    shouldValidateListeners: false,
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["addListener"]>
            >("user.created", listener, context);
        });
    });
    describe("method: removeListener", () => {
        test("Should delegate removeListener when schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "removeListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
                    },
                }),
            );

            await enhanced.removeListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("user.created", listener, context);
        });
        test("Should delegate removeListener when no schema exists for event name", async () => {
            const spy = vi.spyOn(adapter, "removeListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
                    },
                }),
            );

            await enhanced.removeListener("unknown.event", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("unknown.event", listener, context);
        });
        test("Should delegate removeListener when shouldValidateListeners is false", async () => {
            const spy = vi.spyOn(adapter, "removeListener");
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
                    },
                    shouldValidateListeners: false,
                }),
            );

            await enhanced.removeListener("user.created", listener, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("user.created", listener, context);
        });
    });
    describe("integration: dispatch to listeners", () => {
        test("Should deliver validated event data to registered listeners", async () => {
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": passingSchema,
                    },
                }),
            );

            await enhanced.addListener("user.created", listener, context);
            await enhanced.dispatch(
                "user.created",
                {
                    userId: "123",
                },
                context,
            );

            expect(listener).toHaveBeenCalledExactlyOnceWith({
                userId: "123",
            });
        });
        test("Should not deliver event to listeners when dispatch validation fails", async () => {
            const listener = vi.fn();
            const enhanced = withPlugin(
                adapter,
                withEventBusSchema({
                    eventMapSchema: {
                        "user.created": failingSchema,
                    },
                }),
            );

            await enhanced.addListener("user.created", listener, context);

            await expect(
                enhanced.dispatch(
                    "user.created",
                    {
                        userId: "",
                    },
                    context,
                ),
            ).rejects.toThrow(ValidationError);
            expect(listener).not.toHaveBeenCalled();
        });
    });
});
