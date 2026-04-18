/**
 * @module Utilities
 */

/**
 * Pruning contract for objects storing time-limited or expiring data.
 * Implementers provide a way to clean up expired entries.
 *
 * Usage patterns:
 * - Caches: remove expired entries, free memory
 * - Session stores: remove expired sessions
 * - Rate limiters: remove expired attempts
 * - Token managers: revoke expired tokens
 * - File storage: delete old temporary files
 *
 * Typically called periodically (on timer) or on-demand during maintenance.
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities/contracts"`
 * @group Contracts
 */
export type IPrunable = {
    /**
     * Removes all expired entries from storage.
     * Operation may run asynchronously without blocking normal operations.
     *
     * @returns Void promise (resolves when pruning complete)
     * @throws Error if pruning fails (e.g., database connection error)
     */
    removeAllExpired(): Promise<void>;
};
