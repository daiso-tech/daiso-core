---
tags:
 - Utilities
keywords:
 - Utilities
---

# Serde

The `@daiso-tech/core/serde` component provides seamless way to serialize/deserialize data and adding custom serialization/deserialization logic for custom data types.

## Initial configuration

```ts
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
```

## Serde basics

### Serializing and deserializing values

Here is an example of serializing and deserializing a value.

```ts
const serializedValue = serde.serialize({
    name: "abra",
    age: 20,
});

const deserializedValue = serde.deserialize(serializedValue);
```

### Custom serialization and deserialization logic

The `registerCustom` method offers control over serialization and deserialization behavior.

```ts
import type { ISerdeTransformer } from "@daiso-tech/core/serde/contracts";

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
```

:::info
Note the `ISerdeTranformer` object can be dynamically created.
:::

### Custom serialization and deserialization logic of classes

The `registerClass` method provides a simplified abstraction over `registerCustom` method for serialization and deserialization classes.

```ts
import type { ISerializable } from "@daiso-tech/core/serde/contracts";

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
```

:::danger
Note you need to register the class before serializing or deserializing any class instances.
:::

:::warning
To ensure correct serialization and deserialization, class names must be unique. If multiple classes share the same name, conflicts may occur when serializing and deserializing the objects. To resolve this, you can assign a unique prefix to differentiate between them during the process.

```ts
serde.registerClass(User, "my-library");
```
:::

## Patterns

### Usage with other components

When using `Serde` class instance there is no need to call `serialize` and `deserialize` manually. Because components like `Cache` handle it automatically through their adapter.

```ts
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { ListCollection } from "@daiso-tech/core/collection";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
serde.registerClass(ListCollection);

const cache = new Cache({
    adapter: new RedisCacheAdapter({
        database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
        serde,
    }),
});

const listCollection = new ListCollection(["a", "b", "c", "d", "e"]);

await cache.add("list", listCollection);

const deserializedListCollection = await cache.get("list");
if (deserializedListCollection) {
    // Logs "c"
    console.log(deserializedListCollection.getOrFail(2));
}
```

:::info
Note you should use one `Serde` class instance accross all components and register all serializable objects before component usage.
:::

## Separating serialization, deserialization and registering custom serialization/deserialization logic

The library includes 4 additional contracts:

-   `ISerializer` - Allows only for serialization.

-   `IDeserializer` - Allows only for deserialization.

-   `ISerde` - Allows for both serialization and deserialization.

-   `ISerderRegister` - Allows only for registering custom serialization/deserialization logic.

-   `IFlexibleSerde` – Allows for both serialization, deserialization and for registering custom serialization/deserialization and deserialization logic.

This seperation makes it easy to visually distinguish the 4 contracts, making it immediately obvious that they serve different purposes.

## Further information

For further information refer to [`@daiso-tech/core/serde`](https://daiso-tech.github.io/daiso-core/modules/Serde.html) API docs.
