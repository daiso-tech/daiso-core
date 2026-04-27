/**
 * @module SharedLock
 */

import { type IEventDispatcher } from "@/event-bus/contracts/event-bus.contract.js";
import { type Middleware } from "@/middleware/contracts/_module.js";
import {
    isSharedLockError,
    SHARED_LOCK_EVENTS,
    type ISharedLock,
    type SharedLockEventMap,
} from "@/shared-lock/contracts/_module.js";
import { callInvokable, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export function handleUnexpectedError<TReturn>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    sharedLock: ISharedLock,
): Middleware<[], Promise<TReturn>> {
    return async ({ next }) => {
        try {
            return await next();
        } catch (error: unknown) {
            if (isSharedLockError(error)) {
                throw error;
            }

            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(SHARED_LOCK_EVENTS.UNEXPECTED_ERROR, {
                    error,
                    sharedLock,
                }),
            );

            throw error;
        }
    };
}

/**
 * @internal
 */
export function handleDispatch<
    TEventName extends keyof SharedLockEventMap,
    TEvent extends SharedLockEventMap[TEventName],
>(settings: {
    on: "true" | "false";
    eventName: TEventName;
    eventData: TEvent;
    waitUntil: WaitUntil;
    eventDispatcher: IEventDispatcher;
}): Middleware<[], Promise<boolean>> {
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
