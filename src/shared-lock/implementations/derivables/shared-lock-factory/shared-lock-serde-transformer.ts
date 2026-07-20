/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import {
    type ISharedLockAdapter,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";
import {
    SharedLock,
    type ISerializedSharedLock,
} from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { getConstructorName, type OneOrMore } from "@/utilities/_module.js";

/**
 * @internal
 */
export type SharedLockSerdeTransformerSettings = {
    adapter: ISharedLockAdapter;
    originalAdapter: SharedLockAdapterVariants;
    defaultRefreshTime: TimeSpan;
    serdeTransformerName: string;
    context: IReadableContext;
};

/**
 * @internal
 */
export class SharedLockSerdeTransformer implements ISerdeTransformer<
    SharedLock,
    ISerializedSharedLock
> {
    private readonly adapter: ISharedLockAdapter;
    private readonly originalAdapter: SharedLockAdapterVariants;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: SharedLockSerdeTransformerSettings) {
        const {
            adapter,
            originalAdapter,
            defaultRefreshTime,
            serdeTransformerName,
            context,
        } = settings;

        this.context = context;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.originalAdapter = originalAdapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return [
            "shared-lock",
            this.serdeTransformerName,
            getConstructorName(this.originalAdapter),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is SharedLock {
        const isSharedLock =
            value instanceof SharedLock &&
            getConstructorName(value) === SharedLock.name;
        if (!isSharedLock) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            value._getSerdeTransformerName() === this.serdeTransformerName;

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value._getAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedSharedLock): SharedLock {
        const { key, lockId, limit, ttlInMs } = serializedValue;
        return new SharedLock({
            context: this.context,
            lockId,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            key,
            limit,
            serdeTransformerName: this.serdeTransformerName,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: SharedLock): ISerializedSharedLock {
        return SharedLock._serialize(deserializedValue);
    }
}
