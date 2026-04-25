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
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/test-utilities"`
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
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `rateLimiterStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IRateLimiterStorageAdapter | `IRateLimiterStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { rateLimiterStorageAdapterTestSuite } from "@daiso-tech/core/rate-limiter/test-utilities";
 * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
 * import { TimeSpan } from "@daiso-tech/core/time-span";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { Serde } from "@daiso-tech/core/serde";
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

                const data = await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, value, expiration);
                    return await trx.find(context, key);
                });

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

                const data = await adapter.transaction(context, async (trx) => {
                    await trx.upsert(
                        context,
                        "a",
                        "b",
                        TimeSpan.fromMinutes(5).toEndDate(
                            new Date("2026-01-01"),
                        ),
                    );
                    await trx.upsert(context, key, value, expiration);
                    return await trx.find(context, key);
                });

                expect(data).toEqual({
                    state: value,
                    expiration,
                } satisfies IRateLimiterData<string>);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter.transaction(context, async (trx) => {
                    return await trx.find(context, noneExistingKey);
                });

                expect(data).toBeNull();
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter.find(context, noneExistingKey);

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

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, value, expiration);
                });
                await adapter.remove(context, key);
                const item = await adapter.find(context, key);

                expect(item).toBeNull();
            });
        });
    });
}
