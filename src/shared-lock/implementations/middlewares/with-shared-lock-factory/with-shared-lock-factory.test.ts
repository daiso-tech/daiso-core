import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module.js";
import { SharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import {
    SHARED_LOCK_WHEN,
    withSharedLockFactory,
} from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/with-shared-lock-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { SharedLockFactoryCreateSettings } from "@/shared-lock/contracts/_module.js";

describe("function: withSharedLockFactory", () => {
    const sharedLockFactory = new SharedLockFactory({
        adapter: new NoOpSharedLockAdapter(),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("When writer:", () => {
        test("Should call SharedLockFactory.create method", async () => {
            const spy = vi.spyOn(sharedLockFactory, "create");

            const withSharedLock = withSharedLockFactory(sharedLockFactory);

            async function fn(_value: string): Promise<void> {}
            const argValue = "value";
            const limit = 4;
            const settings: SharedLockFactoryCreateSettings = {
                lockId: argValue,
                limit,
                ttl: TimeSpan.fromSeconds(20),
            };
            await use(
                fn,
                withSharedLock({
                    ...settings,
                    key: (value: string) => value,
                    lockId: (value: string) => value,
                    when: SHARED_LOCK_WHEN.WRITER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
        });
        test("Should call SharedLock.run method", async () => {
            const spy = vi.spyOn(SharedLock.prototype, "runWriterOrFail");

            const withSharedLock = withSharedLockFactory(sharedLockFactory);

            async function fn(_value: string): Promise<void> {}
            const argValue = "value";
            const limit = 4;
            await use(
                fn,
                withSharedLock({
                    key: (value: string) => value,
                    limit,
                    when: SHARED_LOCK_WHEN.WRITER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    describe("When reader:", () => {
        test("Should call SharedLockFactory.create method", async () => {
            const spy = vi.spyOn(sharedLockFactory, "create");

            const withSharedLock = withSharedLockFactory(sharedLockFactory);

            async function fn(_value: string): Promise<void> {}
            const argValue = "value";
            const limit = 4;
            const settings: SharedLockFactoryCreateSettings = {
                lockId: argValue,
                ttl: TimeSpan.fromSeconds(20),
                limit,
            };
            await use(
                fn,
                withSharedLock({
                    ...settings,
                    key: (value: string) => value,
                    lockId: (value: string) => value,
                    when: SHARED_LOCK_WHEN.READER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
        });
        test("Should call SharedLock.run method", async () => {
            const spy = vi.spyOn(SharedLock.prototype, "runReaderOrFail");

            const withSharedLock = withSharedLockFactory(sharedLockFactory);

            async function fn(_value: string): Promise<void> {}
            const argValue = "value";
            const limit = 4;
            await use(
                fn,
                withSharedLock({
                    key: (value: string) => value,
                    limit,
                    when: SHARED_LOCK_WHEN.READER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledOnce();
        });
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(sharedLockFactory, "create");

        const withSharedLock = withSharedLockFactory(sharedLockFactory);

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withSharedLock({
                key: (userId: string, postId: string) =>
                    `user:${userId}:post:${postId}`,
                limit: 4,
                when: SHARED_LOCK_WHEN.WRITER,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withSharedLock = withSharedLockFactory(sharedLockFactory);

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withSharedLock({
                key: (a: string, b: string) => `${a}:${b}`,
                limit: 4,
                when: SHARED_LOCK_WHEN.WRITER,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
