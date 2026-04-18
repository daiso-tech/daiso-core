/**
 * @module Serde
 */

import { type ISerde } from "@/serde/contracts/serde.contract.js";

/**
 * Adapter interface for custom serialization transformers without version support.
 * Simpler variant of ISerdeTransformer for adapters that don't require versioning.
 *
 * @template TDeserializedValue - The runtime/decoded type
 * @template TSerializedValue - The serialized/encoded representation
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type ISerdeTransformerAdapter<TDeserializedValue, TSerializedValue> = {
    /**
     * Single name for identifying this transformer.
     * Used to route deserialized data to the correct transformer.
     */
    name: string;

    /**
     * Type guard checking if a value matches this transformer's type.
     * Used during serialization to determine which transformer to apply.
     *
     * @param value - The value to check
     * @returns True if value should be handled by this transformer
     */
    isApplicable(value: unknown): value is TDeserializedValue;

    /**
     * Deserializes a value from the serialized format to runtime format.
     *
     * @param serializedValue - The value in serialized format
     * @returns The value in deserialized/runtime format
     */
    deserialize(serializedValue: TSerializedValue): TDeserializedValue;

    /**
     * Serializes a value from runtime format to the serialized format.
     *
     * @param deserializedValue - The value in deserialized/runtime format
     * @returns The value in serialized format
     */
    serialize(deserializedValue: TDeserializedValue): TSerializedValue;
};

/**
 * Flexible serde adapter combining plain data serialization with custom transformer support.
 * Lower-level variant of IFlexibleSerde for adapter implementations.
 *
 * Extends ISerde with transformer registration for:
 * - Custom types
 * - Specialized serialization logic
 *
 * @template TSerializedValue - The serialized format (JSON, binary, etc., defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type IFlexibleSerdeAdapter<TSerializedValue = unknown> =
    ISerde<TSerializedValue> & {
        /**
         * Registers a custom transformer for serializing and deserializing a specific type.
         * Allows the adapter to handle types beyond plain data (e.g., Date objects, custom classes).
         *
         * @template TCustomSerialized - The serialized representation type
         * @template TCustomDeserialized - The deserialized/runtime type
         * @param transformer - Transformer implementing ISerdeTransformerAdapter interface
         * @returns Void (adapter is mutated with new transformer registered)
         */
        registerCustom<TCustomDeserialized, TCustomSerialized>(
            transformer: ISerdeTransformerAdapter<
                TCustomDeserialized,
                TCustomSerialized
            >,
        ): void;
    };
