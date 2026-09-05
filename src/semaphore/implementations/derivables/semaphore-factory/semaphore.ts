/**
 * @module Semaphore
 */

import {
    FailedRefreshSemaphoreError,
    LimitReachedSemaphoreError,
    FailedReleaseSemaphoreError,
    SEMAPHORE_STATE,
} from "@/semaphore/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { resolveLazyable } from "@/utilities/_module.js";

import type {
    ISemaphoreAdapter,
    ISemaphore,
    ISemaphoreState,
} from "@/semaphore/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { AsyncLazy } from "@/utilities/_module.js";

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
    key: string;
    ttl: TimeSpan | null;
    defaultRefreshTime: TimeSpan;
};

/**
 * @internal
 */
export class Semaphore implements ISemaphore {
    /**
     * @internal
     */
    static internalSerialize(
        deserializedValue: Semaphore,
    ): ISerializedSemaphore {
        return {
            version: "1",
            key: deserializedValue.internalKey,
            limit: deserializedValue.limit,
            slotId: deserializedValue.slotId,
            ttlInMs: deserializedValue.internalTtl?.toMilliseconds() ?? null,
        };
    }

    private readonly slotId: string;
    private readonly limit: number;
    private readonly adapter: ISemaphoreAdapter;
    private readonly internalKey: string;
    private internalTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;

    constructor(settings: SemaphoreSettings) {
        const {
            slotId,
            limit,
            adapter,
            key,
            ttl,
            serdeTransformerName,
            defaultRefreshTime,
        } = settings;

        this.slotId = slotId;
        this.limit = limit;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.internalKey = key;
        this.internalTtl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    internalGetSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    internalGetAdapter(): ISemaphoreAdapter {
        return this.adapter;
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireOrFail();
        try {
            return await resolveLazyable(asyncInvocable);
        } finally {
            await this.release();
        }
    }
    async acquire(): Promise<boolean> {
        return await this.adapter.acquire({
            key: this.internalKey,
            slotId: this.slotId,
            limit: this.limit,
            ttl: this.internalTtl?.toEndDate() ?? null,
        });
    }

    async acquireOrFail(): Promise<void> {
        const hasAcquired = await this.acquire();
        if (!hasAcquired) {
            throw LimitReachedSemaphoreError.create(this.internalKey);
        }
    }

    async release(): Promise<boolean> {
        return await this.adapter.release(this.internalKey, this.slotId);
    }

    async releaseOrFail(): Promise<void> {
        const hasReleased = await this.release();
        if (!hasReleased) {
            throw FailedReleaseSemaphoreError.create(
                this.internalKey,
                this.slotId,
            );
        }
    }

    async forceReleaseAll(): Promise<boolean> {
        return await this.adapter.forceReleaseAll(this.internalKey);
    }

    async refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        const hasRefreshed = await this.adapter.refresh(
            this.internalKey,
            this.slotId,
            TimeSpan.fromTimeSpan(ttl).toEndDate(),
        );
        if (hasRefreshed) {
            this.internalTtl = TimeSpan.fromTimeSpan(ttl);
        }
        return hasRefreshed;
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshSemaphoreError.create(
                this.internalKey,
                this.slotId,
            );
        }
    }

    get id(): string {
        return this.slotId;
    }

    get ttl(): TimeSpan | null {
        return this.internalTtl;
    }

    get key(): string {
        return this.internalKey;
    }

    async getState(): Promise<ISemaphoreState> {
        const state = await this.adapter.getState(this.internalKey);
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
