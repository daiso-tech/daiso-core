import type { ISerializable } from "eridu-tech/serde/contracts";

type ISerializedUser = {
    version: "1";
    name: string;
    age: number;
};

class User implements ISerializable<ISerializedUser> {
    static deserialize(serializedUser: ISerializedUser): User {
        return new User(serializedUser.name, serializedUser.age);
    }

    constructor(
        public readonly name: string,
        public readonly age: number,
    ) {}

    serialize(): ISerializedUser {
        return {
            version: "1",
            name: this.name,
            age: this.age,
        };
    }

    logInfo(): void {
        console.log("Name:", this.name, "Age:", this.age);
    }
}

serde.registerClass(User);

const user = new User("Carl", 50);
const serializedUser = serde.serialize(user);
const deserializedUser = serde.deserialize<User>(serializedUser);

// The instances will not be the same because deserializedUser is recreated.
console.log(user === deserializedUser);

// But the content will be the same
deserializedUser.logInfo();
user.logInfo();
