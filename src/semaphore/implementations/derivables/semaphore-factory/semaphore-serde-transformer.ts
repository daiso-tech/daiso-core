/**
 * @module Semaphore
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type Use } from "@/middleware/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
    type SemaphoreEventMap,
} from "@/semaphore/contracts/_module.js";
import {
    Semaphore,
    type ISerializedSemaphore,
} from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type OneOrMore,
    type WaitUntil,
    getConstructorName,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type SemaphoreSerdeTransformerSettings = {
    adapter: ISemaphoreAdapter;
    originalAdapter: SemaphoreAdapterVariants;
    namespace: INamespace;
    defaultRefreshTime: TimeSpan;
    eventBus: IEventBus<SemaphoreEventMap>;
    serdeTransformerName: string;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
    use: Use;
};

/**
 * @internal
 */
export class SemaphoreSerdeTransformer
    implements ISerdeTransformer<Semaphore, ISerializedSemaphore>
{
    private readonly adapter: ISemaphoreAdapter;
    private readonly originalAdapter: SemaphoreAdapterVariants;
    private readonly namespace: INamespace;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly eventBus: IEventBus<SemaphoreEventMap>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;

    constructor(settings: SemaphoreSerdeTransformerSettings) {
        const {
            adapter,
            originalAdapter,
            namespace,
            defaultRefreshTime,
            eventBus,
            serdeTransformerName,
            waitUntil,
            executionContext,
            use,
        } = settings;

        this.use = use;
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.originalAdapter = originalAdapter;
        this.namespace = namespace;
        this.defaultRefreshTime = defaultRefreshTime;
        this.eventBus = eventBus;
    }

    get name(): OneOrMore<string> {
        return [
            "semaphore",
            this.serdeTransformerName,
            getConstructorName(this.originalAdapter),
            this.namespace.toString(),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is Semaphore {
        const isSemaphore =
            value instanceof Semaphore &&
            getConstructorName(value) === Semaphore.name;
        if (!isSemaphore) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            value._getSerdeTransformerName() === this.serdeTransformerName;

        const isNamespaceMatching =
            this.namespace.toString() === value._getNamespace().toString();

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value._getAdapter());

        return (
            isSerdTransformerNameMathcing &&
            isNamespaceMatching &&
            isAdapterMatching
        );
    }

    deserialize(serializedValue: ISerializedSemaphore): Semaphore {
        const { key, slotId, limit, ttlInMs } = serializedValue;
        const keyObj = this.namespace.create(key);
        return new Semaphore({
            use: this.use,
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            slotId,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            eventDispatcher: this.eventBus,
            key: keyObj,
            limit,
            serdeTransformerName: this.serdeTransformerName,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
            namespace: this.namespace,
        });
    }

    serialize(deserializedValue: Semaphore): ISerializedSemaphore {
        return Semaphore._serialize(deserializedValue);
    }
}
