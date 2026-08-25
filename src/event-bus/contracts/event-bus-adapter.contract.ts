/**
 * @module EventBus
 */

import type { InvocableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Contracts
 */
export type BaseEvent = Record<string, unknown>;

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Contracts
 */
export type EventListenerFn<TEvent> = InvocableFn<[event: TEvent]>;

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Contracts
 */
export type IEventBusDispatcherAdapter = {
    /**
     * The `dispatch` method is used for dispatching one or multiple `events`.
     */
    dispatch(eventName: string, eventData: BaseEvent): Promise<void>;
};

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Contracts
 */
export type IEventBusListenableAdapter = {
    /**
     * The `addListener` method is used for adding {@link EventListenerFn | `EventListenerFn`} for certain `eventName`.
     */
    addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void>;

    /**
     * The `removeListener` method is used for removing {@link EventListenerFn | `EventListenerFn`} for certain `eventName`.
     */
    removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void>;
};

/**
 * The `IEventBusAdapter` contract defines a way for dispatching and listening to events independent of underlying technology.
 * This contract is not meant to be used directly, instead you should use `IEventBus`
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Contracts
 */
export type IEventBusAdapter = IEventBusDispatcherAdapter &
    IEventBusListenableAdapter;
