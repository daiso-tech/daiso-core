/**
 * @module BackoffPolicy
 */

import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type Invokable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Contracts
 */
export type BackoffPolicy = Invokable<
    [attempt: number, error: unknown],
    ITimeSpan
>;
