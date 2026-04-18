/**
 * @module Serde
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DeserializationSerdeError } from "@/serde/contracts/serde.errors.js";

/**
 * Deserializer contract for converting serialized data back to runtime values.
 * Transforms a serialized format (usually JSON-compatible) to runtime objects.
 *
 * Difference from ICodec (Decoder):
 * - Deserializer: Works with arbitrary plain data (no custom class instances)
 * - Decoder: Can be specialized for specific types
 *
 * Common use cases:
 * - Parse JSON from API requests into runtime objects
 * - Reconstruct data structures from stored serialized data
 * - Process incoming network data
 *
 * @template TSerializedValue - The serialized input format (usually JSON-compatible, defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type IDeserializer<TSerializedValue = unknown> = {
    /**
     * Deserializes the given serialized value into a runtime value.
     * Converts from storage/transmission format back to usable runtime objects.
     *
     * @template TValue - The type of value being deserialized to
     * @param serializedValue - The serialized representation to deserialize
     * @returns The deserialized runtime value
     * @throws {DeserializationSerdeError} If deserialization fails (invalid format, type mismatch, etc.)
     */
    deserialize<TValue>(serializedValue: TSerializedValue): TValue;
};
