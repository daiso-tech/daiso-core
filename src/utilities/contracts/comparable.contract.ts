/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IEquals<TValue> = {
    equals(value: TValue): boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IGreaterThan<TValue> = {
    gt(value: TValue): boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IGreaterThanOrEquals<TValue> = {
    gte(value: TValue): boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ILessThan<TValue> = {
    lt(value: TValue): boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ILessThanOrEquals<TValue> = {
    lte(value: TValue): boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IComparable<TValue> = IEquals<TValue> &
    IGreaterThan<TValue> &
    IGreaterThanOrEquals<TValue> &
    ILessThan<TValue> &
    ILessThanOrEquals<TValue>;
