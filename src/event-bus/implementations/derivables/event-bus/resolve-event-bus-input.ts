/**
 * @module EventBus
 */

import {
    type EventBusInput,
    type IEventBus,
} from "@/event-bus/contracts/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/event-bus/event-bus.js";
import { isEventBus } from "@/event-bus/implementations/derivables/event-bus/is-event-bus.js";
import { type INamespace } from "@/namespace/contracts/_module.js";

/**
 * @internal
 */
export function resolveEventBusInput(
    namespace: INamespace,
    eventBusInput: EventBusInput,
): IEventBus {
    if (isEventBus(eventBusInput)) {
        return eventBusInput;
    }
    return new EventBus({
        namespace,
        adapter: eventBusInput,
    });
}
