/**
 * @module Serde
 */

import { type TestAPI, type ExpectStatic, beforeEach, vi } from "vitest";

import {
    type IFlexibleSerdeAdapter,
    type ISerdeTransformerAdapter,
    type ISerializable,
} from "@/serde/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/serde/test-utilities"`
 * @group TestUtilities
 */
export type FlexibleSerdeAdapterSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    createAdapter: () => IFlexibleSerdeAdapter;
};

/**
 * The `flexibleSerdeAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IFlexibleSerdeAdapter | `IFlexibleSerdeAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/test-utilities"`
 * @group TestUtilities
 * @example
 * ```ts
 * import { describe, expect, test } from "vitest";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import { flexibleSerdeAdapterTestSuite } from "@daiso-tech/core/serde/test-utilities";
 *
 * describe("class: SuperJsonSerdeAdapter", () => {
 *     flexibleSerdeAdapterTestSuite({
 *         createAdapter: () => new SuperJsonSerdeAdapter(),
 *         expect,
 *         test,
 *     });
 * });
 * ```
 */
export function flexibleSerdeAdapterTestSuite(
    settings: FlexibleSerdeAdapterSuiteSettings,
): void {
    const { expect, test, createAdapter } = settings;
    let flexibleSerdeAdapter: IFlexibleSerdeAdapter;

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
    const array_ = [0, -1, 1, -1.5, 1.5, true, false, "str"];
    const object_ = {
        a: 0,
        b: -1,
        c: 1,
        d: -1.5,
        e: 1.5,
        i: "str",
        j: true,
        l: false,
    };

    beforeEach(() => {
        flexibleSerdeAdapter = createAdapter();
    });
    test("Should work with positive integer", () => {
        const value = 1;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with negative integer", () => {
        const value = -1;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with positive decimal", () => {
        const value = 1.5;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with negative decimal", () => {
        const value = -1.5;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with true", () => {
        const value = true;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with false", () => {
        const value = false;
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with string", () => {
        const value = "str";
        expect(
            flexibleSerdeAdapter.deserialize(
                flexibleSerdeAdapter.serialize(value),
            ),
        ).toBe(value);
    });
    test("Should work with array of number, boolean, string, object, array", () => {
        const value = [
            ...array_,
            array_,
            {
                ...object_,
                object_,
                array: [
                    ...array_,
                    array_,
                    {
                        ...object_,
                        object_,
                        array_,
                    },
                ],
            },
        ];
        const deserializedValue = flexibleSerdeAdapter.deserialize(
            flexibleSerdeAdapter.serialize(value),
        );
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with object of number, boolean, string, array, object", () => {
        const value = {
            ...object_,
            object_,
            array: [
                ...array_,
                array_,
                {
                    ...object_,
                    object_,
                    array_,
                },
            ],
        };
        const deserializedValue = flexibleSerdeAdapter.deserialize(
            flexibleSerdeAdapter.serialize(value),
        );
        expect(deserializedValue).toEqual(value);
    });
    test("Should work with custom ISerdeTransformerAdapter", () => {
        const transformer: ISerdeTransformerAdapter<User, SerializedUser> = {
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
        flexibleSerdeAdapter.registerCustom(transformer);

        const value = new User("a", 20);
        const deserializedValue = flexibleSerdeAdapter.deserialize<User>(
            flexibleSerdeAdapter.serialize(value),
        );
        expect(deserializedValue).toBeInstanceOf(User);
        expect(deserializedValue.age).toBe(value.age);
        expect(deserializedValue.name).toBe(value.name);
    });
    test("Should call on the first ISerdeTransformerAdapter when same name is used", () => {
        const transformer1: ISerdeTransformerAdapter<User, SerializedUser> = {
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

        flexibleSerdeAdapter.registerCustom(transformer1);

        const transformer2: ISerdeTransformerAdapter<User, SerializedUser> = {
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
        flexibleSerdeAdapter.registerCustom(transformer2);

        const value = new User("a", 20);
        flexibleSerdeAdapter.deserialize<User>(
            flexibleSerdeAdapter.serialize(value),
        );

        expect(isApplicable).toHaveBeenCalled();
        expect(serialize).toHaveBeenCalled();
        expect(deserialize).toHaveBeenCalled();
    });
    test("Should not call on the second ISerdeTransformerAdapter when same name is used", () => {
        const transformer1: ISerdeTransformerAdapter<User, SerializedUser> = {
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
        flexibleSerdeAdapter.registerCustom(transformer1);

        const transformer2: ISerdeTransformerAdapter<User, SerializedUser> = {
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

        flexibleSerdeAdapter.registerCustom(transformer2);

        const value = new User("a", 20);
        flexibleSerdeAdapter.deserialize<User>(
            flexibleSerdeAdapter.serialize(value),
        );

        expect(isApplicable).not.toHaveBeenCalled();
        expect(serialize).not.toHaveBeenCalled();
        expect(deserialize).not.toHaveBeenCalled();
    });
}
