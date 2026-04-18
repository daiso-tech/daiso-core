/**
 * @module EventBus
 */

import {
    type BaseEventMap,
    type IEventBus,
} from "@/event-bus/contracts/event-bus.contract.js";

/**
 * Event bus resolver contract for dynamically selecting and switching between event bus implementations.
 * Simplifies event bus adapter management by providing a single interface to access registered implementations.
 *
 * Typical usage:
 * - Development: Use in-memory event bus
 * - Testing: Use mock or no-op event bus
 * - Production: Use Redis Pub/Sub or message broker
 * All without changing application code (just switch the configured adapter).
 *
 * Event bus patterns:
 * - Local events: In-memory event bus for same-process event distribution
 * - Distributed events: Redis Pub/Sub or message queues for cross-service communication
 *
 * @template TAdapters - Union type of registered adapter names (e.g., "memory" | "redis" | "kafka")
 * @template TEventMap - Strongly-typed map of event names to event payloads
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/contracts"`
 * @group Contracts
 */
export type IEventBusResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * Retrieves an event bus adapter by name.
     * If no adapter name is provided, uses the default registered adapter.
     *
     * @param adapterName - The name of the adapter to retrieve (optional). If not provided, uses the default adapter.
     * @returns The requested event bus adapter instance
     *
     * @throws {UnregisteredAdapterError} If the specified adapter name is not registered
     * @throws {DefaultAdapterNotDefinedError} If no adapter name is provided and no default adapter is defined
     */
    use(adapterName?: TAdapters): IEventBus<TEventMap>;
};
