---
slug: /components/serde
tags:
    - Utilities
keywords:
    - Utilities
---

# Serde

The `eridu-tech/serde` component provides seamless way to serialize/deserialize data and adding custom serialization/deserialization logic for custom data types.

## Initial configuration

```ts file=./serde-samples/serde_initial_config.ts
```

## Serde basics

### Serializing and deserializing values

Here is an example of serializing and deserializing a value.

```ts file=./serde-samples/serde_serialize.ts
```

### Custom serialization and deserialization logic

The `registerCustom` method offers control over serialization and deserialization behavior.

```ts file=./serde-samples/serde_register_custom.ts
```

:::info
Note the `ISerdeTranformer` object can be dynamically created.
:::

### Custom serialization and deserialization logic of classes

The `registerClass` method provides a simplified abstraction over `registerCustom` method for serialization and deserialization classes.

```ts file=./serde-samples/serde_register_class.ts
```

:::danger
Note you need to register the class before serializing or deserializing any class instances.
:::

:::warning
To ensure correct serialization and deserialization, class names must be unique. If multiple classes share the same name, conflicts may occur when serializing and deserializing the objects. To resolve this, you can assign a unique prefix to differentiate between them during the process.

```ts file=./serde-samples/serde_register_class_with_prefix.ts
```

:::

## Patterns

### Usage with other components

When using `Serde` class instance there is no need to call `serialize` and `deserialize` manually. Because components like `Cache` handle it automatically through their adapter.

```ts file=./serde-samples/serde_with_cache.ts
```

:::info
Note you should use one `Serde` class instance accross all components and register all serializable objects before component usage.
:::

## Separating serialization, deserialization and registering custom serialization/deserialization logic

The library includes 4 additional contracts:

- `ISerializer` - Allows only for serialization.

- `IDeserializer` - Allows only for deserialization.

- `ISerde` - Allows for both serialization and deserialization.

- `ISerderRegister` - Allows only for registering custom serialization/deserialization logic.

- `IFlexibleSerde` – Allows for both serialization, deserialization and for registering custom serialization/deserialization and deserialization logic.

This separation makes it easy to visually distinguish the 4 contracts, making it immediately obvious that they serve different purposes.

## Further information

For further information refer to [`eridu-tech/serde`](https://eridu-tech.github.io/eridu-tech-core/modules/Serde.html) API docs.
