/**
 * @module EventBus
 */

import { ListenerStore } from "@/event-bus/implementations/derivables/event-bus/listener-store.js";
import { withEventBusSchema } from "@/event-bus/implementations/derivables/event-bus/with-event-bus-schema.js";
import { withListenerTracking } from "@/event-bus/implementations/plugins/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module.js";
import { resolveInvocable, resolveOneOrMore } from "@/utilities/_module.js";

import type {
    IEventBus,
    IEventBusAdapter,
    BaseEvent,
    BaseEventMap,
    EventListener,
    EventListenerFn,
    Unsubscribe,
    InferEvent,
} from "@/event-bus/contracts/_module.js";
import type { EventMapSchema } from "@/event-bus/implementations/derivables/event-bus/with-event-bus-schema.js";
import type { OneOrArray, InvocableFn } from "@/utilities/_module.js";

/**
 * Base configuration shared by all `EventBus` variants.
 * Supports optional schema-based validation for event maps.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventBusSettingsBase<
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * A map of event names to standard-schema-compliant schemas.
     * Compatible with libraries such as Zod, ArkType, Valibot, and others
     * that implement the `StandardSchemaV1` specification.
     */
    eventMapSchema?: EventMapSchema<TEventMap>;

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
 * Configuration for the `EventBus` class.
 * Extends {@link EventBusSettingsBase | `EventBusSettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventBusSettings<TEventMap extends BaseEventMap = BaseEventMap> =
    EventBusSettingsBase<TEventMap> & {
        /**
         * The underlying event-bus adapter that handles message dispatching and subscription.
         */
        adapter: IEventBusAdapter;

        /**
         * Thist settings is only used for testing, dont use it in your code !
         * @internal
         */
        _onUncaughtRejection?: (error: unknown) => void;
    };

/**
 * `EventBus` class can be derived from any {@link IEventBusAdapter | `IEventBusAdapter`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export class EventBus<
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventBus<TEventMap> {
    private readonly store = new ListenerStore();
    private readonly adapter: IEventBusAdapter;

    /**
     * Thist instance variable is only used for testing!
     */
    private readonly _onUncaughtRejection: InvocableFn<[error: unknown], void>;

    /**
     * @example
     * ```ts
     * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
     * import { EventBus } from "eridu-tech/event-bus";
     *
     * const eventBus = new EventBus({
     *   adapter: new MemoryEventBusAdapter()
     * });
     * ```
     */
    constructor(settings: EventBusSettings<TEventMap>) {
        const {
            _onUncaughtRejection = (error) => {
                console.error(
                    `An error of type "${String(error)}" occurred in event listener`,
                );
            },
            adapter,
            eventMapSchema,
            shouldValidateListeners = true,
        } = settings;

        this.adapter = adapter;
        if (eventMapSchema !== undefined) {
            const plugin = withEventBusSchema({
                eventMapSchema,
                shouldValidateListeners,
            });
            this.adapter = withPlugin(adapter, [
                shouldValidateListeners ? withListenerTracking(plugin) : plugin,
            ]);
        }
        this._onUncaughtRejection = _onUncaughtRejection;
    }

    private createWrappedListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ) {
        return async (event: InferEvent<TEventMap, TEventName>) => {
            try {
                await resolveInvocable(listener)({
                    ...event,
                    type: eventName,
                });
            } catch (error: unknown) {
                this._onUncaughtRejection(error);
            }
        };
    }

    private async _addListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        if (typeof eventName !== "string") {
            throw new TypeError("!!__MESSAGE__!!");
        }
        const resolvedListener = this.store.getOrAdd(
            eventName,
            listener,
            this.createWrappedListener(eventName, listener),
        );
        try {
            await this.adapter.addListener(
                eventName,
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getAndRemove(eventName, listener);
            throw error;
        }
    }

    async addListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        for (const eventName of resolveOneOrMore<TEventName>(eventNames)) {
            await this._addListener(eventName, listener);
        }
    }

    private async _removeListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        if (typeof eventName !== "string") {
            throw new TypeError("!!__MESSAGE__!!");
        }
        const resolvedListener = this.store.getAndRemove(eventName, listener);
        if (resolvedListener === null) {
            return;
        }
        try {
            await this.adapter.removeListener(
                eventName,
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getOrAdd(eventName, listener, resolvedListener);
            throw error;
        }
    }

    async removeListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        for (const eventName of resolveOneOrMore<TEventName>(eventNames)) {
            await this._removeListener(eventName, listener);
        }
    }

    async listenOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        if (typeof eventName !== "string") {
            throw new TypeError("!!__MESSAGE__!!");
        }
        const wrappedListener = async (
            event_: InferEvent<TEventMap, TEventName>,
        ) => {
            try {
                const resolvedListener = resolveInvocable(listener);
                await resolvedListener(event_);
            } catch (error: unknown) {
                this._onUncaughtRejection(error);
            } finally {
                await this.removeListener(eventName, listener);
            }
        };

        const resolvedListener = this.store.getOrAdd(
            eventName,
            listener,
            wrappedListener,
        );
        try {
            await this.adapter.addListener(
                eventName,
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getAndRemove(eventName, listener);
            throw error;
        }
    }

    asPromise<TEventName extends keyof TEventMap>(
        eventName: TEventName,
    ): Promise<InferEvent<TEventMap, TEventName>> {
        return new Promise((resolve, reject) => {
            this.listenOnce(eventName, resolve)
                .then(() => {})
                .catch(reject);
        });
    }

    async subscribeOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe> {
        await this.listenOnce(eventName, listener);
        const unsubscribe = async () => {
            await this.removeListener(eventName, listener);
        };
        return unsubscribe;
    }

    private async _subscribe<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe> {
        await this.addListener(eventName, listener);
        const unsubscribe = async () => {
            await this.removeListener(eventName, listener);
        };
        return unsubscribe;
    }

    async subscribe<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<Unsubscribe> {
        const unsubscribeArr: Array<Unsubscribe> = [];
        for (const eventName of resolveOneOrMore<TEventName>(eventNames)) {
            const unsubscribe = await this._subscribe(eventName, listener);
            unsubscribeArr.push(unsubscribe);
        }
        return async () => {
            for (const unsubscribe of unsubscribeArr) {
                await unsubscribe();
            }
        };
    }

    async dispatch<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        event: TEventMap[TEventName],
    ): Promise<void> {
        if (typeof eventName !== "string") {
            throw new TypeError("!!__MESSAGE__!!");
        }
        await this.adapter.dispatch(eventName, event);
    }
}
