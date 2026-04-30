/**
 * @module Utilities
 */

import { type Class } from "@/utilities/types/class.type.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type InferInstance<T> = T extends Class<Array<any>, infer R> ? R : never;
