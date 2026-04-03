/**
 * @module Lock
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import {
    type ILockAdapter,
    type LockAdapterVariants,
    type LockEventMap,
} from "@/lock/contracts/_module.js";
import {
    Lock,
    type ISerializedLock,
} from "@/lock/implementations/derivables/lock-factory/lock.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    getConstructorName,
    type Invokable,
    type OneOrMore,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type LockSerdeTransformerSettings = {
    adapter: ILockAdapter;
    originalAdapter: LockAdapterVariants;
    namespace: INamespace;
    defaultBlockingInterval: TimeSpan;
    defaultBlockingTime: TimeSpan;
    defaultRefreshTime: TimeSpan;
    eventBus: IEventBus<LockEventMap>;
    serdeTransformerName: string;
    waitUntil: WaitUntil;
};

/**
 * @internal
 */
export class LockSerdeTransformer
    implements ISerdeTransformer<Lock, ISerializedLock>
{
    private readonly adapter: ILockAdapter;
    private readonly originalAdapter: LockAdapterVariants;
    private readonly namespace: INamespace;
    private readonly defaultBlockingInterval: TimeSpan;
    private readonly defaultBlockingTime: TimeSpan;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly eventBus: IEventBus<LockEventMap>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;

    constructor(settings: LockSerdeTransformerSettings) {
        const {
            adapter,
            originalAdapter,
            namespace,
            defaultBlockingInterval,
            defaultBlockingTime,
            defaultRefreshTime,
            eventBus,
            serdeTransformerName,
            waitUntil,
        } = settings;
        this.waitUntil = waitUntil;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.originalAdapter = originalAdapter;
        this.namespace = namespace;
        this.defaultBlockingInterval = defaultBlockingInterval;
        this.defaultBlockingTime = defaultBlockingTime;
        this.defaultRefreshTime = defaultRefreshTime;
        this.eventBus = eventBus;
    }

    get name(): OneOrMore<string> {
        return [
            "lock",
            this.serdeTransformerName,
            getConstructorName(this.originalAdapter),
            this.namespace.toString(),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is Lock {
        const isLock =
            value instanceof Lock && getConstructorName(value) === Lock.name;
        if (!isLock) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            this.serdeTransformerName ===
            value._internal_getSerdeTransformerName();

        const isNamespaceMatching =
            this.namespace.toString() ===
            value._internal_getNamespace().toString();

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value._internal_getAdapter());

        return (
            isSerdTransformerNameMathcing &&
            isNamespaceMatching &&
            isAdapterMatching
        );
    }

    deserialize(serializedValue: ISerializedLock): Lock {
        const { key, ttlInMs, lockId } = serializedValue;
        const keyObj = this.namespace.create(key);

        return new Lock({
            waitUntil: this.waitUntil,
            namespace: this.namespace,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            eventDispatcher: this.eventBus,
            key: keyObj,
            lockId,
            serdeTransformerName: this.serdeTransformerName,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultBlockingInterval: this.defaultBlockingInterval,
            defaultBlockingTime: this.defaultBlockingTime,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: Lock): ISerializedLock {
        return Lock._internal_serialize(deserializedValue);
    }
}
