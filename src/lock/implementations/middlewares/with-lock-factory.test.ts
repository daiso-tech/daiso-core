/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type LockFactoryCreateSettings } from "@/lock/contracts/_module.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { LockFactory } from "@/lock/implementations/derivables/_module.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { withLockFactory } from "@/lock/implementations/middlewares/with-lock-factory.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withLockFactory", () => {
    let lockFactory: LockFactory;

    beforeEach(() => {
        lockFactory = new LockFactory({
            adapter: new NoOpLockAdapter(),
        });
    });
    afterEach(() => {
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
                key: (value) => value,
                lockId: (value) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(argValue, settings);
    });
    test("Should call Lock.run method", async () => {
        const spy = vi.spyOn(Lock.prototype, "runOrFail");

        const withLock = withLockFactory(lockFactory);

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        await use(
            fn,
            withLock({
                key: (value) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
});
