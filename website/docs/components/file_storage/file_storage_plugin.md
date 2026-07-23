---
sidebar_position: 5
sidebar_label: Plugins
pagination_label: FileStorage plugin
tags:
    - FileStorage
    - Plugins
keywords:
    - FileStorage
    - Plugins
    - withFileStoragePrefix
    - withFileStorageLock
---

# FileStorage Plugins

## withFileStoragePrefix plugin

The FileStorage prefix plugin intercepts calls to a file-storage adapter and transparently prefixes all file keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant storage** — Prefix file keys with a tenant identifier to isolate files between tenants
- **Environment isolation** — Separate development, staging, and production file storage
- **Directory scoping** — Organize files into virtual directories by prepending a path prefix
- **Bucket consolidation** — Use a single storage bucket/container with namespaced keys instead of multiple buckets

### How it works

The `withFileStoragePrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a file key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method                 | Key argument               | Pattern                     |
| ---------------------- | -------------------------- | --------------------------- |
| `getPublicUrl`         | Second argument (`key`)    | `prefix + key`              |
| `getSignedDownloadUrl` | Second argument (`key`)    | `prefix + key`              |
| `getSignedUploadUrl`   | Second argument (`key`)    | `prefix + key`              |
| `exists`               | Second argument (`key`)    | `prefix + key`              |
| `getStream`            | Second argument (`key`)    | `prefix + key`              |
| `getBytes`             | Second argument (`key`)    | `prefix + key`              |
| `getMetaData`          | Second argument (`key`)    | `prefix + key`              |
| `add`                  | Second argument (`key`)    | `prefix + key`              |
| `addStream`            | Second argument (`key`)    | `prefix + key`              |
| `update`               | Second argument (`key`)    | `prefix + key`              |
| `updateStream`         | Second argument (`key`)    | `prefix + key`              |
| `put`                  | Second argument (`key`)    | `prefix + key`              |
| `putStream`            | Second argument (`key`)    | `prefix + key`              |
| `copy`                 | Second argument (`source`) | `prefix + source`           |
| `copyAndReplace`       | Second argument (`source`) | `prefix + source`           |
| `move`                 | Second argument (`source`) | `prefix + source`           |
| `moveAndReplace`       | Second argument (`source`) | `prefix + source`           |
| `removeMany`           | Second argument (`keys`)   | `keys.map(k => prefix + k)` |
| `removeByPrefix`       | Second argument (`key`)    | `prefix + key`              |

#### Copy and move behavior

For the `copy`, `copyAndReplace`, `move`, and `moveAndReplace` methods, only the **source** key (the first string argument after context) is prefixed. The destination key is passed through unchanged. This allows copying/moving files to an un-prefixed location.

### Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { withFileStoragePrefix } from "@daiso-tech/core/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the prefix plugin
const prefixedAdapter = withPlugin(
    adapter,
    withFileStoragePrefix("tenant-42/"),
);

// The key "avatars/user1.png" is prefixed to "tenant-42/avatars/user1.png"
await prefixedAdapter.add(context, "avatars/user1.png", content);

// Copy preserves the prefix on the source only
await prefixedAdapter.copy(context, "avatars/user1.png", "backups/user1.png");
// -> adapter.copy(context, "tenant-42/avatars/user1.png", "backups/user1.png")
```

### Before/after behavior

**Before** — File keys are used as-is:

```
adapter.getBytes(context, "uploads/report.pdf")
→ retrieves "uploads/report.pdf"
```

**After** — File keys are automatically prefixed:

