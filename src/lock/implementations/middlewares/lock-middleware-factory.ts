/**
 * @module Lock
 */

import { v4 } from "uuid";

import { type ILockFactoryBase } from "@/lock/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type LockMiddlewareSettings<
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
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/middlewares"`
 * @group Middleware
 */
export function lockMiddlewareFactory(lockFactory: ILockFactoryBase) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: LockMiddlewareSettings<TParameters>,
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
