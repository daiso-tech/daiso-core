/**
 * @module TransactionContext
 */

import type { TransactionPropagation } from "@/transaction-context/contracts/transaction-context.contract.js";

/**
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Errors
 */
export class PropagationTransactionError extends Error {
    static create(
        propagation: TransactionPropagation,
        cause?: unknown,
    ): PropagationTransactionError {
        return new PropagationTransactionError(
            `Cannot run with transaction propagation "${propagation}" in the current transaction state`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `RequiredTransactionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = PropagationTransactionError.name;
    }
}
