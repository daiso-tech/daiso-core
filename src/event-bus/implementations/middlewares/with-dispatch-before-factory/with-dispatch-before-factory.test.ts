import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { withDispatchBeforeFactory } from "@/event-bus/implementations/middlewares/with-dispatch-before-factory/with-dispatch-before-factory.js";
import { use } from "@/middleware/implementations/_module.js";

import type { WithDispatchBeforePayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-before-factory/with-dispatch-before-factory.js";

describe("function: withDispatchBeforeFactory", () => {
    const adapter = new NoOpEventBusAdapter();
    const eventDispatcher = new EventBus({
        adapter,
    });
    const withDispatchBefore = withDispatchBeforeFactory(eventDispatcher);

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    test("Should dispatch the event with the resolved payload before invoking the wrapped function", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<string> =>
            Promise.resolve("ok"),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("42");

        expect(result).toBe("ok");
        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "42",
        });
        expect(innerFn).toHaveBeenCalledOnce();
    });
    test("Should dispatch the event before the wrapped function executes", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        await wrapped("42");

        const dispatchOrder = dispatch.mock.invocationCallOrder[0] as number;
        const innerOrder = innerFn.mock.invocationCallOrder[0] as number;
        expect(dispatchOrder).toBeLessThan(innerOrder);
    });
    test("Should dispatch the event even when the wrapped function throws", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<string> => {
            throw new Error("boom");
        });
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped("42")).rejects.toThrow("boom");

        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "42",
        });
    });
    test("Should resolve an invocable payload with the wrapped function's arguments", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        await wrapped("u-7");

        expect(payload).toHaveBeenCalledExactlyOnceWith({
            args: ["u-7"],
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-7",
        });
    });
    test("Should resolve an invocable object payload with the wrapped function's arguments", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payloadInvoke = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload: { invoke: payloadInvoke },
            }),
        );

        await wrapped("u-8");

        expect(payloadInvoke).toHaveBeenCalledExactlyOnceWith({
            args: ["u-8"],
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-8",
        });
    });
    test("Should call the payload invocable on every invocation", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        await wrapped("u-1");
        await wrapped("u-2");

        expect(payload).toHaveBeenCalledTimes(2);
        expect(payload).toHaveBeenNthCalledWith(1, { args: ["u-1"] });
        expect(payload).toHaveBeenNthCalledWith(2, { args: ["u-2"] });
        expect(dispatch).toHaveBeenNthCalledWith(1, "user.created", {
            userId: "u-1",
        });
        expect(dispatch).toHaveBeenNthCalledWith(2, "user.created", {
            userId: "u-2",
        });
    });
    test("Should not dispatch the event when the payload resolves to null", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                _settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ): null => null,
        );
        const innerFn = vi.fn((_userId: string): Promise<string> =>
            Promise.resolve("ok"),
        );
        const wrapped = use(
            innerFn,
            withDispatchBefore({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("42");

        expect(result).toBe("ok");
        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).not.toHaveBeenCalled();
        expect(innerFn).toHaveBeenCalledOnce();
    });
});
