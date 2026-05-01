/**
 * @module Serde
 */

import {
    type IFlexibleSerde,
    type IFlexibleSerdeAdapter,
    type ISerdeTransformer,
    type ISerializable,
    type SerializableClass,
    type SerializedValueBase,
} from "@/serde/contracts/_module.js";
import {
    ArrayBufferSerdeTransformer,
    BufferSerdeTransformer,
    Uint8ArraySerdeTransformer,
    Int8ArraySerdeTransformer,
    Uint16ArraySerdeTransformer,
    Int16ArraySerdeTransformer,
    Uint32ArraySerdeTransformer,
    Int32ArraySerdeTransformer,
    BigUint64ArraySerdeTransformer,
    BigInt64ArraySerdeTransformer,
    Float32ArraySerdeTransformer,
    Float64ArraySerdeTransformer,
    MapSerdeTransformer,
    SetSerdeTransformer,
    BigIntSerdeTransformer,
    NaNSerdeTransformer,
    InfinitySerdeTransformer,
    UndefinedSerdeTransformer,
    RegExpSerdeTransformer,
    DateSerdeTransformer,
    URLSerdeTransformer,
    URLSearchParamsSerdeTransformer,
} from "@/serde/implementations/derivables/serde-transformers.js";
import {
    getConstructorName,
    resolveOneOrMoreStr,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * Configuration for the `Serde` class.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde"`
 * @group Derivables
 */
export type SerdeSettings = {
    /**
     * When `true`, `ArrayBuffer` values are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleArrayBuffer?: boolean;

    /**
     * When `true`, Node.js `Buffer` values are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleBuffer?: boolean;

    /**
     * When `true`, `Uint8Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleUint8Array?: boolean;

    /**
     * When `true`, `Int8Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleInt8Array?: boolean;

    /**
     * When `true`, `Uint16Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleUint16Array?: boolean;

    /**
     * When `true`, `Int16Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleInt16Array?: boolean;

    /**
     * When `true`, `Uint32Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleUint32Array?: boolean;

    /**
     * When `true`, `Int32Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleInt32Array?: boolean;

    /**
     * When `true`, `BigUint64Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleBigUint64Array?: boolean;

    /**
     * When `true`, `BigInt64Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleBigInt64Array?: boolean;

    /**
     * When `true`, `Float32Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleFloat32Array?: boolean;

    /**
     * When `true`, `Float64Array` typed arrays are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleFloat64Array?: boolean;

    /**
     * When `true`, `Map` objects are serialized and deserialized correctly, preserving their key-value pairs.
     * @default true
     */
    shouldHandleMap?: boolean;

    /**
     * When `true`, `Set` objects are serialized and deserialized correctly, preserving their entries.
     * @default true
     */
    shouldHandleSet?: boolean;

    /**
     * When `true`, `BigInt` values are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleBigInt?: boolean;

    /**
     * When `true`, `NaN` values are serialized and deserialized correctly as `NaN` rather than `null`.
     * @default true
     */
    shouldHandleNaN?: boolean;

    /**
     * When `true`, `Infinity` and `-Infinity` values are serialized and deserialized correctly.
     * @default true
     */
    shouldHandleInfinity?: boolean;

    /**
     * When `true`, `undefined` values are serialized and deserialized correctly rather than being omitted.
     * @default true
     */
    shouldHandleUndefined?: boolean;

    /**
     * When `true`, `RegExp` objects are serialized and deserialized correctly, preserving their pattern and flags.
     * @default true
     */
    shouldHandleRegExp?: boolean;

    /**
     * When `true`, `Date` objects are serialized and deserialized correctly, preserving the timestamp.
     * @default true
     */
    shouldHandleDate?: boolean;

    /**
     * When `true`, `URL` objects are serialized and deserialized correctly, preserving the href.
     * @default true
     */
    shouldHandleURL?: boolean;

    /**
     * When `true`, `URLSearchParams` objects are serialized and deserialized correctly, preserving all parameters.
     * @default true
     */
    shouldHandleURLSearchParams?: boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/serde"`
 * @group Derivables
 */
export type SerializedClass = {
    version: "1";
    class_: unknown;
};

/**
 * `Serde` class can be derived from any {@link IFlexibleSerdeAdapter | `IFlexibleSerdeAdapter`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde"`
 * @group Derivables
 */
export class Serde<TSerializedValue>
    implements IFlexibleSerde<TSerializedValue>
{
    /**
     * @example
     * ```ts
     * import type { IFlexibleSerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     *
     * const serde: IFlexibleSerde = new Serde(new SuperJsonSerdeAdapter());
     * ```
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/cyclomatic-complexity
    constructor(
        private readonly serdeAdapter: IFlexibleSerdeAdapter<TSerializedValue>,
        settings: SerdeSettings = {},
    ) {
        const {
            shouldHandleArrayBuffer = true,
            shouldHandleBuffer = true,
            shouldHandleUint8Array = true,
            shouldHandleInt8Array = true,
            shouldHandleUint16Array = true,
            shouldHandleInt16Array = true,
            shouldHandleUint32Array = true,
            shouldHandleInt32Array = true,
            shouldHandleBigUint64Array = true,
            shouldHandleBigInt64Array = true,
            shouldHandleFloat32Array = true,
            shouldHandleFloat64Array = true,
            shouldHandleMap = true,
            shouldHandleSet = true,
            shouldHandleBigInt = true,
            shouldHandleNaN = true,
            shouldHandleInfinity = true,
            shouldHandleRegExp = true,
            shouldHandleDate = true,
            shouldHandleUndefined = true,
            shouldHandleURL = true,
            shouldHandleURLSearchParams = true,
        } = settings;
        if (shouldHandleArrayBuffer) {
            this.registerCustom(new ArrayBufferSerdeTransformer());
        }
        if (shouldHandleBuffer) {
            this.registerCustom(new BufferSerdeTransformer());
        }
        if (shouldHandleUint8Array) {
            this.registerCustom(new Uint8ArraySerdeTransformer());
        }
        if (shouldHandleInt8Array) {
            this.registerCustom(new Int8ArraySerdeTransformer());
        }
        if (shouldHandleUint16Array) {
            this.registerCustom(new Uint16ArraySerdeTransformer());
        }
        if (shouldHandleInt16Array) {
            this.registerCustom(new Int16ArraySerdeTransformer());
        }
        if (shouldHandleUint32Array) {
            this.registerCustom(new Uint32ArraySerdeTransformer());
        }
        if (shouldHandleInt32Array) {
            this.registerCustom(new Int32ArraySerdeTransformer());
        }
        if (shouldHandleBigUint64Array) {
            this.registerCustom(new BigUint64ArraySerdeTransformer());
        }
        if (shouldHandleBigInt64Array) {
            this.registerCustom(new BigInt64ArraySerdeTransformer());
        }
        if (shouldHandleFloat32Array) {
            this.registerCustom(new Float32ArraySerdeTransformer());
        }
        if (shouldHandleFloat64Array) {
            this.registerCustom(new Float64ArraySerdeTransformer());
        }
        if (shouldHandleMap) {
            this.registerCustom(new MapSerdeTransformer());
        }
        if (shouldHandleSet) {
            this.registerCustom(new SetSerdeTransformer());
        }
        if (shouldHandleBigInt) {
            this.registerCustom(new BigIntSerdeTransformer());
        }
        if (shouldHandleNaN) {
            this.registerCustom(new NaNSerdeTransformer());
        }
        if (shouldHandleInfinity) {
            this.registerCustom(new InfinitySerdeTransformer());
        }
        if (shouldHandleUndefined) {
            this.registerCustom(new UndefinedSerdeTransformer());
        }
        if (shouldHandleRegExp) {
            this.registerCustom(new RegExpSerdeTransformer());
        }
        if (shouldHandleDate) {
            this.registerCustom(new DateSerdeTransformer());
        }
        if (shouldHandleURL) {
            this.registerCustom(new URLSerdeTransformer());
        }
        if (shouldHandleURLSearchParams) {
            this.registerCustom(new URLSearchParamsSerdeTransformer());
        }
    }

    /**
     * @example
     * ```ts
     * import type { IFlexibleSerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     *
     * const serde: IFlexibleSerde = new Serde(new SuperJsonSerdeAdapter());
     *
     * const value = { a: 1, b: 2 };
     * const serializedValue = serde.serialize(value);
     *
     * // Will print out { a: 1, b: 2} as json string, this because of the SuperJsonSerdeAdapter
     * console.log(serializedValue);
     * ```
     */
    serialize<TValue>(value: TValue): TSerializedValue {
        return this.serdeAdapter.serialize(value);
    }

    /**
     * @example
     * ```ts
     * import type { IFlexibleSerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     *
     * const serde: IFlexibleSerde = new Serde(new SuperJsonSerdeAdapter());
     *
     * const value = { a: 1, b: 2 };
     * const deserializedValue = serde.deserialize(serde.serialize(value));
     *
     * // Will print out { a: 1, b: 2}
     * console.log(deserializedValue);
     *
     * // Will print false
     * console.log(value === deserializedValue);
     * ```
     */
    deserialize<TValue>(serializedValue: TSerializedValue): TValue {
        return this.serdeAdapter.deserialize(serializedValue);
    }

    /**
     * @example
     * ```ts
     * import type { IFlexibleSerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { ISerializable } from "@daiso-tech/core/serde/contracts";
     *
     * const serde: IFlexibleSerde = new Serde(new SuperJsonSerdeAdapter());
     *
     * type ISerializedUser = {
     *   name: string;
     *   age: number
     * };
     *
     * class User implements ISerializable<ISerializedUser> {
     *   static deserialize(serializedUser: ISerializedUser): User {
     *     return new User(serializedUser.name, serializedUser.age);
     *   }
     *
     *   constructor(public readonly name: string, public readonly age: number) {}
     *
     *   serialize(): ISerializedUser {
     *     return {
     *       name: this.name,
     *       age: this.age,
     *     };
     *   }
     * }
     *
     * serde.registerClass(AddEvent);
     *
     * const user = new User("Carl", 30);
     * const deserializedUser = serde.deserialize<User>(serde.serialize(user));
     *
     * // Will print "Carl"
     * console.log(deserializedUser.name);
     *
     * // Will print 30
     * console.log(deserializedUser.age);
     *
     * // Will print true
     * console.log(deserializedUser instanceof User);
     *
     * // Will print false
     * console.log(user === deserializedUser);
     * ```
     */
    registerClass<TSerializedClassInstance extends SerializedValueBase>(
        class_: SerializableClass<TSerializedClassInstance>,
        prefix?: OneOrMore<string>,
    ): this {
        return this.registerCustom<
            ISerializable<TSerializedClassInstance>,
            SerializedClass
        >(
            {
                isApplicable(
                    value,
                ): value is ISerializable<TSerializedClassInstance> {
                    return (
                        value instanceof class_ &&
                        getConstructorName(value) === class_.name
                    );
                },
                deserialize(serializedValue) {
                    return class_.deserialize(
                        serializedValue.class_ as TSerializedClassInstance,
                    );
                },
                serialize(deserializedValue) {
                    return {
                        version: "1",
                        class_: deserializedValue.serialize(),
                    };
                },
                name: class_.name,
            },
            prefix,
        );
    }

    /**
     * @example
     * ```ts
     * import type { IFlexibleSerde, ISerializable } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     *
     * const serde: IFlexibleSerde = new Serde(new SuperJsonSerdeAdapter());
     *
     * type ISerializedUser = {
     *   name: string;
     *   age: number
     * };
     *
     * class User implements ISerializable<ISerializedUser> {
     *   static deserialize(serializedUser: ISerializedUser): User {
     *     return new User(serializedUser.name, serializedUser.age);
     *   }
     *
     *   constructor(public readonly name: string, public readonly age: number) {}
     *
     *   serialize(): ISerializedUser {
     *     return {
     *       name: this.name,
     *       age: this.age,
     *     };
     *   }
     * }
     *
     * serde.registerCustom<User, ISerializedUser>({
     *   name: User.name,
     *   isApplicable: (value): value is User => {
     *     return value instanceof User;
     *   },
     *   serialize: (value: User): ISerializedUser => {
     *     return {
     *       name: value.name,
     *       age: value.age
     *     };
     *   },
     *   deserialize: (value: ISerializedUser): User => {
     *     return new User(value.name, value.age);
     *   }
     * });
     *
     * const user = new User("Carl", 30);
     * const deserializedUser = serde.deserialize<User>(serde.serialize(user));
     *
     * // Will print "Carl"
     * console.log(deserializedUser.name);
     *
     * // Will print 30
     * console.log(deserializedUser.age);
     *
     * // Will print true
     * console.log(deserializedUser instanceof User);
     *
     * // Will print false
     * console.log(user === deserializedUser);
     * ```
     */
    registerCustom<
        TCustomDeserialized,
        TCustomSerialized extends SerializedValueBase,
    >(
        transformer: ISerdeTransformer<TCustomDeserialized, TCustomSerialized>,
        prefix?: OneOrMore<string>,
    ): this {
        let name = resolveOneOrMoreStr(transformer.name);
        if (prefix !== undefined) {
            name = resolveOneOrMoreStr([resolveOneOrMoreStr(prefix), name]);
        }
        this.serdeAdapter.registerCustom({
            name,
            isApplicable: (value) => transformer.isApplicable(value),
            serialize: (value) => transformer.serialize(value),
            deserialize: (value) => transformer.deserialize(value),
        });
        return this;
    }
}
