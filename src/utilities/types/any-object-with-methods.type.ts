/**
 * @module Utilities
 */

import { type AnyFunction } from "@/utilities/types/any-function.type.js";

/**
 * @internal
 */
export type AnyObjectWithMethods = Partial<
    Record<string, string | null | boolean | undefined | number | AnyFunction>
>;
