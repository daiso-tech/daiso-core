/**
 * @module EventBus
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { validate, ValidationError } from "@/utilities/_module.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    BaseEvent,
    BaseEventMap,
    EventListenerFn,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
 * A map of event names to their corresponding standard schemas.
 * Used to define validation rules for each event in the event map.
 *
 * @typeParam TEventMap - The event map type mapping event names to their payloads.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventMapSchema<TEventMap extends BaseEventMap = BaseEventMap> = {
    [TEventName in keyof TEventMap]: StandardSchemaV1<TEventMap[TEventName]>;
};

/**
 * A helper function to create a typed {@link EventMapSchema}.
 * This provides type-safety when defining the schema map for your events.
 *
 * @param eventMapSchema - The event map schema to define.
 * @returns The same event map schema with proper type inference.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export function defineEventMapSchema<TEventMap extends BaseEventMap>(
    eventMapSchema: EventMapSchema<TEventMap>,
): EventMapSchema<TEventMap> {
    return eventMapSchema;
}

/**
 * Settings for the {@link withEventBusSchema} plugin.
 *
 * @internal
 */
export type WithEventBusSchemaSettings = {
    /**
     * A map of event names to standard-schema-compliant schemas.
     * Compatible with libraries such as Zod, ArkType, Valibot, and others
     * that implement the `StandardSchemaV1` specification.
     */
    eventMapSchema: EventMapSchema;

    /**
     * Whether to validate event data in listener functions when events are received,
     * in addition to validating on dispatch.
     * When `true`, listeners will receive validated event data that conforms to the schema.
     *
     * @default true
     */
    shouldValidateListeners?: boolean;
};

/**
 * Creates a plugin that validates event data against a schema map.
 *
 * On `dispatch`, the event data is validated against the schema associated with the
 * event name in the provided `eventMapSchema`. If no schema is defined for the event
 * name, the data passes through without validation.
 *
 * When `shouldValidateListeners` is `true` (default), listener functions are also wrapped
 * to validate event data before it reaches the listener. A WeakMap is used to track
 * original-to-wrapped listener mappings so that `removeListener` correctly removes
 * the wrapped listener.
 *
 * @param settings - Configuration for the schema validation.
 * @param settings.eventMapSchema - A map of event names to standard-schema compliant
 *                                  schemas to validate event data against.
 * @param settings.shouldValidateListeners - Whether to validate event data in listener
 *                                        functions. @default true
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * @throws {ValidationError}
 *
 * @internal
 */
export function withEventBusSchema(
    settings: WithEventBusSchemaSettings,
): PluginFn<IEventBusAdapter> {
    const { eventMapSchema, shouldValidateListeners = true } = settings;
    return (adapter, enhance) => {
        enhance(
            adapter,
            "dispatch",
            async ({ args: [eventName, eventData], next }) => {
                const schema = eventMapSchema[eventName];
                if (schema !== undefined) {
                    return next([eventName, await validate(schema, eventData)]);
                }
                return next([eventName, eventData]);
            },
        );

        if (shouldValidateListeners) {
            enhance(
                adapter,
                "addListener",
                async ({ args: [eventName, listener], next }) => {
                    const schema = eventMapSchema[eventName];
                    if (schema !== undefined) {
                        const wrappedListener: EventListenerFn<
                            BaseEvent
                        > = async (event) => {
                            return listener(await validate(schema, event));
                        };
                        return next([eventName, wrappedListener]);
                    }
                    return next([eventName, listener]);
                },
            );
        }
    };
}
