/**
 * @module EnvAccessor
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type UninitializedEnvAccessorError,
} from "@/env-accessor/contracts/env-accessor.errors.js";
import { type IInitizable, type UndefinedToNull } from "@/utilities/_module.js";

/**
 * @group Contracts
 */
export type RawEnvConfig = Partial<Record<string, string>>;

/**
 * @group Contracts
 */
export type BaseEnvConfig = Partial<Record<string, string | number | boolean>>;

/**
 * `IEnvAccessor` provides type-safe access to env variables.
 *
 * @group Contracts
 */
export type IEnvAccessor<TEnvConfig extends BaseEnvConfig = BaseEnvConfig> =
    IInitizable & {
        /**
         * Get a value from the environment config, or null if missing/undefined.
         *
         * @param field The env field to retrieve.
         * @returns The value or null if not present.
         * @throws {UninitializedEnvAccessorError} If called before initialization.
         */
        get<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
            field: TField,
        ): UndefinedToNull<TValue>;

        /**
         * Get a value from the environment config, or return default value.
         *
         * @param field The env field to retrieve.
         * @param defaultValue The default value when not found.
         * @returns The value or default value.
         * @throws {UninitializedEnvAccessorError} If called before initialization.
         */
        getOr<
            TField extends keyof TEnvConfig,
            TValue extends TEnvConfig[TField],
        >(
            field: TField,
            defaultValue: NonNullable<TValue>,
        ): NonNullable<TValue>;
    };
