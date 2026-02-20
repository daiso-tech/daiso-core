/**
 * @module Serde
 */
import { Buffer } from "node:buffer";

import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import { getConstructorName, type OneOrMore } from "@/utilities/_module.js";

/**
 * @internal
 */
type JSONBuffer = {
    version: "1";
    buffer: string;
};

/**
 * @internal
 */
export class ArrayBufferSerdeTransformer
    implements ISerdeTransformer<ArrayBuffer, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return ArrayBuffer.name;
    }

    isApplicable(value: unknown): value is ArrayBuffer {
        return (
            value instanceof ArrayBuffer &&
            getConstructorName(value) === ArrayBuffer.name
        );
    }

    deserialize(serializedValue: JSONBuffer): ArrayBuffer {
        return Buffer.from(serializedValue.buffer, "base64").buffer;
    }

    serialize(deserializedValue: ArrayBuffer): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class BufferSerdeTransformer
    implements ISerdeTransformer<Buffer, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Buffer.name;
    }

    isApplicable(value: unknown): value is Buffer {
        return (
            value instanceof Buffer && getConstructorName(value) === Buffer.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Buffer {
        return Buffer.from(serializedValue.buffer, "base64");
    }

    serialize(deserializedValue: Buffer): JSONBuffer {
        return {
            version: "1",
            buffer: deserializedValue.toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Uint8ArraySerdeTransformer
    implements ISerdeTransformer<Uint8Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Uint8Array.name;
    }

    isApplicable(value: unknown): value is Uint8Array {
        return (
            value instanceof Uint8Array &&
            getConstructorName(value) === Uint8Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Uint8Array {
        return new Uint8Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Uint8Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Int8ArraySerdeTransformer
    implements ISerdeTransformer<Int8Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Int8Array.name;
    }

    isApplicable(value: unknown): value is Int8Array {
        return (
            value instanceof Int8Array &&
            getConstructorName(value) === Int8Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Int8Array {
        return new Int8Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Int8Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Uint16ArraySerdeTransformer
    implements ISerdeTransformer<Uint16Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Uint16Array.name;
    }

    isApplicable(value: unknown): value is Uint16Array {
        return (
            value instanceof Uint16Array &&
            getConstructorName(value) === Uint16Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Uint16Array {
        return new Uint16Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Uint16Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Int16ArraySerdeTransformer
    implements ISerdeTransformer<Int16Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Int16Array.name;
    }

    isApplicable(value: unknown): value is Int16Array {
        return (
            value instanceof Int16Array &&
            getConstructorName(value) === Int16Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Int16Array {
        return new Int16Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Int16Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Uint32ArraySerdeTransformer
    implements ISerdeTransformer<Uint32Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Uint32Array.name;
    }

    isApplicable(value: unknown): value is Uint32Array {
        return (
            value instanceof Uint32Array &&
            getConstructorName(value) === Uint32Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Uint32Array {
        return new Uint32Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Uint32Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Int32ArraySerdeTransformer
    implements ISerdeTransformer<Int32Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Int32Array.name;
    }

    isApplicable(value: unknown): value is Int32Array {
        return (
            value instanceof Int32Array &&
            getConstructorName(value) === Int32Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Int32Array {
        return new Int32Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Int32Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class BigUint64ArraySerdeTransformer
    implements ISerdeTransformer<BigUint64Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return BigUint64Array.name;
    }

    isApplicable(value: unknown): value is BigUint64Array {
        return (
            value instanceof BigUint64Array &&
            getConstructorName(value) === BigUint64Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): BigUint64Array {
        return new BigUint64Array(
            Buffer.from(serializedValue.buffer, "base64").buffer,
        );
    }

    serialize(deserializedValue: BigUint64Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue.buffer).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class BigInt64ArraySerdeTransformer
    implements ISerdeTransformer<BigInt64Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return BigInt64Array.name;
    }

    isApplicable(value: unknown): value is BigInt64Array {
        return (
            value instanceof BigInt64Array &&
            getConstructorName(value) === BigInt64Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): BigInt64Array {
        return new BigInt64Array(
            Buffer.from(serializedValue.buffer, "base64").buffer,
        );
    }

    serialize(deserializedValue: BigInt64Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue.buffer).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Float32ArraySerdeTransformer
    implements ISerdeTransformer<Float32Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Float32Array.name;
    }

    isApplicable(value: unknown): value is Float32Array {
        return (
            value instanceof Float32Array &&
            getConstructorName(value) === Float32Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Float32Array {
        return new Float32Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Float32Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
export class Float64ArraySerdeTransformer
    implements ISerdeTransformer<Float64Array, JSONBuffer>
{
    get name(): OneOrMore<string> {
        return Float64Array.name;
    }

    isApplicable(value: unknown): value is Float64Array {
        return (
            value instanceof Float64Array &&
            getConstructorName(value) === Float64Array.name
        );
    }

    deserialize(serializedValue: JSONBuffer): Float64Array {
        return new Float64Array(Buffer.from(serializedValue.buffer, "base64"));
    }

    serialize(deserializedValue: Float64Array): JSONBuffer {
        return {
            version: "1",
            buffer: Buffer.from(deserializedValue).toString("base64"),
        };
    }
}

/**
 * @internal
 */
type SerializedValue<TValue> = {
    version: "1";
    value: TValue;
};

/**
 * @internal
 */
export class MapSerdeTransformer
    implements
        ISerdeTransformer<
            Map<unknown, unknown>,
            SerializedValue<Array<[unknown, unknown]>>
        >
{
    get name(): OneOrMore<string> {
        return Map.name;
    }

    isApplicable(value: unknown): value is Map<unknown, unknown> {
        return value instanceof Map && getConstructorName(value) === Map.name;
    }

    deserialize(
        serializedValue: SerializedValue<Array<[unknown, unknown]>>,
    ): Map<unknown, unknown> {
        return new Map(serializedValue.value);
    }

    serialize(
        deserializedValue: Map<unknown, unknown>,
    ): SerializedValue<Array<[unknown, unknown]>> {
        return {
            version: "1",
            value: [...deserializedValue.entries()],
        };
    }
}

/**
 * @internal
 */
export class SetSerdeTransformer
    implements ISerdeTransformer<Set<unknown>, SerializedValue<Array<unknown>>>
{
    get name(): OneOrMore<string> {
        return Set.name;
    }

    isApplicable(value: unknown): value is Set<unknown> {
        return value instanceof Set && getConstructorName(value) === Set.name;
    }

    deserialize(
        serializedValue: SerializedValue<Array<unknown>>,
    ): Set<unknown> {
        return new Set(serializedValue.value);
    }

    serialize(
        deserializedValue: Set<unknown>,
    ): SerializedValue<Array<unknown>> {
        return {
            version: "1",
            value: [...deserializedValue.values()],
        };
    }
}

/**
 * @internal
 */
export class BigIntSerdeTransformer
    implements ISerdeTransformer<bigint, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return BigInt.name;
    }

    isApplicable(value: unknown): value is bigint {
        return typeof value === "bigint";
    }

    deserialize(serializedValue: SerializedValue<string>): bigint {
        return BigInt(serializedValue.value);
    }

    serialize(deserializedValue: bigint): SerializedValue<string> {
        return {
            version: "1",
            value: deserializedValue.toString(),
        };
    }
}

/**
 * @internal
 */
export class NaNSerdeTransformer
    implements ISerdeTransformer<number, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return NaN.toString();
    }

    isApplicable(value: unknown): value is number {
        return typeof value === "number" && Number.isNaN(value);
    }

    deserialize(serializedValue: SerializedValue<string>): number {
        return Number(serializedValue.value);
    }

    serialize(deserializedValue: number): SerializedValue<string> {
        return {
            version: "1",
            value: deserializedValue.toString(),
        };
    }
}

/**
 * @internal
 */
export class InfinitySerdeTransformer
    implements ISerdeTransformer<number, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return Infinity.toString();
    }

    isApplicable(value: unknown): value is number {
        return typeof value === "number" && !Number.isFinite(value);
    }

    deserialize(serializedValue: SerializedValue<string>): number {
        return Number(serializedValue.value);
    }

    serialize(deserializedValue: number): SerializedValue<string> {
        return {
            version: "1",
            value: deserializedValue.toString(),
        };
    }
}

/**
 * @internal
 */
export class UndefinedSerdeTransformer
    implements ISerdeTransformer<undefined, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return "undefined";
    }

    isApplicable(value: unknown): value is undefined {
        return value === undefined;
    }

    deserialize(_serializedValue: SerializedValue<string>): undefined {
        return undefined;
    }

    serialize(deserializedValue: undefined): SerializedValue<string> {
        return {
            version: "1",
            value: String(deserializedValue),
        };
    }
}

/**
 * @internal
 */
export class RegExpSerdeTransformer
    implements ISerdeTransformer<RegExp, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return RegExp.name;
    }

    isApplicable(value: unknown): value is RegExp {
        return (
            value instanceof RegExp && getConstructorName(value) === RegExp.name
        );
    }

    deserialize(serializedValue: SerializedValue<string>): RegExp {
        const body = serializedValue.value.slice(
            1,
            serializedValue.value.lastIndexOf("/"),
        );
        const flags = serializedValue.value.slice(
            serializedValue.value.lastIndexOf("/") + 1,
        );
        return new RegExp(body, flags);
    }

    serialize(deserializedValue: RegExp): SerializedValue<string> {
        return {
            version: "1",
            value: deserializedValue.toString(),
        };
    }
}

/**
 * @internal
 */
export class DateSerdeTransformer
    implements ISerdeTransformer<Date, SerializedValue<number>>
{
    get name(): OneOrMore<string> {
        return Date.name;
    }

    isApplicable(value: unknown): value is Date {
        return value instanceof Date && getConstructorName(value) === Date.name;
    }

    deserialize(serializedValue: SerializedValue<number>): Date {
        return new Date(serializedValue.value);
    }

    serialize(deserializedValue: Date): SerializedValue<number> {
        return {
            version: "1",
            value: deserializedValue.getTime(),
        };
    }
}

/**
 * @internal
 */
export class URLSerdeTransformer
    implements ISerdeTransformer<URL, SerializedValue<string>>
{
    get name(): OneOrMore<string> {
        return URL.name;
    }

    isApplicable(value: unknown): value is URL {
        return value instanceof URL && getConstructorName(value) === URL.name;
    }

    deserialize(serializedValue: SerializedValue<string>): URL {
        return new URL(serializedValue.value);
    }

    serialize(deserializedValue: URL): SerializedValue<string> {
        return {
            version: "1",
            value: deserializedValue.toString(),
        };
    }
}

/**
 * @internal
 */
export class URLSearchParamsSerdeTransformer
    implements
        ISerdeTransformer<
            URLSearchParams,
            SerializedValue<Array<[string, string]>>
        >
{
    get name(): OneOrMore<string> {
        return URLSearchParams.name;
    }

    isApplicable(value: unknown): value is URLSearchParams {
        return (
            value instanceof URLSearchParams &&
            getConstructorName(value) === URLSearchParams.name
        );
    }

    deserialize(
        serializedValue: SerializedValue<Array<[string, string]>>,
    ): URLSearchParams {
        return new URLSearchParams(serializedValue.value);
    }

    serialize(
        deserializedValue: URLSearchParams,
    ): SerializedValue<Array<[string, string]>> {
        return {
            version: "1",
            value: [...deserializedValue.entries()],
        };
    }
}
