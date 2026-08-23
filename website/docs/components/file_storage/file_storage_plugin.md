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
    - withFileStorageKeyValidator
    - withFileStorageLowerCase
    - withFileStorageInferContentTypeOnRead
    - withFileStorageInferContentTypeOnWrite
    - withFileStorageInferFileTypeOnRead
    - withFileStorageInferFileTypeOnWrite
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
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStoragePrefix } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withFileStoragePrefix("tenant-42/"),
);
```

### Before/after behavior

**Before** — File keys are used as-is:

```ts
adapter.getBytes("uploads/report.pdf", context);
// -> retrieves "uploads/report.pdf"
```

**After** — File keys are automatically prefixed:

```ts
prefixedAdapter.getBytes("uploads/report.pdf", context);
// -> retrieves "tenant-42/uploads/report.pdf"
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
prefixedAdapter.removeMany(["a.pdf", "b.pdf"], context);
// -> prefixedAdapter.removeMany(["tenant-42/a.pdf", "tenant-42/b.pdf"], context)
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

| Method                 | Lock key source | Behaviour                                               |
| ---------------------- | --------------- | ------------------------------------------------------- |
| `exists`               | Single key      | Acquires lock for the key before checking existence     |
| `getStream`            | Single key      | Acquires lock for the key before reading the stream     |
| `getBytes`             | Single key      | Acquires lock for the key before reading bytes          |
| `getMetaData`          | Single key      | Acquires lock for the key before reading metadata       |
| `add`                  | Single key      | Acquires lock for the key before adding                 |
| `addStream`            | Single key      | Acquires lock for the key before adding a stream        |
| `update`               | Single key      | Acquires lock for the key before updating               |
| `updateStream`         | Single key      | Acquires lock for the key before updating a stream      |
| `put`                  | Single key      | Acquires lock for the key before putting                |
| `putStream`            | Single key      | Acquires lock for the key before putting a stream       |
| `copy`                 | Source key      | Acquires lock on the source file before copying         |
| `copyAndReplace`       | Source key      | Acquires lock on the source file before copying         |
| `move`                 | Source key      | Acquires lock on the source file before moving          |
| `moveAndReplace`       | Source key      | Acquires lock on the source file before moving          |
| `removeMany`           | Multiple keys   | Acquires locks for each key sequentially (deduplicated) |
| `getPublicUrl`         | Single key      | Acquires lock for the key before generating the URL     |
| `getSignedDownloadUrl` | Single key      | Acquires lock for the key before generating the URL     |
| `getSignedUploadUrl`   | Single key      | Acquires lock for the key before generating the URL     |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLock } from "eridu-tech/file-storage/plugins";
import { MemoryLockFactory } from "eridu-tech/lock/memory-lock-factory";

const adapter = new MemoryFileStorageAdapter();
const lockFactory = new MemoryLockFactory();

// Apply the lock plugin to the adapter
const lockedAdapter = withPlugin(adapter, withFileStorageLock({ lockFactory }));
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

| Option        | Type                                     | Default      | Description                                  |
| ------------- | ---------------------------------------- | ------------ | -------------------------------------------- |
| `lockFactory` | `ILockFactory`                           | _(required)_ | A factory that creates named locks           |
| `onlyMethods` | `Array<keyof ISignedFileStorageAdapter>` | All methods  | The subset of methods to protect with a lock |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
For more information about lock factories, see the [Lock](../lock/lock_usage.md) documentation.
:::

## withFileStorageKeyValidator plugin

The FileStorage key validator plugin validates every file key before it reaches a file-storage adapter. When a key fails validation, an `InvalidKeyFileError` is thrown and the underlying adapter method is never invoked.

### Use cases

- **Path traversal protection** — Reject keys containing `../` to prevent escaping the intended storage directory
- **Input sanitization** — Block keys containing control characters such as newlines or tabs
- **Empty key detection** — Reject keys that are empty or consist only of whitespace
- **Custom validation rules** — Provide your own validator to enforce project-specific key constraints

### How it works

The `withFileStorageKeyValidator` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on every adapter method that accepts a file key. When an enhanced method is invoked, the plugin runs the key through the configured validator before forwarding the call. If the validator returns an error message, the plugin throws an `InvalidKeyFileError` and the adapter method is never invoked.

By default the plugin uses the built-in `defaultKeyValidator`, which rejects keys that contain `"../"`, a newline (`\n`), or a tab (`\t`), as well as keys that are empty or consist only of whitespace. A custom validator can be supplied as the first argument.

The plugin validates keys for the following methods:

