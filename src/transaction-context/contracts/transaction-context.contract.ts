/**
 * @module TransactionContext
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PropagationTransactionError } from "@/transaction-context/contracts/transaction.errors.js";
import type { AsyncLazy } from "@/utilities/_module.js";

/**
 * Exposes the current connection state of a transaction context: the base
 * client and the active transaction, if any.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionConnection<TClient, TTransactionClient = TClient> = {
    /**
     * The base client that operates outside of any transaction.
     */
    readonly client: TClient;

    /**
     * Whether a transaction is currently active in this context.
     */
    readonly isInTransaction: boolean;

    /**
     * The active transaction-scoped client, or `null` when no transaction is active.
     */
    readonly transaction: TTransactionClient | null;

    /**
     * The client to use for the current scope: the transaction-scoped client
     * when a transaction is active, otherwise the base client.
     */
    readonly current: TClient | TTransactionClient;
};

/**
 * Base transaction context contract. Extends {@link ITransactionConnection}
 * with a fail-fast accessor for the active transaction.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionContextBase<
    TClient = unknown,
    TTransactionClient = TClient,
> = ITransactionConnection<TClient, TTransactionClient> & {
    /**
     * Returns the active transaction-scoped client.
     *
     * Calling this method effectively opts the surrounding code into
     * {@link TRANSACTION_PROPAGATION.MANDATORY | `MANDATORY`} transaction propagation: it
     * assumes a transaction is already active and fails fast otherwise.
     *
     * @returns The active transaction-scoped client.
     * @throws {PropagationTransactionError} When no transaction is currently active.
     */
    getTransactionOrFail(): TTransactionClient;
};

/**
 * Defines how {@link ITransactionContext.run | `run()`} should behave in relation to an
 * existing transaction.
 * - `"REQUIRED"`: uses the existing transaction if available, otherwise starts a new one.
 * - `"SUPPORTS"`: uses the existing transaction if available, otherwise executes non-transactionally.
 * - `"MANDATORY"`: requires an existing transaction, throwing an error if none exists.
 * - `"NEVER"`: must execute without a transaction, throwing an error if one exists.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export const TRANSACTION_PROPAGATION = {
    /**
     * Uses the existing transaction if available, otherwise starts a new one.
     */
    REQUIRED: "REQUIRED",

    /**
     * Uses the existing transaction if available, otherwise executes non-transactionally.
     */
    SUPPORTS: "SUPPORTS",

    /**
     * Requires an existing transaction, throwing an error if none exists.
     */
    MANDATORY: "MANDATORY",

    /**
     * Must execute without a transaction, throwing an error if one exists.
     */
    NEVER: "NEVER",
} as const;

/**
 * A transaction propagation behavior: the union of the values of
 * {@link TRANSACTION_PROPAGATION}. Controls how {@link ITransactionContext.run | `run()`}
 * behaves in relation to an existing transaction.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type TransactionPropagation =
    (typeof TRANSACTION_PROPAGATION)[keyof typeof TRANSACTION_PROPAGATION];

/**
 * A full transaction context. Extends {@link ITransactionContextBase} with the
 * ability to run an invocable inside a transaction scope.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionContext<
    TClient = unknown,
    TTransactionClient = TClient,
> = ITransactionContextBase<TClient, TTransactionClient> & {
    /**
     * Runs the given invocable within the transaction context according to the given
     * propagation mode.
     *
     * @typeParam TValue - The return type of the invocable. Defaults to `void`.
     * @param propagation - How this run behaves in relation to an existing transaction; see
     * {@link TRANSACTION_PROPAGATION}.
     * @param asyncInvocable - The async invocable to run inside the transaction.
     * @returns A promise that resolves with the invocable's result.
     */
    run<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;
};

/**
 * A value that is either a plain client or an {@link ITransactionContext}.
 * Used to accept both raw clients and context-aware wrappers interchangeably.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type TransactionAware<TClient, TTransactionClient = TClient> =
    TClient | ITransactionContext<TClient, TTransactionClient>;
