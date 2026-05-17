/**
 * @module ConfigAccessor
 */
// eslint-disable-next-line import/consistent-type-specifier-style, import/order
import type { Get, Paths } from "type-fest";

// eslint-disable-next-line import/order
import { type OneOrArray, type UndefinedToNull } from "@/utilities/_module.js";

/**
 * @group Contracts
 */
export type FieldConfigValue = string | number | boolean;

/**
 * @group Contracts
 */
export type BaseConfig = Partial<
    Record<
        string,
        OneOrArray<FieldConfigValue | Partial<Record<string, FieldConfigValue>>>
    >
>;

/**
 * @group Contracts
 */
export function defineConfig<TConfig extends BaseConfig>(
    config: TConfig,
): TConfig {
    return config;
}

/**
 * @group contracts
 */
export type RestrictedPaths<TConfig> = Paths<TConfig, { maxRecursionDepth: 1 }>;

/**
 * @group contracts
 */
export type PathValue<TConfig, TPath extends string> = UndefinedToNull<
    Get<TConfig, TPath>
>;

/**
 * `IConfigAccessor` provides type-safe access to configuration objects.
 *
 * @group Contracts
 */
export type IConfigAccessor<TConfig extends BaseConfig = BaseConfig> = {
    /**
     * Get a value from the config, or null if missing/undefined.
     *
     * @param path The config value path to retrieve.
     * @returns The value or null if not present.
     */
    get<TPath extends RestrictedPaths<TConfig>>(
        path: TPath,
    ): PathValue<TConfig, TPath>;

    /**
     * Get a value from the config, or return default value.
     *
     * @param path The config value path to retrieve.
     * @param defaultValue The default value when not found.
     * @returns The value or default value.
     */
    getOr<TPath extends RestrictedPaths<TConfig>>(
        path: TPath,
        defaultValue: NonNullable<Get<TConfig, TPath>>,
    ): NonNullable<PathValue<TConfig, TPath>>;
};
