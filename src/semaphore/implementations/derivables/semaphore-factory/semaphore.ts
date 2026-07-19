/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
    type ISemaphore,
    FailedRefreshSemaphoreError,
    LimitReachedSemaphoreError,
    FailedReleaseSemaphoreError,
    SEMAPHORE_STATE,
    type ISemaphoreState,
} from "@/semaphore/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { resolveLazyable, type AsyncLazy } from "@/utilities/_module.js";

/**
 * @internal
 */
export type ISerializedSemaphore = {
    version: "1";
    key: string;
    slotId: string;
    limit: number;
    ttlInMs: number | null;
};

/**
 * @internal
 */
export type SemaphoreSettings = {
    slotId: string;
    limit: number;
    serdeTransformerName: string;
    adapter: ISemaphoreAdapter;
    originalAdapter: SemaphoreAdapterVariants;
    key: IKey;
    ttl: TimeSpan | null;
    defaultRefreshTime: TimeSpan;
    namespace: INamespace;
    context: IReadableContext;
};

/**
 * @internal
 */
export class Semaphore implements ISemaphore {
    /**
     * @internal
     */
    static _serialize(deserializedValue: Semaphore): ISerializedSemaphore {
        return {
            version: "1",
            key: deserializedValue._key.get(),
            limit: deserializedValue.limit,
            slotId: deserializedValue.slotId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly slotId: string;
    private readonly limit: number;
    private readonly adapter: ISemaphoreAdapter;
    private readonly originalAdapter: SemaphoreAdapterVariants;
    private readonly _key: IKey;
    private _ttl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;
    private readonly context: IReadableContext;

    constructor(settings: SemaphoreSettings) {
        const {
            slotId,
            limit,
            adapter,
            originalAdapter,
            key,
            ttl,
            serdeTransformerName,
            defaultRefreshTime,
            namespace,
            context,
        } = settings;

        this.context = context;
        this.namespace = namespace;
        this.slotId = slotId;
        this.limit = limit;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this._key = key;
        this._ttl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
        this.originalAdapter = originalAdapter;
    }

    _getNamespace(): INamespace {
        return this.namespace;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): SemaphoreAdapterVariants {
        return this.originalAdapter;
    }

    async runOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireOrFail();
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.release();
        }
    }
    async acquire(): Promise<boolean> {
        return await this.adapter.acquire({
            context: this.context,
            key: this._key.toString(),
            slotId: this.slotId,
            limit: this.limit,
            ttl: this._ttl,
        });
    }

    async acquireOrFail(): Promise<void> {
        const hasAquired = await this.acquire();
        if (!hasAquired) {
            throw LimitReachedSemaphoreError.create(this._key);
        }
    }

    async release(): Promise<boolean> {
        return await this.adapter.release(
            this.context,
            this._key.toString(),
            this.slotId,
        );
    }

    async releaseOrFail(): Promise<void> {
        const hasReleased = await this.release();
        if (!hasReleased) {
            throw FailedReleaseSemaphoreError.create(this._key, this.slotId);
        }
    }

    async forceReleaseAll(): Promise<boolean> {
        return await this.adapter.forceReleaseAll(
            this.context,
            this._key.toString(),
        );
    }

    async refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        const hasRefreshed = await this.adapter.refresh(
            this.context,
            this._key.toString(),
            this.slotId,
            TimeSpan.fromTimeSpan(ttl),
        );
        if (hasRefreshed) {
            this._ttl = TimeSpan.fromTimeSpan(ttl);
        }
        return hasRefreshed;
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshSemaphoreError.create(this._key, this.slotId);
        }
    }

    get id(): string {
        return this.slotId;
    }

    get ttl(): TimeSpan | null {
        return this._ttl;
    }

    get key(): IKey {
        return this._key;
    }

    async getState(): Promise<ISemaphoreState> {
        const state = await this.adapter.getState(
            this.context,
            this._key.toString(),
        );
        if (state === null) {
            return {
                type: SEMAPHORE_STATE.EXPIRED,
            };
        }

        if (state.acquiredSlots.size >= state.limit) {
            return {
                type: SEMAPHORE_STATE.LIMIT_REACHED,
                limit: state.limit,
                acquiredSlots: [...state.acquiredSlots.keys()],
            };
        }

        const slot = state.acquiredSlots.get(this.slotId);
        if (slot === undefined) {
            return {
                type: SEMAPHORE_STATE.UNACQUIRED,
                acquiredSlots: [...state.acquiredSlots.keys()],
                acquiredSlotsCount: state.acquiredSlots.size,
                freeSlotsCount: state.limit - state.acquiredSlots.size,
                limit: state.limit,
            };
        }

        return {
            type: SEMAPHORE_STATE.ACQUIRED,
            acquiredSlots: [...state.acquiredSlots.keys()],
            acquiredSlotsCount: state.acquiredSlots.size,
            freeSlotsCount: state.limit - state.acquiredSlots.size,
            limit: state.limit,
            remainingTime:
                slot === null
                    ? null
                    : TimeSpan.fromDateRange({
                          start: new Date(),
                          end: slot,
                      }),
        };
    }
}
