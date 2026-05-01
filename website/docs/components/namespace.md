---
tags:
    - Utilities
keywords:
    - Utilities
---

# Namespace

The `@daiso-tech/core/namespace` component provides seamless way to group data by prefixing and suffixing keys.

## Namespace class

The `Namespace` class provides a foundational way to prefix or suffix keys. This mechanism is vital for avoiding key conflicts and logically grouping related items, making it a useful primitive block for features like multi-tenancy. Components such as `Cache` and `Lock` utilize it to ensure data isolation.

```ts
import { Namespace } from "@daiso-tech/core/namspace";

const namespace = new Namespace("@my-namespace");

// Logs "@my-namespace:_rt"
console.log(namespace.toString());

const key = namespace.create("my-key");

// Logs "my-key"
console.log(key.get());

// Logs "@my-namespace:_rt:my-key"
console.log(key.toString());

// You can extend the root
const newNamespace = namespace.appendRoot("sub");

// Logs "@my-namespace:sub:_rt"
console.log(newNamespace.toString());

// Logs "@my-namespace:sub:_rt:my-key"
console.log(newNamespace.create("my-key").toString());

// Logs false because they use different namespaces
console.log(newNamspace.create("my-key").equals(namespace.create("my-key")));
```

:::info
Note that the `Namespace` class is serializable. See the [`Serde`](./serde.md#custom-serialization-and-deserialization-logic-of-classes) component for serialization instructions.
:::

## NoOpNamespace class

The `NoOpNamespace` class is used for disabling namespacing.

```ts
import { NoOpNamespace } from "@daiso-tech/core/namspace";

const namespace = new NoOpNamespace();

// Logs ""
console.log(namespace.toString());

const key = namespace.create("my-key");

// Logs "my-key"
console.log(key.get());

// Logs "my-key"
console.log(key.toString());
```

## INamespace contract

Bothe `Namespace` and `INoOpNamepace` implement `INamespace` contract.
The `INamespace` contract used for easily swaping between `Namespace` and `NoOpNamespace` class without changing your code.

```ts
export interface IKey extends IEquals<IKey> {
    get(): string;

    toString(): string;
}

export type INamespace = {
    toString(): string;

    create(key: string): IKey;
};
```

## Further information

For further information refer to [`@daiso-tech/core/namespace`](https://daiso-tech.github.io/daiso-core/modules/Namespace.html) API docs.
