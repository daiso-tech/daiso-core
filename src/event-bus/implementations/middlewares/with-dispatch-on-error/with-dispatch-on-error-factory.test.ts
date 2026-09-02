import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { withDispatchOnErrorFactory } from "@/event-bus/implementations/middlewares/with-dispatch-on-error/with-dispatch-on-error-factory.js";
import { use } from "@/middleware/implementations/_module.js";

import type { WithDispatchOnErrorPayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-on-error/with-dispatch-on-error-factory.js";

describe("function: withDispatchOnErrorFactory", () => {
    const adapter = new NoOpEventBusAdapter();
    const eventDispatcher = new EventBus({
        adapter,
    });
    const withDispatchOnError = withDispatchOnErrorFactory(eventDispatcher);

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    test("Should dispatch the event with the resolved payload when the wrapped function throws", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<string> => {
            throw new Error("boom");
        });
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped()).rejects.toThrow("boom");

        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "42",
        });
    });
    test("Should re-throw the error thrown by the wrapped function", async () => {
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<string> => {
            throw new Error("critical failure");
        });
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped()).rejects.toThrow("critical failure");
    });
    test("Should not dispatch the event when the wrapped function succeeds", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((): Promise<string> => Promise.resolve("ok"));
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped();

        expect(result).toBe("ok");
        expect(payload).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
    test("Should return the wrapped function's result on success", async () => {
        const payload = vi.fn(() => ({ userId: "42" }));
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`user-${userId}`),
        );
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("abc");

        expect(result).toBe("user-abc");
    });
    test("Should resolve an invocable payload with the wrapped function's arguments and error", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchOnErrorPayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const error = new Error("fail");
        const innerFn = vi.fn((_userId: string): Promise<null> =>
            Promise.reject(error),
        );
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped("u-7")).rejects.toThrow("fail");

        expect(payload).toHaveBeenCalledExactlyOnceWith({
            args: ["u-7"],
            error,
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-7",
        });
    });
    test("Should resolve an invocable object payload with the wrapped function's arguments and error", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payloadInvoke = vi.fn(
            (
                settings: WithDispatchOnErrorPayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const error = new Error("fail");
        const innerFn = vi.fn((_userId: string): Promise<null> =>
            Promise.reject(error),
        );
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload: { invoke: payloadInvoke },
            }),
        );

        await expect(wrapped("u-8")).rejects.toThrow("fail");

        expect(payloadInvoke).toHaveBeenCalledExactlyOnceWith({
            args: ["u-8"],
            error,
        });
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-8",
        });
    });
    test("Should call the payload invocable on every error", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                settings: WithDispatchOnErrorPayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const firstError = new Error("first failure");
        const secondError = new Error("second failure");
        const innerFn = vi
            .fn((_userId: string): Promise<null> => Promise.reject(secondError))
            .mockImplementationOnce((_userId: string): Promise<null> =>
                Promise.reject(firstError),
            );
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped("u-1")).rejects.toThrow("first failure");
        await expect(wrapped("u-2")).rejects.toThrow("second failure");

        expect(payload).toHaveBeenCalledTimes(2);
        expect(payload).toHaveBeenNthCalledWith(1, {
            args: ["u-1"],
            error: firstError,
        });
        expect(payload).toHaveBeenNthCalledWith(2, {
            args: ["u-2"],
            error: secondError,
        });
        expect(dispatch).toHaveBeenNthCalledWith(1, "user.created", {
            userId: "u-1",
        });
        expect(dispatch).toHaveBeenNthCalledWith(2, "user.created", {
            userId: "u-2",
        });
    });
    test("Should re-throw the error without dispatching when the payload resolves to null", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");
        const payload = vi.fn(
            (
                _settings: WithDispatchOnErrorPayloadSettings<[userId: string]>,
            ): null => null,
        );
        const innerFn = vi.fn((_userId: string): Promise<string> => {
            throw new Error("boom");
        });
        const wrapped = use(
            innerFn,
            withDispatchOnError({
                type: "user.created",
                payload,
            }),
        );

        await expect(wrapped("fakeUserId")).rejects.toThrow("boom");

        expect(payload).toHaveBeenCalledOnce();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
