/**
 * @module EventBus
 */

import {
    type BaseEvent,
    type EventListenerFn,
} from "@/event-bus/contracts/event-bus-adapter.contract.js";
import { type IInvokableObject, type OneOrArray } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type BaseEventMap = Record<string, BaseEvent>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type Unsubscribe = () => Promise<void>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventListenerObject<TEvent> = IInvokableObject<[event: TEvent]>;

/**
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
 * The `IEventListenable` contract defines a way listening to events independent of underlying technology
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventListenable<TEventMap extends BaseEventMap = BaseEventMap> = {
    /**
     * The `addListener` method is used for listening to a {@link BaseEvent | `BaseEvent`}.
     * The same listener can only be added once for a specific event. Adding the same listener multiple times will have no effect and nothing will occur.
     */
    addListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * The `removeListener` method is used for stop listening to a {@link BaseEvent | `BaseEvent`}.
     * Removing unadded listener will have no effect and nothing will occur.
     */
    removeListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * The `listenOnce` method is used for listening to a {@link BaseEvent | `BaseEvent`} once.
     */
    listenOnce<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void>;

    /**
     * The `asPromise` method returns {@link Promise | `Promise`} that resolves once the {@link BaseEvent | `BaseEvent`} is dispatched.
     */
    asPromise<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
    ): Promise<InferEvent<TEventMap, TEventName>>;

    /**
     * The `subscribeOnce` method is used for listening to a {@link BaseEvent | `BaseEvent`} once and it returns a cleanup function that removes listener when called.
     * The same listener can only be added once for a specific event. Adding the same listener multiple times will have no effect and nothing will occur.
     */
    subscribeOnce<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe>;

    /**
     * The `subscribe` method is used for listening to a {@link BaseEvent | `BaseEvent`} and it returns a cleanup function that removes listener when called.
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
