/**
 * @module Utilities
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

export class ValidationError extends Error {
    static create(
        issues: ReadonlyArray<StandardSchemaV1.Issue>,
    ): ValidationError {
        return new ValidationError(`A validation error occurred:`, issues);
    }

    constructor(
        message: string,
        public readonly issues: ReadonlyArray<StandardSchemaV1.Issue>,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = ValidationError.name;
    }
}

/**
 * @internal
 *
 * @throws {ValidationError}
 */
export async function validate<TInput, TOutput = TInput>(
    schema: StandardSchemaV1<TInput, TOutput>,
    value: TInput,
): Promise<TOutput> {
    const validationResult = await schema["~standard"].validate(value);

    if (validationResult.issues) {
        throw ValidationError.create(validationResult.issues);
    }
    return validationResult.value;
}

/**
 * @internal
 *
 * @throws {ValidationError}
 */
export function validateSync<TInput, TOutput = TInput>(
    schema: StandardSchemaV1<TInput, TOutput>,
    value: TInput,
): TOutput {
    const validationResult = schema["~standard"].validate(value);
    if (validationResult instanceof Promise) {
        throw new TypeError(
            "validateSync() does not support async schemas. Use validate() instead.",
        );
    }
    if (validationResult.issues) {
        throw ValidationError.create(validationResult.issues);
    }
    return validationResult.value;
}
