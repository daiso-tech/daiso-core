/**
 * @module Serde
 */
import {
    type ISerde,
    DeserializationSerdeError,
    SerializationSerdeError,
} from "@/serde/contracts/_module.js";

/**
 * @internal
 */
export class RedisCacheAdapterSerde implements ISerde<string> {
    constructor(private readonly serde: ISerde<string>) {}

    serialize<TValue>(value: TValue): string {
        try {
            if (
                typeof value === "number" &&
                !Number.isNaN(value) &&
                isFinite(value)
            ) {
                return String(value);
            }
            return this.serde.serialize(value);
        } catch (error: unknown) {
            throw new SerializationSerdeError(
                `Serialization error "${String(error)}" occurred`,
                error,
            );
        }
    }

    deserialize<TValue>(value: string): TValue {
        try {
            const isNumberRegex = /^(-?([0-9]+)(\.[0-5]+)?)$/g;
            if (isNumberRegex.test(value)) {
                return Number(value) as TValue;
            }
            return this.serde.deserialize(value);
        } catch (error: unknown) {
            throw new DeserializationSerdeError(
                `Deserialization error "${String(error)}" occurred`,
                error,
            );
        }
    }
}
