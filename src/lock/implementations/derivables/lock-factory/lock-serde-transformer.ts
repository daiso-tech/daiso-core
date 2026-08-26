/**
 * @module Lock
 */

import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { getConstructorName } from "@/utilities/_module.js";

import type { ILockAdapter } from "@/lock/contracts/_module.js";
import type { ISerializedLock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module.js";
import type { OneOrMore } from "@/utilities/_module.js";

/**
 * @internal
 */
export type LockSerdeTransformerSettings = {
    adapter: ILockAdapter;
    defaultRefreshTime: TimeSpan;
    serdeTransformerName: string;
};

/**
 * @internal
 */
export class LockSerdeTransformer implements ISerdeTransformer<
    Lock,
    ISerializedLock
> {
    private readonly adapter: ILockAdapter;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;

    constructor(settings: LockSerdeTransformerSettings) {
        const { adapter, defaultRefreshTime, serdeTransformerName } = settings;

        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return [
            "lock",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
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
            value.internalGetSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value.internalGetAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedLock): Lock {
        const { key, ttlInMs, lockId } = serializedValue;

        return new Lock({
            adapter: this.adapter,
            key,
            lockId,
            serdeTransformerName: this.serdeTransformerName,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: Lock): ISerializedLock {
        return Lock.internalSerialize(deserializedValue);
    }
}
