/**
 * @module EventBus
 */

import {
    type BaseEventMap,
    type EventBusInput,
    type IEventBus,
} from "@/event-bus/contracts/_module.js";

/**
 * @internal
 */
export function isEventBus<TEventMap extends BaseEventMap = BaseEventMap>(
    eventBusInput: EventBusInput<TEventMap>,
): eventBusInput is IEventBus<TEventMap> {
    return (
        typeof eventBusInput === "object" &&
        "subscribe" in eventBusInput &&
        typeof eventBusInput.subscribe === "function"
    );
}
