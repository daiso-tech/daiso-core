/**
 * @module Utilities
 */

/**
 * Equality comparison contract.
 * Implementers support checking if two values are equal in meaning/value.
 *
 * Different from JavaScript === operator:
 * - Can define custom equality logic (e.g., deep object equality)
 * - Value objects can be equal even when not the same reference
 * - Useful for domain-specific comparisons
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IEquals<TValue> = {
    /**
     * Checks if this value equals the given value.
     * Implementation defines what "equal" means for this type.
     *
     * @param value - The value to compare against
     * @returns True if values are equal, false otherwise
     */
    equals(value: TValue): boolean;
};

/**
 * Greater-than comparison contract.
 * Implementers support checking if one value is greater/larger/after another.
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IGreaterThan<TValue> = {
    /**
     * Checks if this value is greater than the given value.
     *
     * @param value - The value to compare against
     * @returns True if this > value, false otherwise
     */
    gt(value: TValue): boolean;
};

/**
 * Greater-than-or-equal comparison contract.
 * Implementers support checking if one value is greater/larger/after or equal to another.
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IGreaterThanOrEquals<TValue> = {
    /**
     * Checks if this value is greater than or equal to the given value.
     *
     * @param value - The value to compare against
     * @returns True if this >= value, false otherwise
     */
    gte(value: TValue): boolean;
};

/**
 * Less-than comparison contract.
 * Implementers support checking if one value is less/smaller/before another.
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ILessThan<TValue> = {
    /**
     * Checks if this value is less than the given value.
     *
     * @param value - The value to compare against
     * @returns True if this < value, false otherwise
     */
    lt(value: TValue): boolean;
};

/**
 * Less-than-or-equal comparison contract.
 * Implementers support checking if one value is less/smaller/before or equal to another.
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ILessThanOrEquals<TValue> = {
    /**
     * Checks if this value is less than or equal to the given value.
     *
     * @param value - The value to compare against
     * @returns True if this <= value, false otherwise
     */
    lte(value: TValue): boolean;
};

/**
 * Complete comparable type combining all comparison operations.
 * Implementers support full ordering: equality, greater-than, and less-than.
 *
 * Types implementing this contract can be:
 * - Sorted (requires all five comparison methods)
 * - Used in binary search algorithms
 * - Validated for consistent ordering (transitive relations)
 *
 * @template TValue - Type of value being compared to
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IComparable<TValue> = IEquals<TValue> &
    IGreaterThan<TValue> &
    IGreaterThanOrEquals<TValue> &
    ILessThan<TValue> &
    ILessThanOrEquals<TValue>;
