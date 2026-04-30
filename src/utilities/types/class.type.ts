/**
 * @module Utilities
 */

import { type AnyFunction } from "@/utilities/types/any-function.type.js";

/**
 * @internal
 */
export type Class<
    TParameters extends Array<any> = Array<any>,
    TInstance = any,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    TStaticMethods extends Record<string | number | symbol, AnyFunction> = {},
> = TStaticMethods & {
    new (...parameters: TParameters): TInstance;
};
