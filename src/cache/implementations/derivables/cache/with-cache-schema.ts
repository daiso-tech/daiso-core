/**
 * @module Cache
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { validate, ValidationError } from "@/utilities/_module.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
 * Settings for the {@link withCacheSchema} plugin.
 *
 * @internal
 */
export type WithCacheSchemaSettings = {
    /**
     * A standard-schema-compliant schema used to validate cache values.
     * Compatible with libraries such as Zod, ArkType, Valibot, and others
     * that implement the `StandardSchemaV1` specification.
     */
    schema: StandardSchemaV1;

    /**
     * Whether to validate values returned by `get` and `getAndRemove`
     * on retrieval, in addition to validating values on write.
     * When `true`, malformed data in the cache is caught at read time
     * rather than silently returned.
     *
     * @default true
     */
    shouldValidateOutput?: boolean;
};

/**
 * Creates a plugin that validates cache values against a standard schema.
 *
 * On `add`, `put`, and `update` operations the input value is validated
 * against the provided schema before being stored. Optionally, `get` and
 * `getAndRemove` outputs can also be validated on retrieval to ensure data
 * integrity.
 *
 * @param settings - Configuration for the schema validation.
 * @param settings.schema - A standard-schema compliant schema to validate
 *                          values against.
 * @param settings.shouldValidateOutput - Whether to validate values returned
 *                                        by `get` and `getAndRemove`.
 *                                        @default true
 * @returns A middleware plugin that wraps an `ICacheAdapter`.
 *
 * @throws {ValidationError}
 *
 * @internal
 */
export function withCacheSchema(
    settings: WithCacheSchemaSettings,
): PluginFn<ICacheAdapter> {
    const { schema, shouldValidateOutput = true } = settings;

    return (adapter, enhance) => {
        if (shouldValidateOutput) {
            enhance(adapter, "get", async ({ next }) => {
                const value = await next();
                if (value === null) {
                    return value;
                }
                return validate(schema, value);
            });
        }
        if (shouldValidateOutput) {
            enhance(adapter, "getAndRemove", async ({ next }) => {
                const value = await next();
                if (value === null) {
                    return value;
                }
                return validate(schema, value);
            });
        }
        enhance(
            adapter,
            "add",
            async ({ args: [key, value, ...rest], next }) => {
                return next([key, await validate(schema, value), ...rest]);
            },
        );
        enhance(
            adapter,
            "put",
            async ({ args: [key, value, ...rest], next }) => {
                return next([key, await validate(schema, value), ...rest]);
            },
        );
        enhance(
            adapter,
            "update",
            async ({ args: [key, value, ...rest], next }) => {
                return next([key, await validate(schema, value), ...rest]);
            },
        );
        enhance(
            adapter,
            "getOrAdd",
            async ({ args: [key, valueToAdd, ttl, ...rest], next }) => {
                const valueToReturn = await next([
                    key,
                    await validate(schema, valueToAdd),
                    ttl,
                    ...rest,
                ]);
                if (shouldValidateOutput) {
                    return await validate(schema, valueToReturn);
                }
                return valueToReturn;
            },
        );
    };
}
