/**
 * @module EventBus
 */

import {
    type BaseEvent,
    type EventListenerFn,
} from "@/event-bus/contracts/event-bus-adapter.contract.js";
import { type IInvokableObject, type OneOrArray } from "@/utilities/_module.js";

/**
 * Base type for event maps - a record of event names to their event payloads.
 * Used to provide type-safe event handling in event listeners and subscribers.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type BaseEventMap = Record<string, BaseEvent>;

/**
 * Function type returned when subscribing to events.
 * Call this function to unsubscribe from the event and clean up the listener.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type Unsubscribe = () => Promise<void>;

/**
 * Event listener that implements the invokable object pattern.
 * Allows treating objects as callable functions for event handling.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventListenerObject<TEvent> = IInvokableObject<[event: TEvent]>;

/**
 * Event listener that can be either a function or an object implementing the event listener pattern.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type EventListener<TEvent> =
    | IEventListenerObject<TEvent>
    | EventListenerFn<TEvent>;

export type EventWithType<TEvent, TEventName> = TEvent & {
    type: TEventName;
};

export type InferEvent<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
> = {
    [TCurrentEventName in keyof TEventMap]: EventWithType<
        TEventMap[TCurrentEventName],
        TCurrentEventName
    >;
}[TEventName];

/**
 * High-level event subscription and listening interface.
 * Provides multiple patterns for subscribing to events and receiving notifications of their occurrence.
 * Implementation is independent of the underlying event distribution technology (in-memory, Redis, etc.).
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventListenable<TEventMap extends BaseEventMap = BaseEventMap> = {
    /**
     * Subscribes one or more listeners to events.
     * The same listener can only be registered once per event - duplicate registrations are ignored.
     *
     * @template TEventName - The name(s) of the event(s) to listen to
     * @param eventNames - Single event name or array of event names to subscribe to
     * @param listener - Callback function or object to invoke when events are dispatched
     */
    addListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * Unsubscribes one or more listeners from events.
     * Removing a listener that was not registered is a no-op.
     *
     * @template TEventName - The name(s) of the event(s) to stop listening to
     * @param eventNames - Single event name or array of event names to unsubscribe from
     * @param listener - The listener callback to remove
     */
    removeListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * Subscribes a listener to an event that automatically unsubscribes after the first occurrence.
     *
     * @template TEventName - The name of the event to listen to
     * @param eventName - The event name to subscribe to
     * @param listener - Callback function or object to invoke when the event is dispatched
     */
    listenOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * Returns a Promise that resolves when an event is dispatched.
     * Useful for one-time event waiting without creating persistent listeners.
     *
     * @template TEventName - The name of the event to wait for
     * @param eventName - The event name to wait for
     * @returns A Promise that resolves with the event when it is dispatched
     */
    asPromise<TEventName extends keyof TEventMap>(
        eventName: TEventName,
    ): Promise<InferEvent<TEventMap, TEventName>>;

    /**
     * Subscribes a listener to an event once and returns a cleanup function.
     * The listener is automatically removed after the first event occurrence.
     *
     * @template TEventName - The name of the event to listen to
     * @param eventName - The event name to subscribe to
     * @param listener - Callback function or object to invoke when the event is dispatched
     * @returns A cleanup function that removes the listener when called
     */
    subscribeOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe>;

    /**
     * The `subscribe` method is used for listening to one or more {@link BaseEvent | `BaseEvent`} and it returns a cleanup function that removes listener when called.
     * The same listener can only be added once for a specific event. Adding the same listener multiple times will have no effect and nothing will occur.
     */
    subscribe<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe>;
};

/**
 * The `IEventDispatcher` contract defines a way for dispatching to events independent of underlying technology.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventDispatcher<TEventMap extends BaseEventMap = BaseEventMap> = {
    /**
     * The `dispatch` method is used for dispatching a {@link BaseEvent | `BaseEvent`}.
     */
    dispatch<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        event: TEventMap[TEventName],
    ): Promise<void>;
};

/**
 * The `IEventBus` contract defines a way for dispatching and listening to events independent of underlying technology.
 * It comes with more convenient methods compared to `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventBus<TEventMap extends BaseEventMap = BaseEventMap> =
    IEventListenable<TEventMap> & IEventDispatcher<TEventMap>;
