import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { withDispatchAfterFactory } from "@/event-bus/implementations/middlewares/with-dispatch-after-factory/with-dispatch-after-factory.js";
import { use } from "@/middleware/implementations/_module.js";

import type { WithDispatchAfterPayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-after-factory/with-dispatch-after-factory.js";

describe("function: withDispatchAfterFactory", () => {
    const adapter = new NoOpEventBusAdapter();
    const eventDispatcher = new EventBus({
        adapter,
    });
    const withDispatchAfter = withDispatchAfterFactory(eventDispatcher);

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    test("Should dispatch the event with the resolved payload after the wrapped function resolves", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<string> => Promise.resolve("ok"));
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped();

        expect(result).toBe("ok");
        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "42",
        });
    });
    test("Should dispatch the event after the wrapped function resolves", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<void> => Promise.resolve());
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        await wrapped();

        const dispatchOrder = dispatch.mock.invocationCallOrder[0] as number;
        const innerOrder = innerFn.mock.invocationCallOrder[0] as number;
        expect(innerOrder).toBeLessThan(dispatchOrder);
    });
    test("Should not dispatch the event when the wrapped function throws", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<string> => {
            throw new Error("boom");
        });
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped()).rejects.toThrow("boom");

        expect(payload).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
    test("Should resolve an invocable payload with the wrapped function's arguments and return value", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchAfterPayloadSettings<
                    [userId: string],
                    string
                >,
            ) => ({
                userId: `${settings.args[0]}-${settings.returnValue}`,
            }),
        );
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`result-${userId}`),
        );
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("u-7");

        expect(result).toBe("result-u-7");
        expect(payload).toHaveBeenCalledExactlyOnceWith({
            args: ["u-7"],
            returnValue: "result-u-7",
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-7-result-u-7",
        });
    });
    test("Should resolve an invocable object payload with the wrapped function's arguments and return value", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payloadInvoke = vi.fn(
            (
                settings: WithDispatchAfterPayloadSettings<
                    [userId: string],
                    string
                >,
            ) => ({
                userId: `${settings.args[0]}-${settings.returnValue}`,
            }),
        );
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`result-${userId}`),
        );
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload: { invoke: payloadInvoke },
            }),
        );

        await wrapped("u-8");

        expect(payloadInvoke).toHaveBeenCalledExactlyOnceWith({
            args: ["u-8"],
            returnValue: "result-u-8",
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-8-result-u-8",
        });
    });
    test("Should call the payload invocable on every invocation", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchAfterPayloadSettings<
                    [userId: string],
                    string
                >,
            ) => ({
                userId: `${settings.args[0]}-${settings.returnValue}`,
            }),
        );
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`result-${userId}`),
        );
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        await wrapped("u-1");
        await wrapped("u-2");

        expect(payload).toHaveBeenCalledTimes(2);
        expect(payload).toHaveBeenNthCalledWith(1, {
            args: ["u-1"],
            returnValue: "result-u-1",
        });
        expect(payload).toHaveBeenNthCalledWith(2, {
            args: ["u-2"],
            returnValue: "result-u-2",
        });
        expect(dispatch).toHaveBeenNthCalledWith(1, "user.created", {
            userId: "u-1-result-u-1",
        });
        expect(dispatch).toHaveBeenNthCalledWith(2, "user.created", {
            userId: "u-2-result-u-2",
        });
    });
    test("Should not dispatch the event when the payload resolves to null", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                _settings: WithDispatchAfterPayloadSettings<
                    [userId: string],
                    string
                >,
            ): null => null,
        );
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`result-${userId}`),
        );
        const wrapped = use(
            innerFn,
            withDispatchAfter({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("u-9");

        expect(result).toBe("result-u-9");
        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
