/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { LockFactory } from "@/lock/implementations/derivables/_module.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { withLockFactory } from "@/lock/implementations/middlewares/with-lock-factory/with-lock-factory.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { LockFactoryCreateSettings } from "@/lock/contracts/_module.js";

describe("function: withLockFactory", () => {
    const lockFactory = new LockFactory({
        adapter: new NoOpLockAdapter(),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call LockFactory.create method", async () => {
        const spy = vi.spyOn(lockFactory, "create");

        const withLock = withLockFactory(lockFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const settings: LockFactoryCreateSettings = {
            lockId: argValue,
            ttl: TimeSpan.fromSeconds(20),
        };
        await use(
            fn,
            withLock({
                ...settings,
                key: (value: string) => value,
                lockId: (value: string) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
    });
    test("Should call Lock.run method", async () => {
        const spy = vi.spyOn(Lock.prototype, "runOrFail");

        const withLock = withLockFactory(lockFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        await use(
            fn,
            withLock({
                key: (value: string) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(lockFactory, "create");

        const withLock = withLockFactory(lockFactory);

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withLock({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withLock = withLockFactory(lockFactory);

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withLock({
                key: (a: string, b: string) => `${a}:${b}`,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
