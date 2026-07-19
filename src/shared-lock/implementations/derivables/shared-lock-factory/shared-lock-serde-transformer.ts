/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
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
    namespace: INamespace;
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
    private readonly namespace: INamespace;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: SharedLockSerdeTransformerSettings) {
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
            "shared-lock",
            this.serdeTransformerName,
            getConstructorName(this.originalAdapter),
            this.namespace.toString(),
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

    deserialize(serializedValue: ISerializedSharedLock): SharedLock {
        const { key, lockId, limit, ttlInMs } = serializedValue;
        const keyObj = this.namespace.create(key);
        return new SharedLock({
            context: this.context,
            lockId,
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

    serialize(deserializedValue: SharedLock): ISerializedSharedLock {
        return SharedLock._serialize(deserializedValue);
    }
}
