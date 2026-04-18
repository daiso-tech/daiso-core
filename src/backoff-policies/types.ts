/**
 * @module BackoffPolicy
 */

import {
    type ConstantBackoffSettings,
    type SerializedConstantBackoffSettings,
} from "@/backoff-policies/constant-backoff/_module.js";
import {
    type ExponentialBackoffSettings,
    type SerializedExponentialBackoffSettings,
} from "@/backoff-policies/exponential-backoff/_module.js";
import {
    type LinearBackoffSettings,
    type SerializedLinearBackoffSettings,
} from "@/backoff-policies/linear-backoff/_module.js";
import {
    type PolynomialBackoffSettings,
    type SerializedPolynomialBackoffSettings,
} from "@/backoff-policies/polynomial-backoff/_module.js";

/**
 * Discriminant constants that identify the type of backoff algorithm.
 * Used as the `type` field in {@link BackoffSettingsEnum | `BackoffSettingsEnum`} discriminated unions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export const BACKOFFS = {
    CONSTANT: "CONSTANT",
    EXPONENTIAL: "EXPONENTIAL",
    LINEAR: "LINEAR",
    POLYNOMIAL: "POLYNOMIAL",
} as const;

/**
 * Union of all {@link BACKOFFS | `BACKOFFS`} discriminant string values.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type BackoffsLiterals = (typeof BACKOFFS)[keyof typeof BACKOFFS];

/**
 * {@link ConstantBackoffSettings | `ConstantBackoffSettings`} tagged with a `type` discriminant for use in
 * serialised backoff configuration unions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type ConstantBackoffSettingsEnum = Omit<
    ConstantBackoffSettings,
    "_mathRandom"
> & {
    /**
     * Discriminant identifying this as the constant backoff algorithm.
     */
    type: (typeof BACKOFFS)["CONSTANT"];
};

/**
 * {@link ExponentialBackoffSettings | `ExponentialBackoffSettings`} tagged with a `type` discriminant for use in
 * serialised backoff configuration unions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type ExponentialBackoffSettingsEnum = Omit<
    ExponentialBackoffSettings,
    "_mathRandom"
> & {
    /**
     * Discriminant identifying this as the exponential backoff algorithm.
     */
    type: (typeof BACKOFFS)["EXPONENTIAL"];
};

/**
 * {@link LinearBackoffSettings | `LinearBackoffSettings`} tagged with a `type` discriminant for use in
 * serialised backoff configuration unions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type LinearBackoffSettingsEnum = Omit<
    LinearBackoffSettings,
    "_mathRandom"
> & {
    /**
     * Discriminant identifying this as the linear backoff algorithm.
     */
    type: (typeof BACKOFFS)["LINEAR"];
};

/**
 * {@link PolynomialBackoffSettings | `PolynomialBackoffSettings`} tagged with a `type` discriminant for use in
 * serialised backoff configuration unions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type PolynomialBackoffSettingsEnum = Omit<
    PolynomialBackoffSettings,
    "_mathRandom"
> & {
    /**
     * Discriminant identifying this as the polynomial backoff algorithm.
     */
    type: (typeof BACKOFFS)["POLYNOMIAL"];
};

/**
 * Discriminated union of all backoff settings types.
 * Use the `type` field to narrow to a specific algorithm's settings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 * @group Adapters
 */
export type BackoffSettingsEnum =
    | ConstantBackoffSettingsEnum
    | ExponentialBackoffSettingsEnum
    | LinearBackoffSettingsEnum
    | PolynomialBackoffSettingsEnum;

/**
 * @internal
 */
export type SerializedConstantBackoffSettingsEnum = Omit<
    SerializedConstantBackoffSettings,
    "_mathRandom"
> & {
    type: (typeof BACKOFFS)["CONSTANT"];
};

/**
 * @internal
 */
export type SerializedExponentialBackoffSettingsEnum = Omit<
    SerializedExponentialBackoffSettings,
    "_mathRandom"
> & {
    type: (typeof BACKOFFS)["EXPONENTIAL"];
};

/**
 * @internal
 */
export type SerializedLinearBackoffSettingsEnum = Omit<
    SerializedLinearBackoffSettings,
    "_mathRandom"
> & {
    type: (typeof BACKOFFS)["LINEAR"];
};

/**
 * @internal
 */
export type SerializedPolynomialBackoffSettingsEnum = Omit<
    SerializedPolynomialBackoffSettings,
    "_mathRandom"
> & {
    type: (typeof BACKOFFS)["POLYNOMIAL"];
};

/**
 * @internal
 */
export type SerializedBackoffSettingsEnum =
    | SerializedConstantBackoffSettingsEnum
    | SerializedExponentialBackoffSettingsEnum
    | SerializedLinearBackoffSettingsEnum
    | SerializedPolynomialBackoffSettingsEnum;
