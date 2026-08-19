/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * @module Utilities
 */

<<<<<<< HEAD
import  { type Class } from "@/utilities/types/_module.js";
=======
import type {AnyClass} from "@/utilities/types/_module.js";
>>>>>>> main

/**
 * 
 * @internal
 */
export function isClass(value: unknown): value is Class {
    return (value as any)?.prototype?.constructor?.toString().startsWith("class");
}
