/**
 * @module Utilities
 */

/**
 * @internal
 */
export function isPositiveNbr(nbr: number, fieldName: string = "Number"): void {
    if (nbr < 1) {
        throw new TypeError(`${fieldName} must be larger than 0`);
    }
    if (Number.isNaN(nbr)) {
        throw new TypeError(`${fieldName} cannot be NaN`);
    }
    if (!Number.isFinite(nbr)) {
        throw new TypeError(`${fieldName} cannot be infinite`);
    }
}
