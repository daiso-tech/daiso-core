/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { type MiddlewareFn } from "@/middleware/types.js";
import { type ISharedLockFactoryBase } from "@/shared-lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export const SHARED_LOCK_WHEN = {
    READER: "READER",
    WRITER: "WRITER",
} as const;

export type SharedLockWhenSetting =
    (typeof SHARED_LOCK_WHEN)[keyof typeof SHARED_LOCK_WHEN];

/**
 * @group Middleware
 */
export type SharedLockMiddlewareSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
     */
    key?: Invokable<TParameters, string>;

    /**
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     * ```
     */
    lockId?: Invokable<TParameters, string>;

    ttl?: ITimeSpan | null;

    limit: number;

    when: SharedLockWhenSetting;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/middlewares"`
 * @group Middleware
 */
export function sharedLockMiddlewareFactory(
    sharedLockFactory: ISharedLockFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: SharedLockMiddlewareSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const {
            key = (...args) => JSON.stringify(args),
            lockId = () => v4(),
            ...rest
        } = settings;
        return ({ next, args }) => {
            if (settings.when === SHARED_LOCK_WHEN.READER) {
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
