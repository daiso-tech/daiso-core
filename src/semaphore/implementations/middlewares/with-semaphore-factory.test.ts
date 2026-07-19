/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { type SemaphoreFactoryCreateSettings } from "@/semaphore/contracts/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { withSemaphoreFactory } from "@/semaphore/implementations/middlewares/with-semaphore-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withSemaphoreFactory", () => {
    let semaphoreFactory: SemaphoreFactory;

    beforeEach(() => {
        semaphoreFactory = new SemaphoreFactory({
            adapter: new NoOpSemaphoreAdapter(),
        });
    });
    afterEach(() => {
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
                key: (value) => value,
                slotId: (value) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(argValue, settings);
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
                key: (value) => value,
                limit,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
});
