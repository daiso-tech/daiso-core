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

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

### Multiple keys — `removeMany`

The `removeMany` method receives an array of keys. The plugin maps over the array, prefixing each entry:

```ts
adapter.removeMany(context, ["a.pdf", "b.pdf"]);
// -> adapter.removeMany(context, ["prefix:a.pdf", "prefix:b.pdf"])
```
