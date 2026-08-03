import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import {
    type RateLimiterFactoryCreateSettings,
    type IRateLimiterFactory,
} from "@/rate-limiter/contracts/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { withRateLimiterFactory } from "@/rate-limiter/implementations/middlewares/with-rate-limiter/with-rate-limiter-factory.js";

describe("function: withRateLimiterFactory", () => {
    let rateLimiterFactory: IRateLimiterFactory;

    beforeEach(() => {
        rateLimiterFactory = new RateLimiterFactory({
            adapter: new NoOpRateLimiterAdapter(),
        });
    });
    afterEach(() => {
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
});
