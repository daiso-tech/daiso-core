/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ISharedLockFactoryBase } from "@/shared-lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * Constants that specify whether the middleware should acquire the shared lock
 * in **reader** mode (concurrent readers allowed) or **writer** mode
 * (exclusive access).
 *
 * @group Middleware
 */
export const SHARED_LOCK_WHEN = {
    READER: "READER",
    WRITER: "WRITER",
} as const;

/**
 * Union type of the possible values for the `when` setting.
 *
 * @see {@link SHARED_LOCK_WHEN}
 * @group Middleware
 */
export type SharedLockWhenSetting =
    (typeof SHARED_LOCK_WHEN)[keyof typeof SHARED_LOCK_WHEN];

/**
 * Settings for the distributed shared-lock middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @group Middleware
 */
export type WithSharedLockFactorySettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * A function or static value that produces the lock key from the wrapped
     * function's arguments. All consumers using the same key share the same
     * lock state.
     *
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
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
     * automatically. If omitted the default TTL of the shared-lock factory is
     * used.
     */
    ttl?: ITimeSpan | null;

    /**
     * Maximum number of concurrent readers allowed when the lock is acquired
     * in reader mode.
     */
    limit: number;

    /**
     * Whether to acquire the lock in **reader** or **writer** mode.
     *
     * - `"READER"` — multiple readers can hold the lock concurrently.
     * - `"WRITER"` — exclusive access; no other reader or writer can hold
     *   the lock.
     *
     * @see {@link SHARED_LOCK_WHEN}
     */
    when: SharedLockWhenSetting;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * shared lock (reader-writer lock).
 *
 * When the `when` setting is `"READER"` multiple callers can execute the
 * wrapped function concurrently. When `"WRITER"` the caller gets exclusive
 * access — no other reader or writer can hold the lock at the same time.
 *
 * @param sharedLockFactory - The shared-lock factory to use.
 * @returns A function that accepts {@link WithSharedLockFactorySettings} and
 *          returns a middleware.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/middlewares"`
 * @group Middleware
 */
export function withSharedLockFactory(
    sharedLockFactory: ISharedLockFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithSharedLockFactorySettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const {
            key = (...args) => JSON.stringify(args),
            lockId = () => v4(),
            when,
            ...rest
        } = settings;
        return ({ next, args }) => {
            if (when === SHARED_LOCK_WHEN.READER) {
                return sharedLockFactory
                    .create(callInvokable(key, ...args), {
                        ...rest,
                        lockId: callInvokable(lockId, ...args),
                    })
                    .runReaderOrFail(next);
            }
            return sharedLockFactory
                .create(callInvokable(key, ...args), {
                    ...rest,
                    lockId: callInvokable(lockId, ...args),
                })
                .runWriterOrFail(next);
        };
    };
}
