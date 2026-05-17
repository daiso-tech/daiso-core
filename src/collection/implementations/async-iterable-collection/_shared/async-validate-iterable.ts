/**
 * @module Collection
 */
import { type StandardSchemaV1 } from "@standard-schema/spec";

import { validate, ValidationError } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncValidateIterable<TInput, TOutput>
    implements AsyncIterable<TOutput>
{
    constructor(
        private readonly iterable: AsyncIterable<TInput>,
        private readonly schema: StandardSchemaV1<TInput, TOutput>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TOutput> {
        for await (const item of this.iterable) {
            try {
                yield await validate(this.schema, item);
            } catch (error: unknown) {
                if (!(error instanceof ValidationError)) {
                    throw error;
                }
            }
        }
    }
}
