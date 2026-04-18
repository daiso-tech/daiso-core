/**
 * @module Serde
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SerializationSerdeError } from "@/serde/contracts/serde.errors.js";

/**
 * Serializer contract for converting values to a serialized representation.
 * Transforms runtime objects into a serializable format (usually JSON-compatible).
 *
 * Difference from ICodec (Encoder):
 * - Serializer: Works with arbitrary plain data (no custom class instances)
 * - Encoder: Can be specialized for specific types
 *
 * Common use cases:
 * - Convert domain objects to JSON for API responses
 * - Transform data structures for storage/caching
 * - Prepare data for transmission over the network
 *
 * @template TSerializedValue - The serialized output format (usually JSON-compatible, defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type ISerializer<TSerializedValue = unknown> = {
    /**
     * Serializes the given value into a serialized representation.
     * Converts runtime values to a format suitable for storage or transmission.
     *
     * @template TValue - The type of value being serialized
     * @param value - The value to serialize (must be plain data, not custom class instances)
     * @returns The serialized representation of the value
     * @throws {SerializationSerdeError} If serialization fails (circular references, unsupported types, etc.)
     */
    serialize<TValue>(value: TValue): TSerializedValue;
};
