/**
 * @module Serde
 */

import { type ISerde } from "@/serde/contracts/serde.contract.js";
import { type OneOrMore } from "@/utilities/_module.js";

/**
 * Base structure for serialized values with version tracking.
 * Enables safe deserialization with schema evolution support.
 *
 * All serialized values should include a version field to handle migration
 * as serialization formats evolve.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type SerializedValueBase = {
    /**
     * Version identifier for the serialization format.
     * Used to determine which deserializer/decoder to apply during deserialization.
     * Can be numeric (e.g., 1, 2, 3) or string (e.g., "1.0", "2.1").
     */
    version: string | number;
};

/**
 * Class contract for types that support both serialization and static deserialization.
 * Defines the interface that custom classes must implement for flexible serde.
 *
 * Implementers provide:
 * - Instance method serialize() to convert to serialized form
 * - Static method deserialize() to reconstruct from serialized form
 *
 * @template TSerializedValue - The serialized representation type (must extend SerializedValueBase)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type SerializableClass<TSerializedValue extends SerializedValueBase> = {
    /**
     * Constructor creating new instance (typically used internally during deserialization).
     *
     * @param arguments_ - Constructor arguments
     * @returns New instance of the class
     */
    new (...arguments_: Array<any>): ISerializable<TSerializedValue>;

    /**
     * Static deserialization method reconstructing an instance from serialized data.
     * Inverse operation of serialize() method on instances.
     *
     * @param serializedValue - The serialized representation to reconstruct from
     * @returns New instance populated with deserialized data
     */
    deserialize(
        serializedValue: TSerializedValue,
    ): ISerializable<TSerializedValue>;
};

/**
 * Instance contract for types supporting serialization to a versioned format.
 * Classes implementing this contract can convert their state to a serialized representation.
 *
 * @template TSerializedValue - The serialized representation type (must extend SerializedValueBase with version)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type ISerializable<TSerializedValue extends SerializedValueBase> = {
    /**
     * Serializes this instance to a versioned format.
     * Instance method that converts the current state to a storable/transportable form.
     * Must include a version field for deserialization to know how to reconstruct.
     *
     * @returns Serialized representation with version field
     */
    serialize(): TSerializedValue;
};

/**
 * Custom serialization transformer for specialized handling of non-class objects.
 * Provides type detection, serialization, and deserialization logic for custom types.
 *
 * Use transformers for:
 * - Built-in types with special serialization rules (e.g., Date, Map, Set)
 * - Domain objects without class definitions
 * - Values requiring custom transformation logic
 *
 * @template TDeserializedValue - The runtime/decoded type
 * @template TSerializedValue - The serialized/encoded representation type
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type ISerdeTransformer<
    TDeserializedValue,
    TSerializedValue extends SerializedValueBase,
> = {
    /**
     * Name(s) for identifying this transformer in serialized output.
     * Used to route deserialized data to the correct transformer.
     * Can be a single name or array of aliases.
     */
    name: OneOrMore<string>;

    /**
     * Type guard checking if a value matches this transformer's type.
     * Used during serialization to determine which transformer to apply.
     *
     * @param value - The value to check
     * @returns True if value should be serialized by this transformer, false otherwise
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
     * @returns The value in serialized format (must include version field)
     */
    serialize(deserializedValue: TDeserializedValue): TSerializedValue;
};

/**
 * Registration interface for Custom serialization and deserialization transformers.
 * Use this interface to register custom logic for classes and objects that require special serialization handling.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export interface ISerderRegister {
    /**
     * Registers a class and its deserialization logic for custom serialization handling.
     * The class must implement the {@link SerializableClass | `SerializableClass`} interface.
     *
     * @template TSerializedClassInstance - The serialized representation type
     * @param class_ - Class implementing SerializableClass interface
     * @param prefix - Optional name prefix(es) for distinguishing this class in serialized output
     * @returns this for method chaining
     */
    registerClass<TSerializedClassInstance extends SerializedValueBase>(
        class_: SerializableClass<TSerializedClassInstance>,
        prefix?: OneOrMore<string>,
    ): this;

    /**
     * Registers a custom transformer for arbitrary serialization and deserialization logic.
     * Use this for non-class objects or special serialization behavior.
     *
     * @template TCustomDeserialized - The deserialized (runtime) type
     * @template TCustomSerialized - The serialized representation type
     * @param transformer - Transformer implementing ISerdeTransformer interface
     * @param prefix - Optional name prefix(es) for distinguishing this transformer in serialized output
     * @returns this for method chaining
     */
    registerCustom<
        TCustomDeserialized,
        TCustomSerialized extends SerializedValueBase,
    >(
        transformer: ISerdeTransformer<TCustomDeserialized, TCustomSerialized>,
        prefix?: OneOrMore<string>,
    ): this;
}

/**
 * Flexible serde contract combining plain data serialization with custom class/transformer support.
 * Provides the broadest serialization capabilities: works with plain objects, custom classes, and transformers.
 *
 * Extends ISerde with registration capabilities for:
 * - Custom classes implementing ISerializable
 * - Arbitrary transformers for special types
 *
 * Useful for applications needing:
 * - Server state serialization with typed classes
 * - Configuration files with custom objects
 * - Event payload serialization with class instances
 * - Domain-driven design with entity serialization
 *
 * @template TSerializedValue - The serialized format (JSON, binary, etc., defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type IFlexibleSerde<TSerializedValue = unknown> =
    ISerde<TSerializedValue> & ISerderRegister;
