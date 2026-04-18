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
export async function validate(
    schema: StandardSchemaV1 | undefined,
    value: unknown,
): Promise<void> {
    const result = await schema?.["~standard"].validate(value);
    if (result?.issues) {
        throw new ValidationError(result.issues);
    }
}
