/**
 * @module EventBus
 */

import { EventEmitter } from "node:events";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IEventBus,
} from "@/event-bus/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * The `MemoryEventBusAdapter` is used for easily faking{@link IEventBus | `IEventBus`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/memory-event-bus"`
 * @group Adapters
 */
export class MemoryEventBusAdapter implements IEventBusAdapter {
    /**
     *  @example
     * ```ts
     * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
     *
     * const eventBusAdapter = new MemoryEventBusAdapter();
     * ```
     * You can also provide an {@link EventEmitter | `EventEmitter`} that will be used dispatching the events in memory.
     * @example
     * ```ts
     * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
     * import { EventEmitter } from "node:events";
     *
     * const eventEmitter = new EventEmitter<any>();
     * const eventBusAdapter = new MemoryEventBusAdapter(eventEmitter);
     * ```
     */
    constructor(
        private readonly eventEmitter: EventEmitter = new EventEmitter(),
    ) {
        this.eventEmitter = eventEmitter;
    }

    addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
        _context: IReadableContext,
    ): Promise<void> {
        this.eventEmitter.on(eventName, listener);
        return Promise.resolve();
    }

    removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
        _context: IReadableContext,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);
        return Promise.resolve();
    }

    dispatch(
        eventName: string,
        eventData: BaseEvent,
        _context: IReadableContext,
    ): Promise<void> {
        this.eventEmitter.emit(eventName, eventData);
        return Promise.resolve();
    }
}
