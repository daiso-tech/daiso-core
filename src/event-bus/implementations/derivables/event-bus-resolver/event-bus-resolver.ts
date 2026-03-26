/**
 * @module EventBus
 */

import {
    type IEventBus,
    type IEventBusResolver,
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
export type EventBusResolverSettings<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = EventBusSettingsBase<TEventMap> & {
    adapters: EventBusAdapters<TAdapters>;

    defaultAdapter?: NoInfer<TAdapters>;
};

/**
 * The `EventBusResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export class EventBusResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventBusResolver<TAdapters, TEventMap>
{
    /**
     * @example
     * ```ts
     * import { type IEventBusAdapter, BaseEvent } from "@daiso-tech/core/event-bus/contracts";
     * import { EventBusResolver } from "@daiso-tech/core/event-bus";
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
     * const eventBusResolver = new EventBusResolver({
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
        private readonly settings: EventBusResolverSettings<
            TAdapters,
            TEventMap
        >,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): EventBusResolver<TAdapters, TEventMap> {
        return new EventBusResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventMapType<TEventMap extends BaseEventMap>(): EventBusResolver<
        TAdapters,
        TEventMap
    > {
        return new EventBusResolver({
            ...this.settings,
        } as EventBusResolverSettings<TAdapters, TEventMap>);
    }

    setEventMapSchema<TEventMap extends BaseEventMap>(
        eventMapSchema: EventMapSchema<TEventMap>,
    ): EventBusResolver<TAdapters, TEventMap> {
        return new EventBusResolver({
            ...this.settings,
            eventMapSchema,
        });
    }

    /**
     * @example
     * ```ts
     * import { type IEventBusAdapter, BaseEvent } from "@daiso-tech/core/event-bus/contracts";
     * import { EventBusResolver } from "@daiso-tech/core/event-bus";
     * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
     * import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const eventBusResolver = new EventBusResolver({
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
     * await eventBusResolver
     *   .setEventMapType<EventMap>()
     *   .use()
     *   .dispatch("add", { a: 1, b: 2 });
     *
     * // Will dispatch AddEvent using the redis adapter
     * await eventBusResolver
     *   .setEventMapType<EventMap>()
     *   .use("redis")
     *   .dispatch("add", { a: 1, b: 2 });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IEventBus<TEventMap> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(EventBusResolver.name);
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
