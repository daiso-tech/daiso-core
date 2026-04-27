/**
 * @module BackoffPolicy
 */

import { type Invokable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Contracts
 */
export type DynamicBackoffPolicy<TSettings> =
    | TSettings
    | Invokable<[error: unknown], TSettings | undefined>;
