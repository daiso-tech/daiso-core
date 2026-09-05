import { beforeEach, describe, expect, test, vi } from "vitest";

import { CIRCUIT_BREAKER_TRIGGER } from "@/circuit-breaker/contracts/_module.js";
import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/_module.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import { CircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { withCircuitBreakerFactory } from "@/circuit-breaker/implementations/middlewares/with-circuit-breaker-factory/with-circuit-breaker-factory.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { CircuitBreakerFactoryCreateSettings } from "@/circuit-breaker/contracts/_module.js";

describe("function: withCircuitBreakerFactory", () => {
    const circuitBreakerFactory = new CircuitBreakerFactory({
        adapter: new NoOpCircuitBreakerAdapter(),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call CircuitBreakerFactory.create method", async () => {
        const spy = vi.spyOn(circuitBreakerFactory, "create");

        const withCircuitBreaker = withCircuitBreakerFactory(
            circuitBreakerFactory,
        );

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const settings: CircuitBreakerFactoryCreateSettings = {
            errorPolicy: Error,
            slowCallTime: TimeSpan.fromMinutes(1),
            trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
        };
        await use(
            fn,
            withCircuitBreaker({
                ...settings,
                key: (value: string) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(key, settings);
    });
    test("Should call CircuitBreaker.run method", async () => {
        const spy = vi.spyOn(CircuitBreaker.prototype, "runOrFail");

        const withCircuitBreaker = withCircuitBreakerFactory(
            circuitBreakerFactory,
        );

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        await use(
            fn,
            withCircuitBreaker({
                key: (value: string) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(circuitBreakerFactory, "create");

        const withCircuitBreaker = withCircuitBreakerFactory(
            circuitBreakerFactory,
        );

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withCircuitBreaker({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withCircuitBreaker = withCircuitBreakerFactory(
            circuitBreakerFactory,
        );

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withCircuitBreaker({
                key: (a: string, b: string) => `${a}:${b}`,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
