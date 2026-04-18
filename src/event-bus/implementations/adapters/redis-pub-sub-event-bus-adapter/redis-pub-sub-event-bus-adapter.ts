/**
 * @module EventBus
 */

import { EventEmitter } from "node:events";

import { type Redis } from "ioredis";

import {
    type BaseEvent,
    type EventListenerFn,
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerdeAdapter,
} from "@/serde/implementations/adapters/_module.js";

/**
 * Configuration for `RedisPubSubEventBusAdapter`.
 * Requires a Redis client and a serde for serialising event payloads.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter"`
 * @group Adapters
 */
export type RedisPubSubEventBusAdapterSettings = {
    /**
     * The Redis client instance used for pub/sub messaging.
     */
    client: Redis;
    /**
     * Serde instance for serializing and deserializing event payloads to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * To utilize the `RedisPubSubEventBusAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerdeAdapter | `SuperJsonSerdeAdapter`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter"`
 * @group Adapters
 */
export class RedisPubSubEventBusAdapter implements IEventBusAdapter {
    private readonly serde: ISerde<string>;
    private readonly dispatcherClient: Redis;
    private readonly listenerClient: Redis;
    private readonly eventEmitter = new EventEmitter();

    /**
     *  @example
     * ```ts
     * import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Redis from "ioredis";
     *
     * const client = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const eventBusAdapter = new RedisPubSubEventBusAdapter({
     *   client,
     *   serde,
     * });
     * ```
     */
    constructor(settings: RedisPubSubEventBusAdapterSettings) {
        const { client, serde } = settings;
        this.dispatcherClient = client;
        this.listenerClient = client.duplicate();
        this.serde = serde;
    }

    private redisListener = (channel: string, message: string): void => {
        this.eventEmitter.emit(channel, this.serde.deserialize(message));
    };

    async addListener(
        _context: IReadableContext,
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.eventEmitter.on(eventName, listener);

        await this.listenerClient.subscribe(eventName);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.listenerClient.on("message", this.redisListener);
    }

    async removeListener(
        _context: IReadableContext,
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.eventEmitter.off(eventName, listener);

        await this.listenerClient.unsubscribe(eventName);
    }

    async dispatch(
        _context: IReadableContext,
        eventName: string,
        eventData: BaseEvent,
    ): Promise<void> {
        await this.dispatcherClient.publish(
            eventName,
            this.serde.serialize(eventData),
        );
    }
}
