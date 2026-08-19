/**
 * @module Utilities
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * @internal
 */
export function isStandardSchema<TInput, TOutput>(
    value: unknown,
): value is StandardSchemaV1<TInput, TOutput> {
    return (
        typeof value === "object" &&
        typeof (value as Record<string, unknown>)["~standard"] === "object"
    );
}
