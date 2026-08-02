/**
 * @module Utilities
 */
import { type Invocable } from "@/utilities/functions/invocable.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type WaitUntil = Invocable<[promise: PromiseLike<unknown>], void>;
