/**
 * @module Utilities
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

export class ValidationError extends Error {
    constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
        const jsonMessage = JSON.stringify(issues, null, 2);
        super(
            `A validation error occurred with the following issues:\n${jsonMessage}`,
        );
        this.name = ValidationError.name;
    }
}

/**
 * @internal
 *
 * @throws {ValidationError}
 */
export async function validate<TType>(
    schema: StandardSchemaV1<unknown, TType> | undefined,
    value: TType,
): Promise<TType> {
    const validationResult = await schema?.["~standard"].validate(value);
    if (validationResult === undefined) {
        return value;
    }
    if (validationResult.issues) {
        throw new ValidationError(validationResult.issues);
    }
    return validationResult.value;
}

/**
 * @internal
 *
 * @throws {ValidationError}
 */
export function validateSync<TType>(
    schema: StandardSchemaV1<unknown, TType> | undefined,
    value: TType,
): TType {
    const validationResult = schema?.["~standard"].validate(value);
    if (validationResult instanceof Promise) {
        throw new TypeError("!!__MESSAGE__!!");
    }
    if (validationResult === undefined) {
        return value;
    }
    if (validationResult.issues) {
        throw new ValidationError(validationResult.issues);
    }
    return validationResult.value;
}
