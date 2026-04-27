/**
 * @module Lock
 */

import { type IEventDispatcher } from "@/event-bus/contracts/event-bus.contract.js";
import {
    isLockError,
    LOCK_EVENTS,
    type ILock,
    type LockEventMap,
} from "@/lock/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { callInvokable, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export function handleDispatch<
    TEventName extends keyof LockEventMap,
    TEvent extends LockEventMap[TEventName],
>(settings: {
    on: "true" | "false";
    eventName: TEventName;
    eventData: TEvent;
    waitUntil: WaitUntil;
    eventDispatcher: IEventDispatcher<LockEventMap>;
}): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const result = await next();
        if (result && settings.on === "true") {
            callInvokable(
                settings.waitUntil,
                settings.eventDispatcher.dispatch(
                    settings.eventName,
                    settings.eventData,
                ),
            );
        }
        if (!result && settings.on === "false") {
            callInvokable(
                settings.waitUntil,
                settings.eventDispatcher.dispatch(
                    settings.eventName,
                    settings.eventData,
                ),
            );
        }
        return result;
    };
}

/**
 * @internal
 */
export function handleUnexpectedError<TReturn>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher<LockEventMap>,
    lock: ILock,
): MiddlewareFn<[], Promise<TReturn>> {
    return async ({ next }) => {
        try {
            return await next();
        } catch (error: unknown) {
            if (isLockError(error)) {
                throw error;
            }

            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(LOCK_EVENTS.UNEXPECTED_ERROR, {
                    error,
                    lock,
                }),
            );

            throw error;
        }
    };
}
