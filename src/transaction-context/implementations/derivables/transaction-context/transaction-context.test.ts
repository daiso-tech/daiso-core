import { beforeEach, describe, expect, test, vi } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    PropagationTransactionError,
    TRANSACTION_PROPAGATION,
} from "@/transaction-context/contracts/_module.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";

type Client = { readonly value: string };
const baseClient: Client = { value: "base" };
const transactionClient: Client = { value: "transaction" };

describe("class: TransactionContext", () => {
    const adapter = new NoOpTransactionAdapter<Client, Client>(baseClient);
    const transactionContext = new TransactionContext<Client, Client>({
        token: contextToken<Client>("transaction"),
        adapter,
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("getters:", () => {
        test("Should return the base client when no transaction is active", () => {
            expect(transactionContext.client).toBe(baseClient);
            expect(transactionContext.transaction).toBeNull();
            expect(transactionContext.isInTransaction).toBe(false);
            expect(transactionContext.current).toBe(baseClient);
        });
        test("Should expose the transaction client while a transaction is active", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                () => {
                    expect(transactionContext.isInTransaction).toBe(true);
                    expect(transactionContext.transaction).toBe(
                        transactionClient,
                    );
                    expect(transactionContext.current).toBe(transactionClient);
                    return Promise.resolve();
                },
            );

            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
            expect(transactionContext.isInTransaction).toBe(false);
            expect(transactionContext.transaction).toBeNull();
            expect(() => transactionContext.getTransactionOrFail()).toThrow(
                PropagationTransactionError,
            );
        });
    });
    describe("method: getTransactionOrFail", () => {
        test("Should throw a PropagationTransactionError when no transaction is active", () => {
            expect(() => transactionContext.getTransactionOrFail()).toThrow(
                PropagationTransactionError,
            );
        });
        test("Should return the transaction client while a transaction is active", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                () => {
                    expect(transactionContext.getTransactionOrFail()).toBe(
                        transactionClient,
                    );
                    return Promise.resolve();
                },
            );

            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: run (REQUIRED)", () => {
        test("Should start a transaction and commit it after the invocable succeeds", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });
            const invocable = (): Promise<string> => Promise.resolve("value");

            const result = await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                invocable,
            );

            expect(result).toBe("value");
            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
        test("Should propagate an error when starting the transaction fails", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi
                .spyOn(adapter, "start")
                .mockRejectedValue(new Error("start failed"));
            const invocable = vi.fn(() => Promise.resolve("value"));

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                invocable,
            );

            await expect(promise).rejects.toThrow("start failed");
            expect(startSpy).toHaveBeenCalledOnce();
            expect(invocable).not.toHaveBeenCalled();
            expect(commitSpy).not.toHaveBeenCalled();
            expect(abortSpy).not.toHaveBeenCalled();
        });
        test("Should propagate a commit failure and not abort", async () => {
            const commitSpy = vi
                .fn(() => Promise.resolve())
                .mockRejectedValueOnce(new Error("commit failed"));
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });
            const invocable = (): Promise<string> => Promise.resolve("value");

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                invocable,
            );

            await expect(promise).rejects.toThrow("commit failed");
            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
        test("Should abort and propagate the invocable error when the invocable fails", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });
            const invocable = (): Promise<string> =>
                Promise.reject(new Error("callback failed"));

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                invocable,
            );

            await expect(promise).rejects.toThrow("callback failed");
            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).not.toHaveBeenCalled();
            expect(abortSpy).toHaveBeenCalledOnce();
        });
        test("Should throw an AggregateError when the invocable and the abort both fail", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi
                .fn(() => Promise.resolve())
                .mockRejectedValueOnce(new Error("abort failed"));
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });
            const invocable = (): Promise<string> =>
                Promise.reject(new Error("callback failed"));

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                invocable,
            );

            await expect(promise).rejects.toThrow(AggregateError);
            await expect(promise).rejects.toThrow(
                "Transaction callback and abort both failed",
            );
            expect(startSpy).toHaveBeenCalledOnce();
            expect(abortSpy).toHaveBeenCalledOnce();
        });
        test("Should run the invocable outside a transaction when the started transaction has no client", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: null,
                commit: commitSpy,
                abort: abortSpy,
            });

            const result = await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                () => {
                    expect(transactionContext.isInTransaction).toBe(false);
                    expect(transactionContext.transaction).toBeNull();
                    return Promise.resolve("value");
                },
            );

            expect(result).toBe("value");
            expect(startSpy).toHaveBeenCalledOnce();
            expect(commitSpy).not.toHaveBeenCalled();
            expect(abortSpy).not.toHaveBeenCalled();
            expect(transactionContext.isInTransaction).toBe(false);
        });
        test("Should reuse the active transaction and not start a new one", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    const nestedResult = await transactionContext.run(
                        TRANSACTION_PROPAGATION.REQUIRED,
                        () => Promise.resolve("nested"),
                    );
                    expect(nestedResult).toBe("nested");
                },
            );

            expect(startSpy).toHaveBeenCalledTimes(1);
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: run (SUPPORTS)", () => {
        test("Should run the invocable without starting a transaction", async () => {
            const startSpy = vi.spyOn(adapter, "start");
            const invocable = (): Promise<string> => Promise.resolve("value");

            const result = await transactionContext.run(
                TRANSACTION_PROPAGATION.SUPPORTS,
                invocable,
            );

            expect(result).toBe("value");
            expect(startSpy).not.toHaveBeenCalled();
        });
        test("Should propagate the invocable error without starting a transaction", async () => {
            const startSpy = vi.spyOn(adapter, "start");
            const invocable = (): Promise<string> =>
                Promise.reject(new Error("callback failed"));

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.SUPPORTS,
                invocable,
            );

            await expect(promise).rejects.toThrow("callback failed");
            expect(startSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: run (MANDATORY)", () => {
        test("Should throw a PropagationTransactionError when no transaction is active", async () => {
            const startSpy = vi.spyOn(adapter, "start");
            const invocable = vi.fn(() => Promise.resolve("value"));

            const promise = transactionContext.run(
                TRANSACTION_PROPAGATION.MANDATORY,
                invocable,
            );

            await expect(promise).rejects.toThrow(PropagationTransactionError);
            await expect(promise).rejects.toThrow(/MANDATORY/);
            expect(startSpy).not.toHaveBeenCalled();
            expect(invocable).not.toHaveBeenCalled();
        });
        test("Should run the invocable when a transaction is active", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    const result = await transactionContext.run(
                        TRANSACTION_PROPAGATION.MANDATORY,
                        () => Promise.resolve("mandatory"),
                    );
                    expect(result).toBe("mandatory");
                },
            );

            expect(startSpy).toHaveBeenCalledTimes(1);
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
    });
    describe("method: run (NEVER)", () => {
        test("Should run the invocable when no transaction is active", async () => {
            const startSpy = vi.spyOn(adapter, "start");
            const invocable = (): Promise<string> => Promise.resolve("value");

            const result = await transactionContext.run(
                TRANSACTION_PROPAGATION.NEVER,
                invocable,
            );

            expect(result).toBe("value");
            expect(startSpy).not.toHaveBeenCalled();
        });
        test("Should throw a PropagationTransactionError when a transaction is active", async () => {
            const commitSpy = vi.fn(() => Promise.resolve());
            const abortSpy = vi.fn(() => Promise.resolve());
            const startSpy = vi.spyOn(adapter, "start").mockResolvedValue({
                client: transactionClient,
                commit: commitSpy,
                abort: abortSpy,
            });

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    const innerInvocable = vi.fn(() => Promise.resolve());
                    const promise = transactionContext.run(
                        TRANSACTION_PROPAGATION.NEVER,
                        innerInvocable,
                    );
                    await expect(promise).rejects.toThrow(
                        PropagationTransactionError,
                    );
                    await expect(promise).rejects.toThrow(/NEVER/);
                    expect(innerInvocable).not.toHaveBeenCalled();
                },
            );

            expect(startSpy).toHaveBeenCalledTimes(1);
            expect(commitSpy).toHaveBeenCalledOnce();
            expect(abortSpy).not.toHaveBeenCalled();
        });
    });
});
