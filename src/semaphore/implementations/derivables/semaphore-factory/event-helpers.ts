/**
 * @module Semaphore
 */
import { type IEventDispatcher } from "@/event-bus/contracts/event-bus.contract.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import {
    isSemaphoreError,
    SEMAPHORE_EVENTS,
    type ISemaphore,
    type SemaphoreEventMap,
} from "@/semaphore/contracts/_module.js";
import { callInvokable, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export function handleUnexpectedError<TReturn>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher<SemaphoreEventMap>,
    semaphore: ISemaphore,
): MiddlewareFn<[], Promise<TReturn>> {
    return async ({ next }) => {
        try {
            return await next();
        } catch (error: unknown) {
            if (isSemaphoreError(error)) {
                throw error;
            }

            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(SEMAPHORE_EVENTS.UNEXPECTED_ERROR, {
                    error,
                    semaphore,
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
    TEventName extends keyof SemaphoreEventMap,
    TEvent extends SemaphoreEventMap[TEventName],
>(settings: {
    on: "true" | "false";
    eventName: TEventName;
    eventData: TEvent;
    waitUntil: WaitUntil;
    eventDispatcher: IEventDispatcher;
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
