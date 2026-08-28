/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { withSemaphoreFactory } from "@/semaphore/implementations/middlewares/with-semaphore/with-semaphore-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { SemaphoreFactoryCreateSettings } from "@/semaphore/contracts/_module.js";

describe("function: withSemaphoreFactory", () => {
    const semaphoreFactory = new SemaphoreFactory({
        adapter: new NoOpSemaphoreAdapter(),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call SemaphoreFactory.create method", async () => {
        const spy = vi.spyOn(semaphoreFactory, "create");

        const withSemaphore = withSemaphoreFactory(semaphoreFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const limit = 4;
        const settings: SemaphoreFactoryCreateSettings = {
            slotId: argValue,
            ttl: TimeSpan.fromSeconds(20),
            limit,
        };
        await use(
            fn,
            withSemaphore({
                ...settings,
                key: (value: string) => value,
                slotId: (value: string) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
    });
    test("Should call Semaphore.run method", async () => {
        const spy = vi.spyOn(Semaphore.prototype, "runOrFail");

        const withSemaphore = withSemaphoreFactory(semaphoreFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const limit = 4;
        await use(
            fn,
            withSemaphore({
                key: (value: string) => value,
                limit,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(semaphoreFactory, "create");

        const withSemaphore = withSemaphoreFactory(semaphoreFactory);

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withSemaphore({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
                limit: 4,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withSemaphore = withSemaphoreFactory(semaphoreFactory);

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withSemaphore({
                key: (a: string, b: string) => `${a}:${b}`,
                limit: 4,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
