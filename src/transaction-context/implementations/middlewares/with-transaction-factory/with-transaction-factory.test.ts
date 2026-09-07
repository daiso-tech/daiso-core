/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module.js";
import { withTransactionFactory } from "@/transaction-context/implementations/middlewares/with-transaction-factory/with-transaction-factory.js";
import { callInvocable } from "@/utilities/_module.js";

import type {
    ITransactionContext,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module.js";
import type { AsyncLazy } from "@/utilities/_module.js";

describe("function: withTransactionFactory", () => {
    const transactionContext: Pick<ITransactionContext, "run"> = {
        run: async <TValue>(
            _propagation: TransactionPropagation,
            asyncInvocable: AsyncLazy<TValue>,
        ): Promise<TValue> => {
            return callInvocable(asyncInvocable);
        },
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call transactionContext.run method", async () => {
        const spy = vi.spyOn(transactionContext, "run");

        const withTransaction = withTransactionFactory(transactionContext);

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        const argValue = "value";
        await use(fn, withTransaction())(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.REQUIRED,
            expect.any(Function),
        );
    });
    test("Should use the configured propagation", async () => {
        const spy = vi.spyOn(transactionContext, "run");

        const withTransaction = withTransactionFactory(transactionContext);

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        const argValue = "value";
        await use(
            fn,
            withTransaction(TRANSACTION_PROPAGATION.MANDATORY),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.MANDATORY,
            expect.any(Function),
        );
    });
    test("Should invoke the wrapped function when the transaction context runs the invocable", async () => {
        const spy = vi.spyOn(transactionContext, "run");

        const withTransaction = withTransactionFactory(transactionContext);
        let wasInvoked = false;
        function fn(_value: string): Promise<void> {
            wasInvoked = true;
            return Promise.resolve();
        }

        await use(fn, withTransaction())("value");

        expect(wasInvoked).toBe(true);
        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withTransaction = withTransactionFactory(transactionContext);

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(fn, withTransaction());

        expect(await wrapped("2", "3")).toBe("2-3");
    });
});
