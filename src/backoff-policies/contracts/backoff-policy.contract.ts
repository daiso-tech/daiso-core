/**
 * @module BackoffPolicy
 */

import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Contracts
 */
export type BackoffPolicy = Invocable<
    [attempt: number, error: unknown],
    ITimeSpan
>;
