/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";
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
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: SemaphoreSerdeTransformerSettings) {
        const { adapter, defaultRefreshTime, serdeTransformerName, context } =
            settings;

        this.context = context;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return [
            "semaphore",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
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

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value._getAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedSemaphore): Semaphore {
        const { key, slotId, limit, ttlInMs } = serializedValue;
        return new Semaphore({
            context: this.context,
            slotId,
            adapter: this.adapter,
            key,
            limit,
            serdeTransformerName: this.serdeTransformerName,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: Semaphore): ISerializedSemaphore {
        return Semaphore._serialize(deserializedValue);
    }
}
