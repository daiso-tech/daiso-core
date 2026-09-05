import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { withInvalidationFactory } from "@/cache/implementations/middlewares/with-invalidation-factory/with-invalidation-factory.js";
import { use } from "@/middleware/implementations/_module.js";

describe("function: withInvalidationFactory", () => {
    const cache = new Cache<string>({
        adapter: new NoOpCacheAdapter(),
    });
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    test("Should remove the key derived from the arguments before invoking the wrapped function", async () => {
        const spy = vi.spyOn(cache, "remove");
        const withInvalidation = withInvalidationFactory(cache);
        const innerFn = vi.fn((id: string): Promise<string> => {
            return Promise.resolve(`value-${id}`);
        });

        const wrapped = use(
            innerFn,
            withInvalidation({
                key: (id: string) => `cache:${id}`,
            }),
        );

        const result = await wrapped("42");

        expect(result).toBe("value-42");
        expect(spy).toHaveBeenCalledExactlyOnceWith("cache:42");
        expect(innerFn).toHaveBeenCalledExactlyOnceWith("42");
    });
    test("Should remove the key after calling the wrapped function", async () => {
        const spy = vi.spyOn(cache, "remove");
        const withInvalidation = withInvalidationFactory(cache);
        const innerFn = vi.fn((_id: string): Promise<void> =>
            Promise.resolve(),
        );

        const wrapped = use(
            innerFn,
            withInvalidation({
                key: (id: string) => `cache:${id}`,
            }),
        );

        await wrapped("a");

        expect(spy).toHaveBeenCalledExactlyOnceWith("cache:a");
        expect(innerFn).toHaveBeenCalledExactlyOnceWith("a");
        const removeOrder = spy.mock.invocationCallOrder[0] as number;
        const innerOrder = innerFn.mock.invocationCallOrder[0] as number;
        expect(innerOrder).toBeLessThan(removeOrder);
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(cache, "remove");
        const withInvalidation = withInvalidationFactory(cache);
        const innerFn = vi.fn(
            (_userId: string, _postId: string): Promise<void> =>
                Promise.resolve(),
        );

        const wrapped = use(
            innerFn,
            withInvalidation({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
            }),
        );

        await wrapped("u1", "p2");

        expect(spy).toHaveBeenCalledExactlyOnceWith("user:u1:post:p2");
        expect(innerFn).toHaveBeenCalledExactlyOnceWith("u1", "p2");
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const spy = vi.spyOn(cache, "remove");
        const withInvalidation = withInvalidationFactory(cache);
        const innerFn = vi.fn((a: string, b: string): Promise<string> =>
            Promise.resolve(`${a}-${b}`),
        );

        const wrapped = use(
            innerFn,
            withInvalidation({
                key: (a: string, b: string) => `${a}:${b}`,
            }),
        );

        const result = await wrapped("2", "3");

        expect(result).toBe("2-3");
        expect(spy).toHaveBeenCalledExactlyOnceWith("2:3");
        expect(innerFn).toHaveBeenCalledExactlyOnceWith("2", "3");
    });
});
