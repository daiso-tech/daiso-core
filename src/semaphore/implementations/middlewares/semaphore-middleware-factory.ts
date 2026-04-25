/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { type MiddlewareFn } from "@/middleware/types.js";
import { type ISemaphoreFactoryBase } from "@/semaphore/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type SemaphoreMiddlewareSettings<
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
    slotId?: Invokable<TParameters, string>;

    ttl?: ITimeSpan | null;

    limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/middlewares"`
 * @group Middleware
 */
export function semaphoreMiddlewareFactory(
    semaphoreFactory: ISemaphoreFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: SemaphoreMiddlewareSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const {
            key = (...args) => JSON.stringify(args),
            slotId = () => v4(),
            ...rest
        } = settings;
        return ({ next, args }) => {
            return semaphoreFactory
                .create(callInvokable(key, ...args), {
                    ...rest,
                    slotId: callInvokable(slotId, ...args),
                })
                .runOrFail(next);
        };
    };
}
