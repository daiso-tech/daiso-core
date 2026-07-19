/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useFactory } from "@/middleware/implementations/_module.js";
import { type SharedLockFactoryCreateSettings } from "@/shared-lock/contracts/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module.js";
import { SharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import {
    SHARED_LOCK_WHEN,
    withSharedLockFactory,
} from "@/shared-lock/implementations/middlewares/with-shared-lock-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withSharedLockFactory", () => {
    let sharedLockFactory: SharedLockFactory;
    const use = useFactory();

    beforeEach(() => {
        sharedLockFactory = new SharedLockFactory({
            adapter: new NoOpSharedLockAdapter(),
        });
    });
    afterEach(() => {
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
                    key: (value) => value,
                    lockId: (value) => value,
                    when: SHARED_LOCK_WHEN.WRITER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(argValue, settings);
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
                    key: (value) => value,
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
                    key: (value) => value,
                    lockId: (value) => value,
                    when: SHARED_LOCK_WHEN.READER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith(argValue, settings);
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
                    key: (value) => value,
                    limit,
                    when: SHARED_LOCK_WHEN.READER,
                }),
            )(argValue);

            expect(spy).toHaveBeenCalledOnce();
        });
    });
});
