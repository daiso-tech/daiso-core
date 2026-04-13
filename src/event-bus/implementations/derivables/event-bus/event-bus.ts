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
    type InferEvent,
} from "@/event-bus/contracts/_module.js";
import { ListenerStore } from "@/event-bus/implementations/derivables/event-bus/listener-store.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import {
    validate,
    resolveInvokable,
    type OneOrArray,
    type InvokableFn,
    resolveOneOrMore,
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

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    executionContext?: IExecutionContext;
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
    private readonly executionContext: IExecutionContext;

    /**
     * Thist instance variable is only used for testing!
     */
    private readonly __onUncaughtRejection: InvokableFn<[error: unknown], void>;

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
            __onUncaughtRejection = (error) => {
                console.error(
                    `An error of type "${String(error)}" occured in event listener`,
                );
            },
            shouldValidateOutput = true,
            eventMapSchema,
            namespace = new NoOpNamespace(),
            adapter,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        } = settings;

        this.executionContext = executionContext;
        this.shouldValidateOutput = shouldValidateOutput;
        this.eventMapSchema = eventMapSchema;
        this.adapter = adapter;
        this.namespace = namespace;
        this.__onUncaughtRejection = __onUncaughtRejection;
    }

    private createWrappedListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ) {
        return async (event: InferEvent<TEventMap, TEventName>) => {
            try {
                if (this.shouldValidateOutput) {
                    await validate(this.eventMapSchema?.[eventName], event);
                }
                await resolveInvokable(listener)(event);
            } catch (error: unknown) {
                this.__onUncaughtRejection(error);
            }
        };
    }

    private async _addListener<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        const key = this.namespace.create(String(eventName));
        const resolvedListener = this.store.getOrAdd(
            key.toString(),
            listener,
            this.createWrappedListener(eventName, listener),
        );
        try {
            await this.adapter.addListener(
                this.executionContext,
                key.toString(),
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getAndRemove(key.toString(), listener);
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
                this.executionContext,
                key.toString(),
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getOrAdd(key.toString(), listener, resolvedListener);
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
        const wrappedListener = async (
            event_: InferEvent<TEventMap, TEventName>,
        ) => {
            try {
                if (this.shouldValidateOutput) {
                    await validate(this.eventMapSchema?.[eventName], event_);
                }
                const resolvedListener = resolveInvokable(listener);
                await resolvedListener(event_);
            } catch (error: unknown) {
                this.__onUncaughtRejection(error);
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
                this.executionContext,
                key.toString(),
                resolvedListener as EventListenerFn<BaseEvent>,
            );
        } catch (error: unknown) {
            this.store.getAndRemove(key.toString(), listener);
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
        await validate(this.eventMapSchema?.[eventName], event);
        await this.adapter.dispatch(
            this.executionContext,
            this.namespace.create(String(eventName)).toString(),
            event,
        );
    }
}