```
adapter.getBytes(context, "uploads/report.pdf")
→ retrieves "prod/uploads/report.pdf"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

### Multiple keys — `removeMany`

The `removeMany` method receives an array of keys. The plugin maps over the array, prefixing each entry:

```ts
adapter.removeMany(context, ["a.pdf", "b.pdf"]);
// -> adapter.removeMany(context, ["prefix:a.pdf", "prefix:b.pdf"])
```

## withFileStorageLock plugin

The FileStorage lock plugin acquires a distributed lock before executing operations on a file-storage adapter. It wraps all methods (both reads and writes) with a lock acquired via an [`ILockFactory`](../lock/lock_usage.md), ensuring that concurrent access to the same file key is serialised.

### Use cases

- **Concurrency control** — Prevent race conditions when multiple processes read or write the same file
- **Distributed environments** — Coordinate file access across multiple application instances
- **Copy/move safety** — Prevent modifications to source files during copy or move operations
- **Batch safety** — Serialise operations on multiple keys in `removeMany`
- **Signed URL consistency** — Ensure URL generation and file mutations don't overlap

### How it works

The `withFileStorageLock` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on all methods of the adapter. When an enhanced method is invoked, the plugin acquires a lock keyed by the file key (the source key for `copy`/`move`) before executing the operation. The lock is released automatically after the operation completes.

The lock key is derived directly from the file key, ensuring that concurrent operations on the same file are serialised while operations on different files can proceed in parallel.

All methods are protected by default:

| Method                 | Lock key source     | Behaviour                                              |
| ---------------------- | ------------------- | ------------------------------------------------------ |
| `exists`               | Single key          | Acquires lock for the key before checking existence    |
| `getStream`            | Single key          | Acquires lock for the key before reading the stream    |
| `getBytes`             | Single key          | Acquires lock for the key before reading bytes         |
| `getMetaData`          | Single key          | Acquires lock for the key before reading metadata      |
| `add`                  | Single key          | Acquires lock for the key before adding                |
| `addStream`            | Single key          | Acquires lock for the key before adding a stream       |
| `update`               | Single key          | Acquires lock for the key before updating              |
| `updateStream`         | Single key          | Acquires lock for the key before updating a stream     |
| `put`                  | Single key          | Acquires lock for the key before putting               |
| `putStream`            | Single key          | Acquires lock for the key before putting a stream      |
| `copy`                 | Source key          | Acquires lock on the source file before copying        |
| `copyAndReplace`       | Source key          | Acquires lock on the source file before copying        |
| `move`                 | Source key          | Acquires lock on the source file before moving         |
| `moveAndReplace`       | Source key          | Acquires lock on the source file before moving         |
| `removeMany`           | Multiple keys       | Acquires locks for each key sequentially (deduplicated)|
| `getPublicUrl`         | Single key          | Acquires lock for the key before generating the URL    |
| `getSignedDownloadUrl` | Single key          | Acquires lock for the key before generating the URL    |
| `getSignedUploadUrl`   | Single key          | Acquires lock for the key before generating the URL    |

### Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { withFileStorageLock } from "@daiso-tech/core/file-storage/plugins";
import { MemoryLockFactory } from "@daiso-tech/core/lock/memory-lock-factory";

const adapter = new MemoryFileStorageAdapter();
const lockFactory = new MemoryLockFactory();

// Apply the lock plugin
const lockedAdapter = withPlugin(adapter, withFileStorageLock({ lockFactory }));

// Concurrent access to the same file key is serialised
await Promise.all([
    lockedAdapter.getBytes(context, "report.pdf"),
    lockedAdapter.add(context, "report.pdf", content),
]);
```

#### Restricting protected methods

```ts
const adapter = withPlugin(
    adapter,
    withFileStorageLock({
        lockFactory,
        onlyMethods: ["add", "update", "removeMany"],
    }),
);
```

### Settings

| Option        | Type                               | Default                                                                                                                               | Description                                        |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `lockFactory` | `ILockFactory`                     | _(required)_                                                                                                                          | A factory that creates named locks                 |
| `onlyMethods` | `Array<keyof ISignedFileStorageAdapter>` | All methods                                                                                                                      | The subset of methods to protect with a lock       |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
For more information about lock factories, see the [Lock](../lock/lock_usage.md) documentation.
:::
```
