import type { ISerdeTransformer } from "eridu-tech/serde/contracts";

type ISerializedUser = {
    version: "1";
    name: string;
    age: number;
};

const userSerdeTransformer: ISerdeTransformer<User, ISerializedUser> = {
    name: User.name,

    isApplicable(value: unknown): value is User {
        return value instanceof User;
    }

    deserialize(serializedValue: TSerializedValue): User {
        return new User(serializedValue.name, serializedValue.age);
    }

    serialize(deserializedValue: User): TSerializedValue {
        return {
            version: "1",
            name: user.name,
            age: user.age,
        };
    }
}

serde.registerCustom(userSerdeTransformer);
