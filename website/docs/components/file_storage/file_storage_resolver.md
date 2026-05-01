---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: FileStorage resolver classes
tags:
    - FileStorage
    - Resolvers
keywords:
    - FileStorage
    - Resolvers
---

# FileStorageResolver

The `FileStorageResolver` class provides a flexible way to configure and switch between different file-storage adapters at runtime.

## Initial configuration

To begin using the `IFileStorageFactory`, You will need to register all required adapters during initialization.

```ts
import { FileStorageResolver } from "@daiso-tech/core/file-storage";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";

const fileStorageResolver = new FileStorageResolver({
    adapters: {
        memory: new MemoryFileStorageAdapter(),
        fs: new FsFileStorageAdapter(),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
```

## Usage

### 1. Using the default adapter

```ts
await fileStorageResolver.use().create("file.txt").add("Text file content");
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await fileStorageResolver.use("fs").create("file.txt").add("Text file content");
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts
await fileStorageResolver
    .setNamespace(new Namespace("@my-namespace"))
    .use("fs")
    .create("file.txt")
    .add("Text file content");
```

:::info
Note that the `FileStorageResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/file-storage`](https://daiso-tech.github.io/daiso-core/modules/FileStorage.html) API docs.
