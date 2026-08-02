/**
 * @module EventBus
 */

import {
    type EventListener,
    type EventListenerFn,
} from "@/event-bus/contracts/_module.js";
import { resolveInvocable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class ListenerStore {
    constructor(
        private readonly listenerMap = new Map<
            string,
            Map<EventListener<any>, EventListenerFn<any>>
        >(),
    ) {}

    /**
     * Retrieves the listener if it exists. If the listener doesnt exists it will be added then retrieved.
     */
    getOrAdd<TInput>(
        eventName: string,
        listener: EventListener<TInput>,
        listenerWrapper: EventListenerFn<TInput>,
    ): EventListenerFn<TInput> {
        let eventMap = this.listenerMap.get(eventName);
        if (eventMap === undefined) {
            eventMap = new Map();
            this.listenerMap.set(eventName, eventMap);
        }

        let listenerFn_ = eventMap.get(listener);
        if (listenerFn_ === undefined) {
            listenerFn_ = resolveInvocable(listenerWrapper);
            eventMap.set(listener, listenerFn_);
        }

        return listenerFn_;
    }

    /**
     * Retrieves the listener if it exists otherwise null is returned.
     * If the listener exists it will be removed.
     */
    getAndRemove<TInput>(
        eventName: string,
        listener: EventListener<TInput>,
    ): EventListenerFn<TInput> | null {
        const eventMap = this.listenerMap.get(eventName);
        if (eventMap === undefined) {
            return null;
        }

        const listenerFn = eventMap.get(listener);
        if (listenerFn === undefined) {
            return null;
        }

        eventMap.delete(listener);
        if (eventMap.size === 0) {
            this.listenerMap.delete(eventName);
        }

        return listenerFn;
    }
}
