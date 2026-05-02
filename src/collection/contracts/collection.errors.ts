/**
 * @module Collection
 */

import { type InferInstance } from "@/utilities/_module.js";

/**
 * The error is thrown when the item is not found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export class ItemNotFoundCollectionError extends Error {
    static create(cause?: unknown): ItemNotFoundCollectionError {
        return new ItemNotFoundCollectionError("Item was not found", cause);
    }

    /**
     * Note: Do not instantiate `ItemNotFoundCollectionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = ItemNotFoundCollectionError.name;
    }
}

/**
 * The error is thrown when multiple items are found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export class MultipleItemsFoundCollectionError extends Error {
    static create(cause?: unknown): MultipleItemsFoundCollectionError {
        return new MultipleItemsFoundCollectionError(
            "Multiple items were found",
            cause,
        );
    }

    /**
     * Note: Do not instantiate `MultipleItemsFoundCollectionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = MultipleItemsFoundCollectionError.name;
    }
}

/**
 * The error is thrown when calling a method that needs the collection not to be empty. For example, the `average` method requires the collection not to be empty.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export class EmptyCollectionError extends Error {
    static create(cause?: unknown): EmptyCollectionError {
        return new EmptyCollectionError(
            "Collection is empty therby operation cannot be performed",
            cause,
        );
    }

    /**
     * Note: Do not instantiate `EmptyCollectionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = EmptyCollectionError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export const COLLECTION_ERRORS = {
    ItemNotFound: ItemNotFoundCollectionError,
    MultipleItemsFound: MultipleItemsFoundCollectionError,
    Empty: EmptyCollectionError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export type AllCollectionErrors = InferInstance<
    (typeof COLLECTION_ERRORS)[keyof typeof COLLECTION_ERRORS]
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Errors
 */
export function isCollectionError(
    value: unknown,
): value is AllCollectionErrors {
    for (const errorClass of Object.values(COLLECTION_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
