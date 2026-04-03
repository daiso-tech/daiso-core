/**
 * @module Utilities
 */
import { type Invokable } from "@/utilities/functions/invokable.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type WaitUntil = Invokable<[promise: PromiseLike<unknown>], void>;
