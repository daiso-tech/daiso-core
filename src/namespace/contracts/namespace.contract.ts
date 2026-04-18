/**
 * @module Namespace
 */

import { type IEquals } from "@/utilities/_module.js";

/**
 * Represents a hierarchically-organized key that can be namespaced.
 * This interface enforces equality comparison to ensure keys with the same namespace and value are considered equal.
 *
 * IMPORT_PATH: `"@daiso-tech/core/namespace/contracts"`
 * @group Contracts
 */
export interface IKey extends IEquals<IKey> {
    /**
     * Gets the key without the namespace prefix.
     *
     * @returns The raw key string without namespace
     */
    get(): string;

    /**
     * Gets the key with the full namespace prefix applied.
     *
     * @returns The namespaced key string representation
     */
    toString(): string;
}

/**
 * Factory interface for creating namespaced keys.
 * Provides a way to organize keys into logical groups/namespaces for better key management and collision prevention.
 * This contract is used throughout the library for creating properly namespaced keys.
 *
 * IMPORT_PATH: `"@daiso-tech/core/namespace/contracts"`
 * @group Contracts
 */
export type INamespace = {
    /**
     * Gets the namespace prefix string.
     * This prefix is automatically prepended to all keys created by this namespace.
     *
     * @returns The namespace prefix
     */
    toString(): string;

    /**
     * Creates a new {@link IKey | `IKey`} object within this namespace.
     * The returned key will include this namespace's prefix.
     *
     * @param key - The raw key string (namespace prefix will be added automatically)
     * @returns A new namespaced key instance
     */
    create(key: string): IKey;
};
