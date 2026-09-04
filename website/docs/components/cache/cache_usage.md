---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Cache usage
tags:
    - Cache
    - Usage
    - Schema
    - Validation
keywords:
    - Cache
    - Usage
    - Schema
    - Validation
---

# Cache usage

The `eridu-tech/cache` component provides a way for storing key-value pairs with expiration independent of data storage

## Initial configuration

To begin using the `Cache` class, you'll need to create and configure an instance:

```ts file=./cache_usage-samples/cache_initial_config.ts
```

:::info
Here is a complete list of settings for the [`Cache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.CacheSettingsBase.html) class.
:::

## Cache basics

### Adding keys

You can add a key with a optional TTL to overide the default:

```ts file=./cache_usage-samples/cache_add.ts
```

The method returns true if the key does not exists.

### Retrieving keys

You can retrieve the key:

```ts file=./cache_usage-samples/cache_get.ts
```

### Checking key existence

You can check if the key exists:

```ts file=./cache_usage-samples/cache_exists.ts
```

You can check if the key is missing:

```ts file=./cache_usage-samples/cache_missing.ts
```

### Updating keys

You can update a key and true will be returned if the key exists and was updated:

```ts file=./cache_usage-samples/cache_update.ts
```

You can increment the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown:

```ts file=./cache_usage-samples/cache_increment.ts
```

You can decrement the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown,:

```ts file=./cache_usage-samples/cache_decrement.ts
```

You can perform an upsert that replaces the ttl when updated. True will be returned if the key was updated otherwise false is returned:

```ts file=./cache_usage-samples/cache_put.ts
```

### Removing keys

You can remove a key and true will be returned if the key was found and removed:

```ts file=./cache_usage-samples/cache_remove.ts
```

You can remove multiple keys and true will be returned if one of the keys exists and where removed:

```ts file=./cache_usage-samples/cache_remove_many.ts
```

You can clear all the keys of the given namespace:

```ts file=./cache_usage-samples/cache_clear.ts
```

## Patterns

### Compile time type safety

You can enforce compile time type safety by setting the cache value type:

```ts file=./cache_usage-samples/compile_time_type_safety.ts
```

If you have multiple types you can use algeberical enums:

```ts file=./cache_usage-samples/cache_union_types.ts
```

Alternatively you can use different `Cache` classes with different namespaces:

```ts file=./cache_usage-samples/cache_multiple_namespaces.ts
```

### Runtime type safety

You can validate cache values against a standard-schema-compliant schema by providing the `schema` setting. This works with any library that implements the `StandardSchemaV1` specification, such as Zod, ArkType and Valibot.

When a schema is provided, values are validated:

- **On write** — before a value is stored, for the `add`, `put`, `update` and `getOrAdd` methods.
- **On read** — when `shouldValidateOutput` is `true` (the default), values returned by `get`, `getAndRemove` and `getOrAdd` are validated on retrieval. This catches malformed data already present in the cache at read time, instead of silently returning it.

If validation fails, a `ValidationError` is thrown.

```ts file=./cache_usage-samples/cache_runtime_validation.ts
```

#### Disabling output validation

If you only want to validate values on write and skip validation when reading, set `shouldValidateOutput` to `false`:

```ts file=./cache_usage-samples/cache_disable_output_validation.ts
```

### Additional methods

You can retrieve the key and if it does not exist an error will be thrown:

```ts file=./cache_usage-samples/cache_get_or_fail.ts
```

You can retrieve the key and if it does not exist you can return a default value:

```ts file=./cache_usage-samples/cache_get_or.ts
```

You can retrieve the key and if it does not exist you can insert a default value that will aslo be returned:

```ts file=./cache_usage-samples/cache_get_or_add.ts
```

You can retrieve the key and afterwards remove it:

```ts file=./cache_usage-samples/cache_get_and_remove.ts
```

You can add key and if it does exist an error will be thrown:

```ts file=./cache_usage-samples/cache_add_or_fail.ts
```

You can update the key and if it does not exist an error will be thrown:

```ts file=./cache_usage-samples/cache_update_or_fail.ts
```

You can increment the key and if it does not exist an error will be thrown:

```ts file=./cache_usage-samples/cache_increment_or_fail.ts
```

You can decrement the key and if it does not exist an error will be thrown:

```ts file=./cache_usage-samples/cache_decrement_or_fail.ts
```

You can remove the key and if it does not exist an error will be thrown:

```ts file=./cache_usage-samples/cache_remove_or_fail.ts
```

### Separating cache reading from manipulation

The library includes 2 additional contracts:

- [`IReadableCache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.IReadableCache.html) - Allows only for reading cache.

- [`ICache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.ICache.html) - Allows for both reading and manipulating the cache.

This separation makes it easy to visually distinguish the two contracts, making it immediately obvious that they serve different purposes.

```ts file=./cache_usage-samples/cache_read_write_contracts.ts
```

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.
