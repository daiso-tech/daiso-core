/**
 * @module EventBus
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type IEventBus,
    type IEventBusAdapter,
    type BaseEvent,
    type BaseEventMap,
    type EventListener,
    type EventListenerFn,
    type Unsubscribe,
} from "@/event-bus/contracts/_module.js";
import { ListenerStore } from "@/event-bus/implementations/derivables/event-bus/listener-store.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import {
    getInvokableName,
    validate,
    resolveInvokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export type EventMapSchema<TEventMap extends BaseEventMap = BaseEventMap> = {
    [TEventName in keyof TEventMap]: StandardSchemaV1<TEventMap[TEventName]>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export type EventBusSettingsBase<
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * You can provide any [standard schema](https://standardschema.dev/) compliant object to validate all input and output data to ensure runtime type safety.
     */
    eventMapSchema?: EventMapSchema<TEventMap>;

    /**
     * You can enable validating events in listeners.
     * @default true
     */
    shouldValidateOutput?: boolean;

    /**
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export type EventBusSettings<TEventMap extends BaseEventMap = BaseEventMap> =
    EventBusSettingsBase<TEventMap> & {
        adapter: IEventBusAdapter;

        /**
         * Thist settings is only used for testing, dont use it in your code !
         * @internal
         */
        __onUncaughtRejection?: (error: unknown) => void;
    };

/**
 * `EventBus` class can be derived from any {@link IEventBusAdapter | `IEventBusAdapter`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus"`
 * @group Derivables
 */
export class EventBus<TEventMap extends BaseEventMap = BaseEventMap>
    implements IEventBus<TEventMap>
{
    private readonly shouldValidateOutput: boolean;
    private readonly store = new ListenerStore();
    private readonly adapter: IEventBusAdapter;
    private readonly namespace: INamespace;
    private readonly eventMapSchema: EventMapSchema<TEventMap> | undefined;

    /**
     * Thist instance variable is only used for testing!
     */
    private readonly __onUncaughtRejection?: (error: unknown) => void;

    /**
     * @example
     * ```ts
     * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
     * import { EventBus } from "@daiso-tech/core/event-bus";
     *
     * const eventBus = new EventBus({
     *   adapter: new MemoryEventBusAdapter()
     * });
     * ```
     */
    constructor(settings: EventBusSettings<TEventMap>) {
        const {
            __onUncaughtRejection,
            shouldValidateOutput = true,
            eventMapSchema,
            namespace = new NoOpNamespace(),
            adapter,
        } = settings;
        this.shouldValidateOutput = shouldValidateOutput;
        this.eventMapSchema = eventMapSchema;
        this.adapter = adapter;
        this.namespace = namespace;
        this.__onUncaughtRejection = __onUncaughtRejection;
    }

    private createWrappedListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ) {
        return async (event: TEventMap[TEventName]) => {
            try {
                if (this.shouldValidateOutput) {
                    await validate(this.eventMapSchema?.[eventName], event);
                }
                await resolveInvokable(listener)(event);
            } catch (error: unknown) {
                if (this.__onUncaughtRejection !== undefined) {
                    this.__onUncaughtRejection(error);
                } else {
                    console.error(
                        `An error of type "${String(error)}" occured in listener with name of "${getInvokableName(listener)}" for "${String(eventName)}" event`,
                    );
                    console.log("ERROR:", error);
                    throw error;
                }
            }
        };
    }

    addListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ): ITask<void> {
        return new Task(async () => {
            const key = this.namespace.create(String(eventName));
            const resolvedListener = this.store.getOrAdd(
                key.toString(),
                listener,
                this.createWrappedListener(eventName, listener),
            );
            try {
                await this.adapter.addListener(
                    key.toString(),
                    resolvedListener as EventListenerFn<BaseEvent>,
                );
            } catch (error: unknown) {
                this.store.getAndRemove(key.toString(), listener);
                throw error;
            }
        });
    }

    removeListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ): ITask<void> {
        return new Task(async () => {
            const key = this.namespace.create(String(eventName));
            const resolvedListener = this.store.getAndRemove(
                key.toString(),
                listener,
            );
            if (resolvedListener === null) {
                return;
            }
            try {
                await this.adapter.removeListener(
                    key.toString(),
                    resolvedListener as EventListenerFn<BaseEvent>,
                );
            } catch (error: unknown) {
                this.store.getOrAdd(key.toString(), listener, resolvedListener);
                throw error;
            }
        });
    }

    listenOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ): ITask<void> {
        return new Task(async () => {
            const wrappedListener = async (event_: TEventMap[TEventName]) => {
                try {
                    if (this.shouldValidateOutput) {
                        await validate(
                            this.eventMapSchema?.[eventName],
                            event_,
                        );
                    }
                    const resolvedListener = resolveInvokable(listener);
                    await resolvedListener(event_);
                } catch (error: unknown) {
                    if (this.__onUncaughtRejection !== undefined) {
                        this.__onUncaughtRejection(error);
                    } else {
                        console.error(
                            `An error of type "${String(error)}" occured in listener with name of "${getInvokableName(listener)}" for "${String(eventName)}" event`,
                        );
                        console.log("ERROR:", error);
                        throw error;
                    }
                } finally {
                    await this.removeListener(eventName, listener);
                }
            };

            const key = this.namespace.create(String(eventName));
            const resolvedListener = this.store.getOrAdd(
                key.toString(),
                listener,
                wrappedListener,
            );
            try {
                await this.adapter.addListener(
                    key.toString(),
                    resolvedListener as EventListenerFn<BaseEvent>,
                );
            } catch (error: unknown) {
                this.store.getAndRemove(key.toString(), listener);
                throw error;
            }
        });
    }

    asTask<TEventName extends keyof TEventMap>(
        eventName: TEventName,
    ): ITask<TEventMap[TEventName]> {
        return Task.fromCallback((resolve, reject) => {
            this.listenOnce(eventName, resolve).then(() => {}, reject);
        });
    }

    subscribeOnce<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ): ITask<Unsubscribe> {
        return new Task<Unsubscribe>(async () => {
            await this.listenOnce(eventName, listener);
            const unsubscribe = () => {
                return new Task(async () => {
                    await this.removeListener(eventName, listener);
                });
            };
            return unsubscribe;
        });
    }

    subscribe<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<TEventMap[TEventName]>,
    ): ITask<Unsubscribe> {
        return new Task<Unsubscribe>(async () => {
            await this.addListener(eventName, listener);
            const unsubscribe = () => {
                return new Task(async () => {
                    await this.removeListener(eventName, listener);
                });
            };
            return unsubscribe;
        });
    }

    dispatch<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        event: TEventMap[TEventName],
    ): ITask<void> {
        return new Task(async () => {
            await validate(this.eventMapSchema?.[eventName], event);
            await this.adapter.dispatch(
                this.namespace.create(String(eventName)).toString(),
                event,
            );
        });
    }
}
