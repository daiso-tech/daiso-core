import { describe, expect, test } from "vitest";

import {
    type ICacheAdapter,
    type ICacheData,
    type ICacheDataExpiration,
    type IDatabaseCacheAdapter,
    type IDatabaseCacheTransaction,
} from "@/cache/contracts/_module.js";
import { isDatabaseCacheAdapter } from "@/cache/implementations/derivables/cache/is-database-cache-adapter.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

describe("function: isDatabaseCacheAdapter", () => {
    test("Should return true when is IDatabaseCacheAdapter", () => {
        const adapter: IDatabaseCacheAdapter = {
            find(
                _context: IReadableContext,
                _key: string,
            ): Promise<ICacheData | null> {
                throw new Error("Function not implemented.");
            },
            transaction<TValue>(
                _context: IReadableContext,
                _trxFn: InvokableFn<
                    [trx: IDatabaseCacheTransaction],
                    Promise<TValue>
                >,
            ): Promise<TValue> {
                throw new Error("Function not implemented.");
            },
            update(
                _context: IReadableContext,
                _key: string,
                _value: unknown,
            ): Promise<ICacheDataExpiration | null> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _context: IReadableContext,
                _keys: Array<string>,
            ): Promise<Array<ICacheDataExpiration>> {
                throw new Error("Function not implemented.");
            },
            removeAll(_context: IReadableContext): Promise<void> {
                throw new Error("Function not implemented.");
            },
            removeByKeyPrefix(
                _context: IReadableContext,
                _prefix: string,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        expect(isDatabaseCacheAdapter(adapter)).toBe(true);
    });
    test("Should return false when is ICacheAdapter", () => {
        const adapter: ICacheAdapter = {
            get(_context: IReadableContext, _key: string): Promise<unknown> {
                throw new Error("Function not implemented.");
            },
            getAndRemove(
                _context: IReadableContext,
                _key: string,
            ): Promise<unknown> {
                throw new Error("Function not implemented.");
            },
            add(
                _context: IReadableContext,
                _key: string,
                _value: unknown,
                _ttl: TimeSpan | null,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put(
                _context: IReadableContext,
                _key: string,
                _value: unknown,
                _ttl: TimeSpan | null,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update(
                _context: IReadableContext,
                _key: string,
                _value: unknown,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            increment(
                _context: IReadableContext,
                _key: string,
                _value: number,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _context: IReadableContext,
                _keys: Array<string>,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeAll(_context: IReadableContext): Promise<void> {
                throw new Error("Function not implemented.");
            },
            removeByKeyPrefix(
                _context: IReadableContext,
                _prefix: string,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        expect(isDatabaseCacheAdapter(adapter)).toBe(false);
    });
});
