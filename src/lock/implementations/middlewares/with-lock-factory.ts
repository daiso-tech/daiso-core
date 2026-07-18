/**
 * @module Lock
 */

import { v4 } from "uuid";

import { type ILockFactoryBase } from "@/lock/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * Settings for the distributed-lock middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @group Middleware
 */
export type WithLockSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * A function or static value that produces the lock key from the wrapped
     * function's arguments. The lock is acquired on this key, ensuring mutual
     * exclusion across processes for the same key.
     */
    key: Invokable<TParameters, string>;

    /**
     * A function or static value that produces a unique identifier for the
     * current lock acquisition attempt. The lock ID distinguishes competing
     * consumers trying to acquire the same lock.
     *
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     * ```
     */
    lockId?: Invokable<TParameters, string>;

    /**
     * Time-to-live for the lock. If `null` the lock never expires
     * automatically. If omitted the default TTL of the lock factory is used.
     */
    ttl?: ITimeSpan | null;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * lock.
 *
 * Before executing the wrapped function a lock is acquired on the derived key.
 * If another process already holds the lock the call waits (or fails
 * immediately for non-blocking locks) until the lock is released.
 *
 * @param lockFactory - The lock factory to use.
 * @returns A function that accepts {@link WithLockSettings} and returns a
 *          middleware.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/middlewares"`
 * @group Middleware
 */
export function withLockFactory(lockFactory: ILockFactoryBase) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithLockSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const {
            key = (...args) => JSON.stringify(args),
            lockId = () => v4(),
            ...rest
        } = settings;
        return ({ next, args }) => {
            return lockFactory
                .create(callInvokable(key, ...args), {
                    ...rest,
                    lockId: callInvokable(lockId, ...args),
                })
                .runOrFail(next);
        };
    };
}
