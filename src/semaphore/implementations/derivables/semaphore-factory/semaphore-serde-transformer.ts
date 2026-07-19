/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
} from "@/semaphore/contracts/_module.js";
import {
    Semaphore,
    type ISerializedSemaphore,
} from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type OneOrMore, getConstructorName } from "@/utilities/_module.js";

/**
 * @internal
 */
export type SemaphoreSerdeTransformerSettings = {
    adapter: ISemaphoreAdapter;
    originalAdapter: SemaphoreAdapterVariants;
    namespace: INamespace;
    defaultRefreshTime: TimeSpan;
    serdeTransformerName: string;
    context: IReadableContext;
};

/**
 * @internal
 */
export class SemaphoreSerdeTransformer implements ISerdeTransformer<
    Semaphore,
    ISerializedSemaphore
> {
    private readonly adapter: ISemaphoreAdapter;
    private readonly originalAdapter: SemaphoreAdapterVariants;
    private readonly namespace: INamespace;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: SemaphoreSerdeTransformerSettings) {
        const {
            adapter,
            originalAdapter,
            namespace,
            defaultRefreshTime,
            serdeTransformerName,
            context,
        } = settings;

        this.context = context;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.originalAdapter = originalAdapter;
        this.namespace = namespace;
        this.defaultRefreshTime = defaultRefreshTime;
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
            context: this.context,
            slotId,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
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
