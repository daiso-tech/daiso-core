/**
 * @module Serde
 */

import { Buffer } from "node:buffer";

import { type TestAPI, type ExpectStatic, beforeEach, vi } from "vitest";

import {
    type IFlexibleSerde,
    type ISerdeTransformer,
    type ISerializable,
} from "@/serde/contracts/_module.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/test-utilities"`
 * @group TestUtilities
 */
export type FlexibleSerdeSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    createSerde: () => IFlexibleSerde;
};
/**
 * The `flexibleSerdeTestSuite` function simplifies the process of testing your custom implementation of {@link IFlexibleSerde | `IFlexibleSerde`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { describe, test, expect } from "vitest";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { flexibleSerdeTestSuite } from "@daiso-tech/core/serde/test-utilities";
 *
 * describe("class: Serde", () => {
 *     flexibleSerdeTestSuite({
 *         createSerde: () => new Serde(new SuperJsonSerdeAdapter()),
 *         test,
 *         expect,
 *     });
 * });
 * ```
 */
export function flexibleSerdeTestSuite(
    settings: FlexibleSerdeSuiteSettings,
): void {
    const { expect, test, createSerde } = settings;
    let flexibleSerde: IFlexibleSerde;

    type SerializedUser = {
        version: "1";
        name: string;
        age: number;
    };
    class User implements ISerializable<SerializedUser> {
        static deserialize(serializedUser: SerializedUser): User {
            return new User(serializedUser.name, serializedUser.age);
        }

        constructor(
            public readonly name: string,
            public readonly age: number,
        ) {}

        serialize(): SerializedUser {
            return {
                version: "1",
                name: this.name,
                age: this.age,
            };
        }

        getInfo(): string {
            return `name: ${this.name}, age: ${this.age.toString()}`;
        }
    }
    class ExtendedUser extends User {
        static override deserialize(
            serializedUser: SerializedUser,
        ): ExtendedUser {
            return new ExtendedUser(serializedUser.name, serializedUser.age);
        }
    }

    beforeEach(() => {
        flexibleSerde = createSerde();
    });
    test("Should work with positive integer", () => {
        const value = 1;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with negative integer", () => {
        const value = -1;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with positive decimal", () => {
        const value = 1.5;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with negative decimal", () => {
        const value = -1.5;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with NaN", () => {
        const value = NaN;
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeNaN();
    });
    test("Should work with Infinity", () => {
        const value = Infinity;
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(isFinite(deserializedValue as number)).toBe(false);
    });
    test("Should work with null", () => {
        const value = null;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with undefined", () => {
        const value = undefined;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with Bigint", () => {
        const value = 20n;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with true", () => {
        const value = true;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with false", () => {
        const value = false;
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with string", () => {
        const value = "str";
        expect(flexibleSerde.deserialize(flexibleSerde.serialize(value))).toBe(
            value,
        );
    });
    test("Should work with Date", () => {
        const value = new Date("2024-01-01");
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Date);
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with RegExp", () => {
        const value = /test/;
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(RegExp);
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with Buffer", () => {
        const value = Buffer.from("asd");
        const deserializedValue = flexibleSerde.deserialize<Buffer>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Buffer);
        expect(deserializedValue.toString("base64")).toEqual(
            value.toString("base64"),
        );
    });
    test("Should work with ArrayBuffer", () => {
        const value = Buffer.from("asd").buffer;
        const deserializedValue = flexibleSerde.deserialize<ArrayBuffer>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Uint8Array", () => {
        const value = new Uint8Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Uint8Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Uint8Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Int8Array", () => {
        const value = new Int8Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Int8Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Int8Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Uint16Array", () => {
        const value = new Uint16Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Uint16Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Uint16Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Int16Array", () => {
        const value = new Int16Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Int16Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Int16Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Uint32Array", () => {
        const value = new Uint32Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Uint32Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Uint32Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Int32Array", () => {
        const value = new Int32Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Int32Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Int32Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Float32Array", () => {
        const value = new Float32Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Float32Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Float32Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with Float64Array", () => {
        const value = new Float64Array(Buffer.from("asd"));
        const deserializedValue = flexibleSerde.deserialize<Float64Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Float64Array);
        expect(Buffer.from(deserializedValue).toString("base64")).toEqual(
            Buffer.from(value).toString("base64"),
        );
    });
    test("Should work with BigUint64Array", () => {
        const value = new BigUint64Array(Buffer.from("asd").buffer);
        const deserializedValue = flexibleSerde.deserialize<BigUint64Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(BigUint64Array);
        expect(
            Buffer.from(deserializedValue.buffer).toString("base64"),
        ).toEqual(Buffer.from(value.buffer).toString("base64"));
    });
    test("Should work with BigInt64Array", () => {
        const value = new BigInt64Array(Buffer.from("asd").buffer);
        const deserializedValue = flexibleSerde.deserialize<BigInt64Array>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(BigInt64Array);
        expect(
            Buffer.from(deserializedValue.buffer).toString("base64"),
        ).toEqual(Buffer.from(value.buffer).toString("base64"));
    });
    test("Should work with URL", () => {
        const value = new URL("../cats", "http://www.example.com/dogs");
        const deserializedValue = flexibleSerde.deserialize<URL>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(URL);
        expect(deserializedValue.toString()).toEqual(
            deserializedValue.toString(),
        );
    });
    test("Should work with URLSearchParams", () => {
        const value = new URLSearchParams([
            ["a", "1"],
            ["b", "2"],
        ]);
        const deserializedValue = flexibleSerde.deserialize<URLSearchParams>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(URLSearchParams);
        expect(deserializedValue.toString()).toEqual(
            deserializedValue.toString(),
        );
    });
    test("Should work with Set", () => {
        const value = new Set(["a", "b", "c"]);
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Set);
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with Map", () => {
        const value = new Map([
            ["a", 1],
            ["b", 2],
            ["c", 3],
        ]);
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(Map);
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with array", () => {
        const value = [
            0,
            -1,
            1,
            -1.5,
            1.5,
            NaN,
            Infinity,
            2n,
            true,
            false,
            "str",
            new Date("2024-01-01"),
            new Set(["a", "b", "c"]),
            new Map([
                ["a", 1],
                ["b", 2],
                ["c", 3],
            ]),
            /test/,
        ];
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with object", () => {
        const value = Object.fromEntries([
            ["a", 0],
            ["b", -1],
            ["c", 1],
            ["d", -1.5],
            ["e", 1.5],
            ["f", NaN],
            ["g", Infinity],
            ["h", 2n],
            ["j", true],
            ["l", false],
            ["i", "str"],
            ["r", new Date("2024-01-01")],
            ["k", new Set(["a", "b", "c"])],
            [
                "p",
                new Map([
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ]),
            ],
            ["a", /test/],
        ] as Array<[string, unknown]>);
        const deserializedValue = flexibleSerde.deserialize(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with custom registerd classes", () => {
        flexibleSerde.registerClass(User);
        const user = new User("Abra", 20);
        const deserializedValue: User = flexibleSerde.deserialize(
            flexibleSerde.serialize(user),
        );
        expect(deserializedValue).toBeInstanceOf(User);
        expect(deserializedValue.getInfo()).toBe("name: Abra, age: 20");
    });
    test("Should work with custom registerd classes that is extended", () => {
        flexibleSerde.registerClass(ExtendedUser);
        const user = new ExtendedUser("Abra", 20);
        const deserializedValue: ExtendedUser = flexibleSerde.deserialize(
            flexibleSerde.serialize(user),
        );
        expect(deserializedValue).toBeInstanceOf(ExtendedUser);
        expect(deserializedValue.getInfo()).toBe("name: Abra, age: 20");
    });
    test("Should work with custom ISerdeTransformer", () => {
        const transformer: ISerdeTransformer<User, SerializedUser> = {
            name: User.name,
            isApplicable(value): value is User {
                return (
                    value instanceof User &&
                    value.constructor.name === User.name
                );
            },
            deserialize(serializedValue) {
                return User.deserialize(serializedValue);
            },
            serialize(deserializedValue) {
                return deserializedValue.serialize();
            },
        };
        flexibleSerde.registerCustom(transformer);

        const value = new User("a", 20);
        const deserializedValue = flexibleSerde.deserialize<User>(
            flexibleSerde.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(User);
        expect(deserializedValue.age).toBe(value.age);
        expect(deserializedValue.name).toBe(value.name);
    });
    test("Should call on the first ISerdeTransformer when same name is used", () => {
        const transformer1: ISerdeTransformer<User, SerializedUser> = {
            name: User.name,
            isApplicable: (value: unknown): value is User => {
                return (
                    value instanceof User &&
                    value.constructor.name === User.name
                );
            },
            deserialize: (serializedValue: SerializedUser): User => {
                return User.deserialize(serializedValue);
            },
            serialize: (deserializedValue: User): SerializedUser => {
                return deserializedValue.serialize();
            },
        };

        const isApplicable = vi.spyOn(transformer1, "isApplicable");
        const serialize = vi.spyOn(transformer1, "serialize");
        const deserialize = vi.spyOn(transformer1, "deserialize");

        flexibleSerde.registerCustom(transformer1);

        const transformer2: ISerdeTransformer<User, SerializedUser> = {
            name: User.name,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            isApplicable: vi.fn((value: unknown): value is User => {
                return (
                    value instanceof User &&
                    value.constructor.name === User.name
                );
            }) as any,
            deserialize: vi.fn((serializedValue: SerializedUser): User => {
                return User.deserialize(serializedValue);
            }),
            serialize: vi.fn((deserializedValue: User): SerializedUser => {
                return deserializedValue.serialize();
            }),
        };
        flexibleSerde.registerCustom(transformer2);

        const value = new User("a", 20);
        flexibleSerde.deserialize<User>(flexibleSerde.serialize(value));

        expect(isApplicable).toHaveBeenCalled();
        expect(serialize).toHaveBeenCalled();
        expect(deserialize).toHaveBeenCalled();
    });
    test("Should not call on the second ISerdeTransformer when same name is used", () => {
        const transformer1: ISerdeTransformer<User, SerializedUser> = {
            name: User.name,
            isApplicable: (value: unknown): value is User => {
                return (
                    value instanceof User &&
                    value.constructor.name === User.name
                );
            },
            deserialize: (serializedValue: SerializedUser): User => {
                return User.deserialize(serializedValue);
            },
            serialize: (deserializedValue: User): SerializedUser => {
                return deserializedValue.serialize();
            },
        };
        flexibleSerde.registerCustom(transformer1);

        const transformer2: ISerdeTransformer<User, SerializedUser> = {
            name: User.name,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            isApplicable: vi.fn((value: unknown): value is User => {
                return (
                    value instanceof User &&
                    value.constructor.name === User.name
                );
            }) as any,
            deserialize: vi.fn((serializedValue: SerializedUser): User => {
                return User.deserialize(serializedValue);
            }),
            serialize: vi.fn((deserializedValue: User): SerializedUser => {
                return deserializedValue.serialize();
            }),
        };

        const isApplicable = vi.spyOn(transformer2, "isApplicable");
        const serialize = vi.spyOn(transformer2, "serialize");
        const deserialize = vi.spyOn(transformer2, "deserialize");

        flexibleSerde.registerCustom(transformer2);

        const value = new User("a", 20);
        flexibleSerde.deserialize<User>(flexibleSerde.serialize(value));

        expect(isApplicable).not.toHaveBeenCalled();
        expect(serialize).not.toHaveBeenCalled();
        expect(deserialize).not.toHaveBeenCalled();
    });
}
