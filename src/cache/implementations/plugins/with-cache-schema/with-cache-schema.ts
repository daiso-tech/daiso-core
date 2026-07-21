/**
 * @module Cache
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";
import { validate } from "@/utilities/_module.js";

/**
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
 * @group Plugins
 */
export function withCacheSchema<TType>(
    settings: WithCacheSchemaSettings<TType>,
): PluginFn<ICacheAdapter<TType>> {
    const { schema, shouldValidateOutput = true } = settings;

    return (adapter, enhance) => {
        if (shouldValidateOutput) {
            enhance(adapter, "get", async ({ next }) => {
                return validate(schema, await next());
            });
        }
        if (shouldValidateOutput) {
            enhance(adapter, "getAndRemove", async ({ next }) => {
                return validate(schema, await next());
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
