/**
 * @module Serde
 */

import { type IDeserializer } from "@/serde/contracts/deserializer.contract.js";
import { type ISerializer } from "@/serde/contracts/serializer.contract.js";

/**
 * Complete serde (serialization/deserialization) contract for bidirectional data transformation.
 * Provides both serialization and deserialization of plain data structures.
 *
 * Combines ISerializer and IDeserializer for formats requiring both directions:
 * - JSON serialization/deserialization
 * - Binary format marshalling/unmarshalling
 * - Any bidirectional data transformation
 *
 * Critical invariant:
 * For valid plain data: deserialize(serialize(x)) should equal x
 *
 * @template TSerializedValue - The serialized format (JSON string, binary, etc., defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Contracts
 */
export type ISerde<TSerializedValue = unknown> = ISerializer<TSerializedValue> &
    IDeserializer<TSerializedValue>;
