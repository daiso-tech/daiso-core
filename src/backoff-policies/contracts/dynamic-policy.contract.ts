/**
 * @module BackoffPolicy
 */

import { type Invocable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Contracts
 */
export type DynamicBackoffPolicy<TSettings> =
    | TSettings
    | Invocable<[error: unknown], TSettings | undefined>;
