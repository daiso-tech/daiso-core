/**
 * @module Utilities
 */

/**
 * @internal
 */
export function copyObj<TInstance>(instance: TInstance): TInstance {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const proto = Object.getPrototypeOf(instance);
    const descriptors = Object.getOwnPropertyDescriptors(instance);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.create(proto, descriptors) as TInstance;
}
