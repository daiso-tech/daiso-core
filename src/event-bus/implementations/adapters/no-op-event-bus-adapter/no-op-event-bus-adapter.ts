/**
 * @module EventBus
 */

import {
    type BaseEvent,
    type EventListenerFn,
    type IEventBusAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IEventBus,
} from "@/event-bus/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * The `NoOpEventBusAdapter` will do nothing and is used for easily mocking {@link IEventBus | `IEventBus`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/no-op-event-bus-adapter"`
 * @group Adapters
 */
export class NoOpEventBusAdapter implements IEventBusAdapter {
    addListener(
        _context: IReadableContext,
        _eventName: string,
        _listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        return Promise.resolve();
    }

    removeListener(
        _context: IReadableContext,
        _eventName: string,
        _listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        return Promise.resolve();
    }

    dispatch(
        _context: IReadableContext,
        _eventName: string,
        _eventData: BaseEvent,
    ): Promise<void> {
        return Promise.resolve();
    }
}
