/**
 * @module Namespace
 */

import { type IEquals } from "@/utilities/_module.js";

/**
 * The `IKey` contracts represents namespacable key.
 * @group Contracts
 */
export interface IKey extends IEquals<IKey> {
    /**
     * The `get` method returns the key without namespace
     */
    get(): string;

    /**
     * The `toString` method returns the key with namespace.
     */
    toString(): string;
}

/**
 * The `INamespace` contract is used for easily namespacing.
 * Note this class used by other component in this library.
 *
 * @group Contracts
 */
export type INamespace = {
    /**
     * The `toString` method returns the namespace prefix.
     */
    toString(): string;

    /**
     * The `create` method returns {@link IKey | `IKey`} object.
     */
    create(key: string): IKey;
};
