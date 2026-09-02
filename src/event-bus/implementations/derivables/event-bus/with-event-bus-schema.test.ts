import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { withEventBusSchema } from "@/event-bus/implementations/derivables/event-bus/with-event-bus-schema.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { ValidationError } from "@/utilities/_module.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module.js";

describe("function: withEventBusSchema", () => {
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

            await enhanced.dispatch("user.created", {
                userId: "123",
            });

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >("user.created", {
                userId: "123",
            });
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
                enhanced.dispatch("user.created", {
                    userId: "",
                }),
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

            await enhanced.dispatch("unknown.event", {
                anyData: "anything",
            });

            expect(validateSpy).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >("unknown.event", {
                anyData: "anything",
            });
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

            await enhanced.dispatch("user.created", {
                userId: "123",
            });

            expect(validateSpy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["dispatch"]>
            >("user.created", {
                userId: "123",
            });
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

            await enhanced.addListener("user.created", listener);

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

            await enhanced.addListener("user.created", listener);

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

            await enhanced.addListener("unknown.event", listener);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["addListener"]>
            >("unknown.event", listener);
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

            await enhanced.addListener("user.created", listener);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["addListener"]>
            >("user.created", listener);
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

            await enhanced.removeListener("user.created", listener);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("user.created", listener);
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

            await enhanced.removeListener("unknown.event", listener);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("unknown.event", listener);
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

            await enhanced.removeListener("user.created", listener);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<IEventBusAdapter["removeListener"]>
            >("user.created", listener);
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

            await enhanced.addListener("user.created", listener);
            await enhanced.dispatch("user.created", {
                userId: "123",
            });

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

            await enhanced.addListener("user.created", listener);

            await expect(
                enhanced.dispatch("user.created", {
                    userId: "",
                }),
            ).rejects.toThrow(ValidationError);
            expect(listener).not.toHaveBeenCalled();
        });
    });
});
