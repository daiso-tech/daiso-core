/**
 * @module Utilities
 */

import { isIterable } from "@/utilities/functions/is-iterable.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type OneOrMore<TItem> = TItem | Iterable<TItem>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type OneOrArray<TItem> = TItem | Array<TItem>;

/**
 * @internal
 */
export function resolveOneOrMore<TType>(value: OneOrMore<TType>): Array<TType> {
    if (isIterable(value)) {
        return [...value];
    }
    return [value];
}

/**
 * @internal
 */
export function resolveOneOrMoreStr(
    name: OneOrMore<string>,
    joinStr = "/",
): string {
    if (typeof name === "string") {
        return name;
    }
    return resolveOneOrMore(name)
        .filter((str) => str.length > 0)
        .join(joinStr);
}
