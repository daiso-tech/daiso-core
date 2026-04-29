/**
 * @module Utilities
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * @internal
 */
export function shallowCopyInstance<TInstance>(instance: TInstance): TInstance {
    // Create a new object with the same prototype as the instance
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const copy = Object.create(Object.getPrototypeOf(instance));
    // Copy all properties from the original instance
    return Object.assign(copy, instance);
}
