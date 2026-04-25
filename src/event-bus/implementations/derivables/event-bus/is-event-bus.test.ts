import { describe, expect, test } from "vitest";

import {
    type BaseEvent,
    type EventListener,
    type EventListenerFn,
    type EventWithType,
    type IEventBus,
    type IEventBusAdapter,
    type Unsubscribe,
} from "@/event-bus/contracts/_module.js";
import { isEventBus } from "@/event-bus/implementations/derivables/event-bus/is-event-bus.js";
import { type IReadableContext } from "@/execution-context/contracts/execution-context.contract.js";
import { type OneOrArray } from "@/utilities/_module.js";

describe("function: isEventBus", () => {
    test("Should return true when given IEventBus", () => {
        const eventBus: IEventBus = {
            addListener<TEventName extends string>(
                _eventNames: OneOrArray<TEventName>,
                _listener: EventListener<EventWithType<BaseEvent, string>>,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },

            removeListener<TEventName extends string>(
                _eventNames: OneOrArray<TEventName>,
                _listener: EventListener<EventWithType<BaseEvent, string>>,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },

            listenOnce<TEventName extends string>(
                _eventName: TEventName,
                _listener: EventListener<EventWithType<BaseEvent, string>>,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },

            asPromise<TEventName extends string>(
                _eventName: TEventName,
            ): Promise<EventWithType<BaseEvent, string>> {
                throw new Error("Method not implemented.");
            },

            subscribeOnce<TEventName extends string>(
                _eventName: TEventName,
                _listener: EventListener<EventWithType<BaseEvent, string>>,
            ): Promise<Unsubscribe> {
                throw new Error("Method not implemented.");
            },

            subscribe<TEventName extends string>(
                _eventNames: OneOrArray<TEventName>,
                _listener: EventListener<EventWithType<BaseEvent, string>>,
            ): Promise<Unsubscribe> {
                throw new Error("Method not implemented.");
            },

            dispatch<TEventName extends string>(
                _eventName: TEventName,
                _event: BaseEvent,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },
        };

        expect(isEventBus(eventBus)).toBe(true);
    });
    test("Should return false when given IEventBusAdapter", () => {
        const eventBusAdapter: IEventBusAdapter = {
            dispatch(
                _context: IReadableContext,
                _eventName: string,
                _eventData: BaseEvent,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },

            addListener(
                _context: IReadableContext,
                _eventName: string,
                _listener: EventListenerFn<BaseEvent>,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },

            removeListener(
                _context: IReadableContext,
                _eventName: string,
                _listener: EventListenerFn<BaseEvent>,
            ): Promise<void> {
                throw new Error("Method not implemented.");
            },
        };

        expect(isEventBus(eventBusAdapter)).toBe(false);
    });
});
