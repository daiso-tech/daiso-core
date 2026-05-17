/**
 * @module Collection
 */
import { type StandardSchemaV1 } from "@standard-schema/spec";

import { validateSync, ValidationError } from "@/utilities/_module.js";

/**
 * @internal
 */
export class ValidateIterable<TInput, TOutput> implements Iterable<TOutput> {
    constructor(
        private readonly iterable: Iterable<TInput>,
        private readonly schema: StandardSchemaV1<TInput, TOutput>,
    ) {}

    *[Symbol.iterator](): Iterator<TOutput> {
        for (const item of this.iterable) {
            try {
                yield validateSync(this.schema, item);
            } catch (error: unknown) {
                if (!(error instanceof ValidationError)) {
                    throw error;
                }
            }
        }
    }
}
