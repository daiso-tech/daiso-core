import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { withRateLimiterFactory } from "@/rate-limiter/implementations/middlewares/with-rate-limiter/with-rate-limiter-factory.js";

import type { RateLimiterFactoryCreateSettings } from "@/rate-limiter/contracts/_module.js";

describe("function: withRateLimiterFactory", () => {
    const rateLimiterFactory = new RateLimiterFactory({
        adapter: new NoOpRateLimiterAdapter(),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call RateLimiterFactory.create method", async () => {
        const spy = vi.spyOn(rateLimiterFactory, "create");

        const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const limit = 4;
        const settings: RateLimiterFactoryCreateSettings = {
            errorPolicy: Error,
            limit,
            onlyError: true,
        };
        await use(
            fn,
            withRateLimiter({
                ...settings,
                key: (value: string) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(key, settings);
    });
    test("Should call RateLimiter.run method", async () => {
        const spy = vi.spyOn(RateLimiter.prototype, "runOrFail");

        const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const limit = 4;
        await use(
            fn,
            withRateLimiter({
                key: (value: string) => value,
                limit,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(rateLimiterFactory, "create");

        const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withRateLimiter({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
                limit: 4,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withRateLimiter({
                key: (a: string, b: string) => `${a}:${b}`,
                limit: 4,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
