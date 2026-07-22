/**
 * @module Cache
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";
import { validate } from "@/utilities/_module.js";

/**
 * Settings for the {@link withCacheSchema} plugin.
 *
 * @typeParam TType - The type to validate against.
 * @group Plugins
 */
export type WithCacheSchemaSettings<TType = unknown> = {
    schema: StandardSchemaV1<TType>;

    /**
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
 * IMPORT_PATH: `"@daiso-tech/core/cache/plugins"`
 * @typeParam TType - The type of values stored in the cache.
 * @group Plugins
 */
export function withCacheSchema<TType>(
    settings: WithCacheSchemaSettings<TType>,
): PluginFn<ICacheAdapter<TType>> {
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
            async ({ args: [context, key, value, ttl], next }) => {
                return next([context, key, await validate(schema, value), ttl]);
            },
        );
        enhance(
            adapter,
            "put",
            async ({ args: [context, key, value, ttl], next }) => {
                return next([context, key, await validate(schema, value), ttl]);
            },
        );
        enhance(
            adapter,
            "update",
            async ({ args: [context, key, value], next }) => {
                return next([context, key, await validate(schema, value)]);
            },
        );
    };
}
