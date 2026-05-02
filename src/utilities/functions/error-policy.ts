/**
 * @module Utilities
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    callInvokable,
    isInvokable,
    type Invokable,
} from "@/utilities/functions/invokable.js";
import { isStandardSchema } from "@/utilities/functions/is-standard-schema.js";
import {
    resolveOneOrMore,
    type OneOrMore,
} from "@/utilities/functions/resolve-one-or-more.js";
import { type AnyClass } from "@/utilities/types/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Utilities
 */
export type ErrorPolicyBoolSetting = {
    /**
     * If true will treat false return values as errors.
     * You can use this with `retry` middleware to rerun functions that return false.
     */
    treatFalseAsError: boolean;
};

/**
 * @internal
 */
export function isErrorPolicyBoolSetting(
    value: unknown,
): value is ErrorPolicyBoolSetting {
    return (
        typeof value === "object" &&
        value !== null &&
        "treatFalseAsError" in value &&
        typeof value.treatFalseAsError === "boolean"
    );
}

/**
 * The `ErrorPolicy` can be a predicate function, {@link StandardSchemaV1 | `StandardSchemaV1`} and a class.
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Utilities
 */
export type ErrorPolicy<TError = unknown> =
    | Invokable<[error: TError], boolean>
    | StandardSchemaV1<TError>
    | OneOrMore<AnyClass>
    | ErrorPolicyBoolSetting;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Utilities
 */
export type ErrorPolicySettings<TError = unknown> = {
    /**
     * You can choose what errors you want to retry. By default all erros will be retried.
     *
     * @default
     * ```ts
     * (_error: unknown) => true
     * ```
     */
    errorPolicy?: ErrorPolicy<TError>;
};

/**
 * @internal
 */
export function callErrorPolicyOnValue<TValue = unknown, TError = unknown>(
    errorPolicy: ErrorPolicy<TError> = () => true,
    value: TValue,
): boolean {
    // Will retry if the value is false and the setting treatFalseAsError is true
    const shouldRetry =
        isErrorPolicyBoolSetting(errorPolicy) &&
        typeof value === "boolean" &&
        !value &&
        errorPolicy.treatFalseAsError;
    return shouldRetry;
}

/**
 * @internal
 */
export async function callErrorPolicyOnThrow<TError = unknown>(
    errorPolicy: ErrorPolicy<TError> = () => true,
    error: TError,
): Promise<boolean> {
    if (isInvokable(errorPolicy)) {
        return callInvokable(errorPolicy, error);
    }

    if (isStandardSchema(errorPolicy)) {
        const result = await errorPolicy["~standard"].validate(error);
        return result.issues === undefined;
    }

    // Used only for ensuring correct type without type casting.
    if (isErrorPolicyBoolSetting(errorPolicy)) {
        return false;
    }

    for (const errorClass of resolveOneOrMore(errorPolicy)) {
        if (error instanceof errorClass) {
            return true;
        }
    }

    return false;
}
