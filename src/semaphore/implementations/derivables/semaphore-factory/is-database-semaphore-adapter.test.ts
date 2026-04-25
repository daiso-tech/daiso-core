import { describe, expect, test } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type IDatabaseSemaphoreAdapter,
    type IDatabaseSemaphoreTransaction,
    type ISemaphoreSlotExpirationData,
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import { isDatabaseSemaphoreAdapter } from "@/semaphore/implementations/derivables/semaphore-factory/is-database-semaphore-adapter.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

describe("function: isDatabaseSemaphoreAdapter", () => {
    test("Should return true when given IDatabaseSemaphoreAdapter", () => {
        const adapter: IDatabaseSemaphoreAdapter = {
            transaction<TValue>(
                _context: IReadableContext,
                _fn: InvokableFn<
                    [transaction: IDatabaseSemaphoreTransaction],
                    Promise<TValue>
                >,
            ): Promise<TValue> {
                throw new Error("Function not implemented.");
            },
            removeSlot(
                _context: IReadableContext,
                _key: string,
                _slotId: string,
            ): Promise<ISemaphoreSlotExpirationData | null> {
                throw new Error("Function not implemented.");
            },
            removeAllSlots(
                _context: IReadableContext,
                _key: string,
            ): Promise<Array<ISemaphoreSlotExpirationData>> {
                throw new Error("Function not implemented.");
            },
            updateExpiration(
                _context: IReadableContext,
                _key: string,
                _slotId: string,
                _expiration: Date,
            ): Promise<number> {
                throw new Error("Function not implemented.");
            },
        };
        expect(isDatabaseSemaphoreAdapter(adapter)).toBe(true);
    });
    test("Should return false when given ISemaphoreAdapter", () => {
        const adapter: ISemaphoreAdapter = {
            acquire(_settings: SemaphoreAcquireSettings): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            release(
                _context: IReadableContext,
                _key: string,
                _slotId: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            forceReleaseAll(
                _context: IReadableContext,
                _key: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            refresh(
                _context: IReadableContext,
                _key: string,
                _slotId: string,
                _ttl: TimeSpan,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getState(
                _context: IReadableContext,
                _key: string,
            ): Promise<ISemaphoreAdapterState | null> {
                throw new Error("Function not implemented.");
            },
        };
        expect(isDatabaseSemaphoreAdapter(adapter)).toBe(false);
    });
});