| Method                 | Key argument           |
| ---------------------- | ---------------------- |
| `getPublicUrl`         | Single key             |
| `getSignedDownloadUrl` | Single key             |
| `getSignedUploadUrl`   | Single key             |
| `exists`               | Single key             |
| `getStream`            | Single key             |
| `getBytes`             | Single key             |
| `getMetaData`          | Single key             |
| `add`                  | Single key             |
| `addStream`            | Single key             |
| `update`               | Single key             |
| `updateStream`         | Single key             |
| `put`                  | Single key             |
| `putStream`            | Single key             |
| `copy`                 | Source and destination |
| `copyAndReplace`       | Source and destination |
| `move`                 | Source and destination |
| `moveAndReplace`       | Source and destination |
| `removeMany`           | Multiple keys          |
| `removeByPrefix`       | Single key (prefix)    |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageKeyValidator } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the key validator plugin to the adapter
const validatedAdapter = withPlugin(adapter, withFileStorageKeyValidator());
```

#### Custom validator

```ts
const validatedAdapter = withPlugin(
    adapter,
    withFileStorageKeyValidator((key) => {
        if (key.startsWith("temp/")) {
            return "Keys under temp/ are not allowed";
        }
        return null;
    }),
);
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withFileStorageLowerCase plugin

The FileStorage lowercase plugin intercepts calls to a file-storage adapter and lowercases every file key before it reaches the underlying adapter. This enforces a consistent, case-insensitive key format without modifying the adapter implementation.

### Use cases

- **Normalized keys** — Store and retrieve files with a consistent lowercase key format
- **Case-insensitive lookups** — Avoid duplicate files that differ only by case
- **Cross-system consistency** — Match keys to systems that are case-sensitive or case-insensitive differently

### How it works

The `withFileStorageLowerCase` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on every adapter method that accepts a file key. When an enhanced method is invoked, the plugin lowercases the key argument(s) and forwards the modified arguments to the original method.

The plugin lowercases keys for the following methods:

| Method                 | Key argument           | Pattern              |
| ---------------------- | ---------------------- | -------------------- |
| `getPublicUrl`         | Single key             | `key.toLowerCase()`  |
| `getSignedDownloadUrl` | Single key             | `key.toLowerCase()`  |
| `getSignedUploadUrl`   | Single key             | `key.toLowerCase()`  |
| `exists`               | Single key             | `key.toLowerCase()`  |
| `getStream`            | Single key             | `key.toLowerCase()`  |
| `getBytes`             | Single key             | `key.toLowerCase()`  |
| `getMetaData`          | Single key             | `key.toLowerCase()`  |
| `add`                  | Single key             | `key.toLowerCase()`  |
| `addStream`            | Single key             | `key.toLowerCase()`  |
| `update`               | Single key             | `key.toLowerCase()`  |
| `updateStream`         | Single key             | `key.toLowerCase()`  |
| `put`                  | Single key             | `key.toLowerCase()`  |
| `putStream`            | Single key             | `key.toLowerCase()`  |
| `copy`                 | Source and destination | both keys lowercased |
| `copyAndReplace`       | Source and destination | both keys lowercased |
| `move`                 | Source and destination | both keys lowercased |
| `moveAndReplace`       | Source and destination | both keys lowercased |
| `removeMany`           | Multiple keys          | each key lowercased  |
| `removeByPrefix`       | Single key (prefix)    | `key.toLowerCase()`  |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLowerCase } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the lowercase plugin to the adapter
const loweredAdapter = withPlugin(adapter, withFileStorageLowerCase());
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withFileStorageInferContentTypeOnWrite plugin

The FileStorage write content-type plugin infers the content type from the file key extension when writing files or generating signed URLs. It uses the `mime-types` lookup to resolve a content type from the key extension, ensuring the stored or served content type matches the file extension.

### Use cases

- **Correct content types** — Automatically set the content type from the file key extension
- **Signed URL accuracy** — Ensure signed download/upload URLs advertise the correct content type
- **Consistent metadata** — Keep content types aligned with file extensions across writes

### How it works

The `withFileStorageInferContentTypeOnWrite` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on the write and signed URL methods. When an enhanced method is invoked, the plugin resolves the `contentType` from the file key extension (via MIME lookup) and overrides the provided content type when a match is found. When the extension is unknown, the content type falls back to `application/octet-stream`, the most generic MIME type. Content type inference can be disabled per signed URL method through the plugin settings.

The plugin infers the content type for the following methods:

