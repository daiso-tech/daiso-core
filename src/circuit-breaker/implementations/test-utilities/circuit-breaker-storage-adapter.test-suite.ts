/**
 * @module CircuitBreaker
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
} from "vitest";

import { type ICircuitBreakerStorageAdapter } from "@/circuit-breaker/contracts/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export type CircuitBreakerStorageAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICircuitBreakerStorageAdapter>;
};

/**
 * The `circuitBreakerStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link ICircuitBreakerStorageAdapter | `ICircuitBreakerStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { afterEach, beforeEach, describe, expect, test } from "vitest";
 * import { circuitBreakerStorageAdapterTestSuite } from "@daiso-tech/core/circuit-breaker/test-utilities";
 * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
 * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { Serde } from "@daiso-tech/core/serde";
 *
 * describe("class: MemoryCircuitBreakerStorageAdapter", () => {
 *     circuitBreakerStorageAdapterTestSuite({
 *         createAdapter: () =>
 *             new MemoryCircuitBreakerStorageAdapter(),
 *         test,
 *         beforeEach,
 *         expect,
 *         describe,
 *     });
 * });
 * ```
 */
export function circuitBreakerStorageAdapterTestSuite(
    settings: CircuitBreakerStorageAdapterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, describe, beforeEach } = settings;
    let adapter: ICircuitBreakerStorageAdapter<string>;

    describe("ICircuitBreakerStorageAdapter tests:", () => {
        beforeEach(async () => {
            adapter =
                (await createAdapter()) as ICircuitBreakerStorageAdapter<string>;
        });

        describe("method: transaction upsert", () => {
            test("Should add key when doesnt exists", async () => {
                const key = "a";
                const input = "b";

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, input);
                });

                const value = await adapter.find(key);

                expect(value).toBe(input);
            });
            test("Should update key when exists", async () => {
                const key = "a";
                const input1 = "b";
                const input2 = "c";

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, input1);
                    await trx.upsert(key, input2);
                });

                const value = await adapter.find(key);
                expect(value).toBe(input2);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const value = await adapter.transaction(async (trx) => {
                    return await trx.find(noneExistingKey);
                });

                expect(value).toBeNull();
            });
            test("Should return the inserted value when key exists", async () => {
                const key = "a";
                const input = "b";

                const value = await adapter.transaction(async (trx) => {
                    await trx.upsert(key, input);
                    return await trx.find(key);
                });

                expect(value).toBe(input);
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const value = await adapter.find(noneExistingKey);

                expect(value).toBeNull();
            });
            test("Should return the inserted value when key exists", async () => {
                const key = "a";
                const input = "b";

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, input);
                });
                const value = await adapter.find(key);

                expect(value).toBe(input);
            });
        });
        describe("method: remove", () => {
            test("Should remove key when exists", async () => {
                const key = "a";

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, "value");
                });

                await adapter.remove(key);

                const value = await adapter.find(key);
                expect(value).toBeNull();
            });
        });
    });
}
