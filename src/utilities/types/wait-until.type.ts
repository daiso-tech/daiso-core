/**
 * @module Utilities
 */
import { type Invocable } from "@/utilities/functions/invocable.js";

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type WaitUntil = Invocable<[promise: PromiseLike<unknown>], void>;
