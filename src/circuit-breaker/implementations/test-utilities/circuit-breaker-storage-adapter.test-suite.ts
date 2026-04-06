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
import { type IContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
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

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IContext;
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
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
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

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, input);
                });

                const value = await adapter.find(context, key);

                expect(value).toBe(input);
            });
            test("Should update key when exists", async () => {
                const key = "a";
                const input1 = "b";
                const input2 = "c";

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, input1);
                    await trx.upsert(context, key, input2);
                });

                const value = await adapter.find(context, key);
                expect(value).toBe(input2);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const value = await adapter.transaction(
                    context,
                    async (trx) => {
                        return await trx.find(context, noneExistingKey);
                    },
                );

                expect(value).toBeNull();
            });
            test("Should return the inserted value when key exists", async () => {
                const key = "a";
                const input = "b";

                const value = await adapter.transaction(
                    context,
                    async (trx) => {
                        await trx.upsert(context, key, input);
                        return await trx.find(context, key);
                    },
                );

                expect(value).toBe(input);
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const value = await adapter.find(context, noneExistingKey);

                expect(value).toBeNull();
            });
            test("Should return the inserted value when key exists", async () => {
                const key = "a";
                const input = "b";

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, input);
                });
                const value = await adapter.find(context, key);

                expect(value).toBe(input);
            });
        });
        describe("method: remove", () => {
            test("Should remove key when exists", async () => {
                const key = "a";

                await adapter.transaction(context, async (trx) => {
                    await trx.upsert(context, key, "value");
                });

                await adapter.remove(context, key);

                const value = await adapter.find(context, key);
                expect(value).toBeNull();
            });
        });
    });
}
