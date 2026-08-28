/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { callInvocable } from "@/utilities/_module.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { ISemaphoreFactory } from "@/semaphore/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * Settings for the distributed-semaphore middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export type WithSemaphoreSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     *  A function that produces the semaphore key from the
     * wrapped function's arguments. All consumers using the same key share
     * the same semaphore limit.
     */
    key: Invocable<TParameters, string>;

    /**
     *  A function that produces a unique slot identifier for
     * the current acquisition attempt. Each concurrent consumer needs a
     * distinct slot ID.
     *
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     * ```
     */
    slotId?: Invocable<TParameters, string>;

    /**
     * Time-to-live for each acquired slot. If `null` slots never expire
     * automatically. If omitted the default TTL of the semaphore factory is
     * used.
     */
    ttl?: ITimeSpan | null;

    /**
     * Maximum number of concurrent slots (consumers) allowed for the
     * semaphore key.
     */
    limit: number;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * semaphore.
 *
 * Before executing the wrapped function a slot is acquired on the derived
 * key. If the maximum number of concurrent slots (`limit`) has already been
 * reached the call waits (or fails immediately for non-blocking semaphores)
 * until a slot becomes available.
 *
 * @param semaphoreFactory - The semaphore factory to use.
 * @returns A function that accepts {@link WithSemaphoreSettings} and returns a
 *          middleware.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export function withSemaphoreFactory(semaphoreFactory: ISemaphoreFactory) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithSemaphoreSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key, slotId = () => v4(), ...rest } = settings;
        return ({ next, args }) => {
            return semaphoreFactory
                .create(callInvocable(key, ...args), {
                    ...rest,
                    slotId: callInvocable(slotId, ...args),
                })
                .runOrFail(next);
        };
    };
}
