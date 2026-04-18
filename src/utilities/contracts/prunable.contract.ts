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
     *
     * @returns {Promise<void>} Promise that resolves when pruning is complete
     * @throws {Error} If pruning fails due to I/O errors, permission issues, or resource constraints
     */
    removeAllExpired(): Promise<void>;
};
