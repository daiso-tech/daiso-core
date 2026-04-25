/**
 * @module Lock
 */

import { type ILockFactoryBase } from "@/lock/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/types.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type LockMiddlewareSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    key: InvokableFn<TParameters, string>;
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
        return ({ next, args }) => {
            return lockFactory
                .create(settings.key(...args), settings)
                .runOrFail(next);
        };
    };
}
