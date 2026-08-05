/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * @module Utilities
 */

import type {AnyClass} from "@/utilities/types/_module.js";

/**
 * 
 * @internal
 */
export function isClass(value: unknown): value is AnyClass {
    return (value as any)?.prototype?.constructor?.toString().startsWith("class");
}
