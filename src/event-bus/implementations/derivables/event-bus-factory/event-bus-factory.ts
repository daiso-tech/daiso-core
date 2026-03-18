/**
 * @module EventBus
 */

import {
    type IEventBus,
    type IEventBusFactory,
    type BaseEventMap,
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import {
    EventBus,
    type EventBusSettingsBase,
    type EventMapSchema,
} from "@/event-bus/implementations/derivables/event-bus/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export type EventBusAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, IEventBusAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export type EventBusFactorySettings<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = EventBusSettingsBase<TEventMap> & {
    adapters: EventBusAdapters<TAdapters>;

    defaultAdapter?: NoInfer<TAdapters>;
};

/**
 * The `EventBusFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export class EventBusFactory<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventBusFactory<TAdapters, TEventMap>
{
    /**
     * @example
     * ```ts
     * import { type IEventBusAdapter, BaseEvent } from "@daiso-tech/core/event-bus/contracts";
     * import { EventBusFactory } from "@daiso-tech/core/event-bus";
     * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
     * import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Redis from "ioredis";
     *
     * type Store = Partial<Record<string, IEventBusAdapter>>;
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const store: Store = {};
     * const eventBusFactory = new EventBusFactory({
     *   adapters: {
     *     memory: new MemoryEventBusAdapter(),
     *     redis: new RedisPubSubEventBusAdapter({
     *       serde,
     *       dispatcherClient: new Redis("YOUR_REDIS_CONNECTION_STRING"),
     *       listenerClient: new Redis("YOUR_REDIS_CONNECTION_STRING"),
     *     }),
     *   },
     *   defaultAdapter: "memory"
     * });
     * ```
     */
    constructor(
        private readonly settings: EventBusFactorySettings<
            TAdapters,
            TEventMap
        >,
    ) {}

    setNamespace(namespace: INamespace): EventBusFactory<TAdapters, TEventMap> {
        return new EventBusFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventMapType<TEventMap extends BaseEventMap>(): EventBusFactory<
        TAdapters,
        TEventMap
    > {
        return new EventBusFactory({
            ...this.settings,
        } as EventBusFactorySettings<TAdapters, TEventMap>);
    }

    setEventMapSchema<TEventMap extends BaseEventMap>(
        eventMapSchema: EventMapSchema<TEventMap>,
    ): EventBusFactory<TAdapters, TEventMap> {
        return new EventBusFactory({
            ...this.settings,
            eventMapSchema,
        });
    }

    /**
     * @example
     * ```ts
     * import { type IEventBusAdapter, BaseEvent } from "@daiso-tech/core/event-bus/contracts";
     * import { EventBusFactory } from "@daiso-tech/core/event-bus";
     * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
     * import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const eventBusFactory = new EventBusFactory({
     *   adapters: {
     *     memory: new MemoryEventBusAdapter(),
     *     redis: new RedisPubSubEventBusAdapter({
     *       serde,
     *       dispatcherClient: new Redis("YOUR_REDIS_CONNECTION_STRING"),
     *       listenerClient: new Redis("YOUR_REDIS_CONNECTION_STRING"),
     *     }),
     *   },
     *   defaultAdapter: "memory"
     * });
     *
     * type AddEvent = {
     *   a: number;
     *   b: number;
     * };
     * type EventMap = {
     *   add: AddEvent;
     * };
     *
     * // Will dispatch AddEvent using the default adapter which is MemoryEventBusAdapter
     * await eventBusFactory
     *   .use<EventMap>()
     *   .dispatch("add", { a: 1, b: 2 });
     *
     * // Will dispatch AddEvent using the redis adapter
     * await eventBusFactory
     *   .use<EventMap>("redis")
     *   .dispatch("add", { a: 1, b: 2 });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IEventBus<TEventMap> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(EventBusFactory.name);
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new EventBus({
            ...this.settings,
            adapter,
        });
    }
}