| Method                 | Behaviour                                     |
| ---------------------- | --------------------------------------------- |
| `getSignedDownloadUrl` | Infers unless `inferSignedDownloadUrl: false` |
| `getSignedUploadUrl`   | Infers unless `inferSignedUploadUrl: false`   |
| `add`                  | Infers always                                 |
| `addStream`            | Infers always                                 |
| `update`               | Infers always                                 |
| `updateStream`         | Infers always                                 |
| `put`                  | Infers always                                 |
| `putStream`            | Infers always                                 |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferContentTypeOnWrite } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the write content-type plugin to the adapter
const contentTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnWrite(),
);
```

#### Disabling inference for signed URLs

```ts
const contentTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnWrite({
        inferSignedDownloadUrl: false,
        inferSignedUploadUrl: false,
    }),
);
```

### Settings

| Option                   | Type      | Default | Description                                                |
| ------------------------ | --------- | ------- | ---------------------------------------------------------- |
| `inferSignedDownloadUrl` | `boolean` | `true`  | Whether to infer the content type for signed download URLs |
| `inferSignedUploadUrl`   | `boolean` | `true`  | Whether to infer the content type for signed upload URLs   |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withFileStorageInferContentTypeOnRead plugin

The FileStorage read content-type plugin infers the content type from the file key extension when reading file metadata. It is meant for adapters that cannot save the content type of a file and instead need it inferred, such as the [`FsFileStorageAdapter`](./configuring_file_storage_adapters.md). It enhances the `getMetaData` method so the returned metadata reports a content type that matches the file key extension.

### Use cases

- **Accurate metadata** — Report the correct content type for files based on their key extension
- **Backend compatibility** — Normalize content types for backends that store generic or missing types

### How it works

The `withFileStorageInferContentTypeOnRead` function returns a [`PluginFn`](/docs/components/middleware) that enhances the `getMetaData` method. When invoked, the plugin calls the underlying adapter to obtain the metadata, then resolves the `contentType` from the file key extension (via MIME lookup) only when the metadata's `contentType` is `null`; otherwise the existing content type is preserved. If the extension is unknown, the content type falls back to `application/octet-stream`, the most generic MIME type. If the file does not exist, `null` is passed through.

The plugin only affects the `getMetaData` method.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferContentTypeOnRead } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the read content-type plugin to the adapter
const metadataAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnRead(),
);
```

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withFileStorageInferFileTypeOnWrite plugin

The FileStorage write file-type plugin infers the content type from the actual file content when writing files. Unlike the extension-based content-type plugin, it detects the type from the bytes themselves using the `file-type` library, so files with misleading or missing extensions still get an accurate content type.

### Use cases

- **Content-based detection** — Detect the real content type from the file bytes
- **Misleading extensions** — Correct content types when the file extension does not match the actual content
- **Streaming writes** — Detect the type of streamed content while writing

### How it works

The `withFileStorageInferFileTypeOnWrite` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on all write methods. When an enhanced method is invoked, the plugin detects the type of the provided data (via `file-type`) and replaces the provided content type with the detected MIME type when a match is found. When the file type cannot be detected, the content type falls back to `application/octet-stream`, the most generic MIME type. For streams, the plugin returns a transformed stream with the detected file type.

The plugin infers the content type for the following methods:

| Method         | Behaviour          |
| -------------- | ------------------ |
| `add`          | Infers from buffer |
| `addStream`    | Infers from stream |
| `update`       | Infers from buffer |
| `updateStream` | Infers from stream |
| `put`          | Infers from buffer |
| `putStream`    | Infers from stream |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferFileTypeOnWrite } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the write file-type plugin to the adapter
const fileTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferFileTypeOnWrite(),
);
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withFileStorageInferFileTypeOnRead plugin

The FileStorage read file-type plugin infers the content type from the actual file content when reading file metadata. It is meant for adapters that cannot save the content type of a file and instead need it inferred, such as the [`FsFileStorageAdapter`](./configuring_file_storage_adapters.md). It enhances the `getMetaData` method so the returned metadata reports a content type detected from the file bytes via the `file-type` library.

### Use cases

- **Content-based metadata** — Report the real content type detected from the file bytes
- **Misleading extensions** — Correct content types when the stored file does not match its key extension

### How it works

The `withFileStorageInferFileTypeOnRead` function returns a [`PluginFn`](/docs/components/middleware) that enhances the `getMetaData` method. When invoked, the plugin calls the underlying adapter to obtain the metadata. When the metadata's `contentType` is `null`, the plugin reads the file stream and detects its type via `file-type`. When a type is detected, the metadata content type is overridden; otherwise the content type falls back to `application/octet-stream`, the most generic MIME type. When the metadata already carries a content type, the plugin returns it as-is without any extra read. If the file does not exist, `null` is passed through.

Because the type is detected from the actual content, `getMetaData` additionally opens and reads a leading sample of the object (via `getStream`) whenever inference is required. This extra read is additional I/O on every `getMetaData` call that needs inference. If you only need the content type for files whose keys carry a well-known extension, prefer the extension-based [`withFileStorageInferContentTypeOnRead`](#withfilestorageinfercontenttypeonread-plugin) plugin, which inspects only the file key and performs no extra read.

The plugin only affects the `getMetaData` method.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferFileTypeOnRead } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the read file-type plugin to the adapter
const fileTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferFileTypeOnRead(),
);
```

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
