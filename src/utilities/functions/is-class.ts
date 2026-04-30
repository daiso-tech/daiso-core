/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * @module Utilities
 */

import  { type Class } from "@/utilities/types/_module.js";

/**
 * 
 * @internal
 */
export function isClass(value: unknown): value is Class {
    return (value as any)?.prototype?.constructor?.toString().startsWith("class");
}
