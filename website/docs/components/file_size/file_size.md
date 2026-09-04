---
slug: /components/file_size
tags:
    - Utilities
keywords:
    - Utilities
---

# FileSize

The `eridu-tech/file-size` component provides an easy way for defining, manipulating, and comparing file size. Furthermore, it is designed for easy integration with external file-size libraries.

### Creating a FileSize

Creating `FileSize` from bytes:

```ts file=./samples/creating_from_bytes.ts
```

Creating `FileSize` from kilo bytes:

```ts file=./samples/creating_from_kilo_bytes.ts
```

Creating `FileSize` from mega bytes:

```ts file=./samples/creating_from_mega_bytes.ts
```

Creating `FileSize` from giga bytes:

```ts file=./samples/creating_from_giga_bytes.ts
```

Creating `FileSize` from tera bytes:

```ts file=./samples/creating_from_tera_bytes.ts
```

Creating `FileSize` from peta bytes:

```ts file=./samples/creating_from_peta_bytes.ts
```

### Comparing FileSize:s

Equals:

```ts file=./samples/comparing_equal.ts
```

Greater than:

```ts file=./samples/comparing_gt.ts
```

Greater than or equals:

```ts file=./samples/comparing_gte.ts
```

Less than:

```ts file=./samples/comparing_lt.ts
```

Less than or equals:

```ts file=./samples/comparing_lte.ts
```

### Converting a FileSize

You can get amount of bytes contained in the `FileSize`:

```ts file=./samples/converting_to_bytes.ts
```

You can get amount of kilo bytes contained in the `FileSize`:

```ts file=./samples/converting_to_kilo_bytes.ts
```

You can get amount of giga bytes contained in the `FileSize`:

```ts file=./samples/converting_to_giga_bytes.ts
```

You can get amount of tera bytes contained in the `FileSize`:

```ts file=./samples/converting_to_tera_bytes.ts
```

You can get amount of peta bytes contained in the `FileSize`:

```ts file=./samples/converting_to_peta_bytes.ts
```

### Serialization and deserialization of FileSize

The `FileSize` class supports serialization and deserialization, allowing you to easily convert instances to and from serialized formats. However, registration is required first:

```ts file=./samples/serde_serialization.ts
```

## FileSize contract

The `IFileSize` contract provides a standardized way to express a file-size as bytes.

Key components like `FileStorage`, rely on this contract, ensuring they are not tightly coupled to a specific file-size implementation.

This decoupling is crucial for interoperability, allowing seamless integration with external file-size libraries.
To integrate a new library, its file-size objects must simply implement the `IFileSize` contract.

:::info
Note `FileSize` class implements `IFileSize` contract.
:::

The `IFileSize` contract requires you to implement the `TO_MILLISECONDS` method on the file-size object, which must return the file-size in milliseconds.

```ts file=./samples/implementing_ifile_size.ts
```

## Further information

For further information refer to [`eridu-tech/file-size`](https://eridu-tech.github.io/eridu-tech-core/modules/FileSize.html) API docs.
