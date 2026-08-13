---
"eridu-tech": minor
---

# Architectural Shift: Composable FileStorage Plugins

The file-storage module has undergone a significant architectural refactoring. Cross-cutting behaviours that were previously hard-coded into `FileStorage`, `FileStorageResolver`, and even `FsFileStorageAdapter` (key validation, lowercase normalisation, and content-type inference) have been extracted into standalone, composable plugins built on the middleware plugin system (`PluginFn`/`withPlugin`). The core `FileStorage` class is now a thin passthrough, while optional capabilities are layered on via plugins.

## Motivation

The previous architecture baked key validation, lowercase normalisation, and content-type inference directly into the core classes and the filesystem adapter. This made these behaviours difficult to opt out of, mix, reorder, or reuse across different adapters, and forced every consumer to pay the cost of behaviour they might not need.

The new plugin-based architecture keeps the core classes focused on a single responsibility — delegating to an `IFileStorageAdapter` — and provides each cross-cutting behaviour as an independent `PluginFn<IFileStorageAdapter>` that can be composed via `withPlugin(adapter, ...plugins)`.

### Breaking Changes

**Removed from `FileStorage` / `FileStorageSettingsBase`:**

- The `defaultContentType` setting — content-type inference is now handled by the `withFileStorageInferContentTypeOnWrite` / `withFileStorageInferContentTypeOnRead` plugins. `application/octet-stream` is used as the default content type on write and read unless you use a plugin that can infer the content type.
- The `onlyLowercase` setting — key lowercasing is now handled by the `withFileStorageLowerCase` plugin.
- The `keyValidator` setting — key validation is now handled by the `withFileStorageKeyValidator` plugin.

**Removed from `FileStorageResolver`:**

- `setDefaultContentType(contentType)` — use the content-type inference plugins instead.
- `setOnlyLowercase(onlyLowercase)` — use the `withFileStorageLowerCase` plugin instead.
- `setKeyValidator(keyValidator)` — use the `withFileStorageKeyValidator` plugin instead.

**Moved exports:**

- `defaultKeyValidator` and `FileKeyValidator` are no longer exported from `eridu-tech/file-storage`. They now live in the plugins module alongside `withFileStorageKeyValidator`.

**Changed contracts:**

- `FileAdapterMetadata.contentType` is now `string | null`. A `null` value indicates the storage backend does not store or expose a content type for the file; reading such metadata through `FileStorage` falls back to `application/octet-stream` unless a content-type inference plugin is applied.

**Changed adapter behaviour:**

- `FsFileStorageAdapter.getMetaData` no longer infers the content type from the file key extension and now reports `null` for the content type. Apply the `withFileStorageInferContentTypeOnRead` or `withFileStorageInferFileTypeOnRead` plugins to restore content-type inference.

### New Plugins

The plugins below are applied to a file-storage adapter with `withPlugin(adapter, ...plugins)`.

**`withFileStorageKeyValidator`** — Validates every file key before it reaches a file-storage adapter. When a key fails validation, an `InvalidKeyFileError` is thrown and the underlying adapter method is never invoked.

- Uses the built-in `defaultKeyValidator` by default, which rejects keys containing `../`, newlines (`\n`), tabs (`\t`), and keys that are empty or whitespace-only.
- A custom validator can be supplied as the first argument.

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageKeyValidator } from "eridu-tech/file-storage/plugins";

const adapter = withPlugin(
    new MemoryFileStorageAdapter(),
    withFileStorageKeyValidator(),
);
```

**`withFileStorageLowerCase`** — Lowercases every file key before it reaches the underlying adapter, enforcing a consistent, case-insensitive key format.

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLowerCase } from "eridu-tech/file-storage/plugins";

const adapter = withPlugin(
    new MemoryFileStorageAdapter(),
    withFileStorageLowerCase(),
);
```

**`withFileStorageInferContentTypeOnRead`** — Infers the content type from the file key extension when reading file metadata (`getMetaData`). Meant for adapters that cannot save the content type of a file and instead need it inferred, such as `FsFileStorageAdapter`.

**`withFileStorageInferContentTypeOnWrite`** — Infers the content type from the file key extension when writing files or generating signed URLs. Inference for signed URLs can be toggled via the `inferSignedDownloadUrl` and `inferSignedUploadUrl` settings (both default to `true`).

**`withFileStorageInferFileTypeOnRead`** — Infers the content type from the actual file bytes (via the `file-type` library) when reading file metadata.

**`withFileStorageInferFileTypeOnWrite`** — Infers the content type from the actual file bytes (via the `file-type` library) when writing files, so files with misleading or missing extensions still get an accurate content type.

### Migration

**Before (built-in behaviour):**

```ts
const fileStorage = new FileStorage({
    adapter: new MemoryFileStorageAdapter(),
    defaultContentType: "application/octet-stream",
    onlyLowercase: true,
    keyValidator: myValidator,
});
```

**After (explicit plugin composition):**

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import {
    withFileStorageKeyValidator,
    withFileStorageLowerCase,
} from "eridu-tech/file-storage/plugins";

const adapter = withPlugin(
    new MemoryFileStorageAdapter(),
    withFileStorageKeyValidator(myValidator),
    withFileStorageLowerCase(),
);
const fileStorage = new FileStorage({ adapter });
```

### New Dependency

- Added `file-type` for content-based file type detection, used by the file-type inference plugins.
