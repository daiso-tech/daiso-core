/**
 * @module RateLimiter
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type IRateLimiterData,
    type IRateLimiterStorageAdapter,
} from "@/rate-limiter/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/test-utilities"`
 * @group TestUtilities
 */
export type RateLimiterStorageAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IRateLimiterStorageAdapter>;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "eridu-tech/execution-context"
     * import { NoOpExecutionContextAdapter } from "eridu-tech/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `rateLimiterStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IRateLimiterStorageAdapter | `IRateLimiterStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { rateLimiterStorageAdapterTestSuite } from "eridu-tech/rate-limiter/test-utilities";
 * import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
 * import { TimeSpan } from "eridu-tech/time-span";
 * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
 * import { Serde } from "eridu-tech/serde";
 *
 * describe("class: MemoryRateLimiterStorageAdapter", () => {
 *     rateLimiterStorageAdapterTestSuite({
 *         createAdapter: () =>
 *             new MemoryRateLimiterStorageAdapter(),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function rateLimiterStorageAdapterTestSuite(
    settings: RateLimiterStorageAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: IRateLimiterStorageAdapter<string>;

    describe("IRateLimiterStorageAdapter tests:", () => {
        beforeEach_(async () => {
            adapter =
                (await createAdapter()) as IRateLimiterStorageAdapter<string>;
        });

        describe("method: transaction upsert / find", () => {
            test("Should insert item when key doesnt exists", async () => {
                const key = "a";
                const value = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate(
                    new Date("2026-01-01"),
                );

                const data = await adapter.transaction(async (trx) => {
                    await trx.upsert(key, value, expiration, context);
                    return await trx.find(key, context);
                }, context);

                expect(data).toEqual({
                    state: value,
                    expiration,
                } satisfies IRateLimiterData<string>);
            });
            test("Should update item when key exists", async () => {
                const key = "d";
                const value = "f";
                const expiration = TimeSpan.fromHours(5).toEndDate(
                    new Date("2026-01-01"),
                );

                const data = await adapter.transaction(async (trx) => {
                    await trx.upsert(
                        "a",
                        "b",
                        TimeSpan.fromMinutes(5).toEndDate(
                            new Date("2026-01-01"),
                        ),
                        context,
                    );
                    await trx.upsert(key, value, expiration, context);
                    return await trx.find(key, context);
                }, context);

                expect(data).toEqual({
                    state: value,
                    expiration,
                } satisfies IRateLimiterData<string>);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter.transaction(async (trx) => {
                    return await trx.find(noneExistingKey, context);
                }, context);

                expect(data).toBeNull();
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter.find(noneExistingKey, context);

                expect(data).toBeNull();
            });
        });
        describe("method: remove", () => {
            test("Should remove item when key exists", async () => {
                const key = "a";
                const value = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate(
                    new Date("2026-01-01"),
                );

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, value, expiration, context);
                }, context);
                await adapter.remove(key, context);
                const item = await adapter.find(key, context);

                expect(item).toBeNull();
            });
        });
    });
}
