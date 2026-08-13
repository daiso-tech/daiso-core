/**
 * @module BackoffPolicy
 */

import type {
    ConstantBackoffSettings,
    SerializedConstantBackoffSettings,
} from "@/backoff-policies/implementations/constant-backoff/_module.js";
import type {
    ExponentialBackoffSettings,
    SerializedExponentialBackoffSettings,
} from "@/backoff-policies/implementations/exponential-backoff/_module.js";
import type {
    LinearBackoffSettings,
    SerializedLinearBackoffSettings,
} from "@/backoff-policies/implementations/linear-backoff/_module.js";
import type {
    PolynomialBackoffSettings,
    SerializedPolynomialBackoffSettings,
} from "@/backoff-policies/implementations/polynomial-backoff/_module.js";

/**
 * Discriminant constants that identify the type of backoff algorithm.
 * Used as the `type` field in {@link BackoffSettingsEnum | `BackoffSettingsEnum`} discriminated unions.
 *
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
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
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export type BackoffsLiterals = (typeof BACKOFFS)[keyof typeof BACKOFFS];

/**
 * {@link ConstantBackoffSettings | `ConstantBackoffSettings`} tagged with a `type` discriminant for use in
 * serialised backoff configuration unions.
 *
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export type ConstantBackoffSettingsEnum = Omit<
    ConstantBackoffSettings,
    "internalMathRandom"
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
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export type ExponentialBackoffSettingsEnum = Omit<
    ExponentialBackoffSettings,
    "internalMathRandom"
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
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export type LinearBackoffSettingsEnum = Omit<
    LinearBackoffSettings,
    "internalMathRandom"
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
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export type PolynomialBackoffSettingsEnum = Omit<
    PolynomialBackoffSettings,
    "internalMathRandom"
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
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
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
    "internalMathRandom"
> & {
    type: (typeof BACKOFFS)["CONSTANT"];
};

/**
 * @internal
 */
export type SerializedExponentialBackoffSettingsEnum = Omit<
    SerializedExponentialBackoffSettings,
    "internalMathRandom"
> & {
    type: (typeof BACKOFFS)["EXPONENTIAL"];
};

/**
 * @internal
 */
export type SerializedLinearBackoffSettingsEnum = Omit<
    SerializedLinearBackoffSettings,
    "internalMathRandom"
> & {
    type: (typeof BACKOFFS)["LINEAR"];
};

/**
 * @internal
 */
export type SerializedPolynomialBackoffSettingsEnum = Omit<
    SerializedPolynomialBackoffSettings,
    "internalMathRandom"
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
