/**
 * @module ConfigAccessor
 */
import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type BaseConfig,
    type IConfigAccessor,
    type RestrictedPaths,
    type PathValue,
} from "@/config-accessor/contracts/_module.js";
import { validateSync, UnexpectedError } from "@/utilities/_module.js";

/**
 * Settings for configuring an {@link  ConfigAccessor | `ConfigAccessor`} instance.
 *
 * @template TConfig The configuration object type.
 * @group Implementations
 */
export type ConfigAccessorSettings<
    TOutputConfig extends BaseConfig = BaseConfig,
    TInputConfig = TOutputConfig,
> = {
    /**
     * The configuration object to be accessed.
     * This is the raw config that will be used directly or validated against the schema if provided.
     */
    config: TInputConfig;

    /**
     * The optional schema used to validate and type the config.
     */
    schema?: StandardSchemaV1<TInputConfig, TOutputConfig>;
};

/**
 * @internal
 */
type PathSegments = {
    root: string;
    nested?: string;
};

/**
 * `ConfigAccessor` provides type-safe access to configuration objects, with optional schema validation.
 *
 * **Note:** Only exactly 1 level of nesting is supported for config fields (e.g., "app.foo").
 * Paths with more than 1 level of nesting are not supported.
 *
 * @template TOutputConfig The configuration object type.
 * @group Implementations
 */
export class ConfigAccessor<
    TInputConfig extends BaseConfig,
    TOutputConfig extends BaseConfig = TInputConfig,
> implements IConfigAccessor<TOutputConfig> {
    private readonly configObject: TOutputConfig;

    /**
     * @example
     * ```ts
     * import { ConfigAccessor } from "@daiso-tech/core/config-accessor";
     * import { z } from "zod";
     *
     * const config = {}
     *
     * const schema = z.object({
     *   // Supports primitive string, number, boolean values
     *   a: z.string(),
     *
     *   // Supports nested object with fields of string, number, boolean values
     *   b: z.object({
     *     a: z.string(),
     *   }),
     *
     *   // Supports array with item of string, number, boolean values
     *   c: z.string().array(),
     *
     *   // Supports array of object with fields of string, number, boolean values
     *   d: z.object({
     *     a: z.string(),
     *   })
     *   .array(),
     * })
     *
     * const accessor = new ConfigAccessor({
     *   config,
     *   // Schema is optional, you can pass in a type
     *   schema,
     * })
     *
     * // Return the value of field a
     * accessor.get("a")
     *
     * // Return the value of field b which is an object
     * accessor.get("b")
     *
     * // Return the value of field b.a which is an primitive
     * accessor.get("b.a")
     *
     * // Return the first item of field c which an primitive
     * accessor.get("c.1")
     *
     * // Return the first item of field d which an object
     * accessor.get("d.2")
     * ```
     */
    constructor(settings: ConfigAccessorSettings<TOutputConfig, TInputConfig>) {
        const { config: configObject, schema } = settings;

        if (schema !== undefined) {
            this.configObject = validateSync(schema, configObject);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            this.configObject = configObject as any;
        }
    }

    private extractPathSegments(path: string): PathSegments {
        const path_ = path;
        const [root, nested, ...rest] = path_.split(".");
        if (rest.length > 0) {
            throw new UnexpectedError(
                "Config path supports at most one nested path segment.",
            );
        }
        if (root === undefined) {
            throw new UnexpectedError(
                "BUG: Config path must specify a field name (received undefined). This is an internal error and should be reported.",
            );
        }
        return {
            root,
            nested,
        };
    }

    get<TPath extends RestrictedPaths<TOutputConfig>>(
        path: TPath,
    ): PathValue<TOutputConfig, TPath> {
        const { root: field, nested: nestedField } =
            this.extractPathSegments(path);

        const configObject_: BaseConfig = this.configObject;

        if (
            // Is array
            Array.isArray(configObject_[field]) &&
            // Nested field exists
            nestedField !== undefined
        ) {
            const nestedValue =
                configObject_[field][Number(nestedField)] ?? null;
            return nestedValue as PathValue<TOutputConfig, TPath>;
        }

        if (
            // Is object
            typeof configObject_[field] === "object" &&
            !Array.isArray(configObject_[field]) &&
            // Nested field exists
            nestedField !== undefined
        ) {
            const nestedValue = configObject_[field][nestedField] ?? null;
            return nestedValue as PathValue<TOutputConfig, TPath>;
        }

        const rootValue = configObject_[field] ?? null;
        return rootValue as PathValue<TOutputConfig, TPath>;
    }

    getOr<TPath extends RestrictedPaths<TOutputConfig>>(
        path: TPath,
        defaultValue: NonNullable<PathValue<TOutputConfig, TPath>>,
    ): NonNullable<PathValue<TOutputConfig, TPath>> {
        const value = this.get(path);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }
}
