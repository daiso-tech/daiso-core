import { describe, test, expect } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/execution-context.contract.js";
import {
    type ILockAdapter,
    type ILockAdapterState,
    type ILockFactoryBase,
    type LockFactoryCreateSettings,
    type ILock,
    type IDatabaseLockAdapter,
    type IDatabaseLockTransaction,
    type ILockData,
    type ILockExpirationData,
} from "@/lock/contracts/_module.js";
import { isLockFactory } from "@/lock/implementations/derivables/lock-factory/is-lock-factory.js";
import { type TimeSpan } from "@/time-span/implementations/time-span.js";
import { type InvokableFn } from "@/utilities/_module.js";

describe("function: isLockFactory", () => {
    test("Should return true when given ILockFactoryBase", () => {
        const lockFactory: ILockFactoryBase = {
            create(_key: string, _settings?: LockFactoryCreateSettings): ILock {
                throw new Error("Function not implemented.");
            },
        };

        expect(isLockFactory(lockFactory)).toBe(true);
    });
    test("Should return false when given ILockAdapter", () => {
        const lockAdapter: ILockAdapter = {
            acquire(
                _context: IReadableContext,
                _key: string,
                _lockId: string,
                _ttl: TimeSpan | null,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            release(
                _context: IReadableContext,
                _key: string,
                _lockId: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            forceRelease(
                _context: IReadableContext,
                _key: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            refresh(
                _context: IReadableContext,
                _key: string,
                _lockId: string,
                _ttl: TimeSpan,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getState(
                _context: IReadableContext,
                _key: string,
            ): Promise<ILockAdapterState | null> {
                throw new Error("Function not implemented.");
            },
        };

        expect(isLockFactory(lockAdapter)).toBe(false);
    });
    test("Should return false when given IDatabaseLockAdapter", () => {
        const databaseLockAdapter: IDatabaseLockAdapter = {
            transaction<TReturn>(
                _context: IReadableContext,
                _fn: InvokableFn<
                    [transaction: IDatabaseLockTransaction],
                    Promise<TReturn>
                >,
            ): Promise<TReturn> {
                throw new Error("Function not implemented.");
            },
            remove(
                _context: IReadableContext,
                _key: string,
            ): Promise<ILockExpirationData | null> {
                throw new Error("Function not implemented.");
            },
            removeIfOwner(
                _context: IReadableContext,
                _key: string,
                _lockId: string,
            ): Promise<ILockData | null> {
                throw new Error("Function not implemented.");
            },
            updateExpiration(
                _context: IReadableContext,
                _key: string,
                _lockId: string,
                _expiration: Date,
            ): Promise<number> {
                throw new Error("Function not implemented.");
            },
            find(
                _context: IReadableContext,
                _key: string,
            ): Promise<ILockData | null> {
                throw new Error("Function not implemented.");
            },
        };

        expect(isLockFactory(databaseLockAdapter)).toBe(false);
    });
});
