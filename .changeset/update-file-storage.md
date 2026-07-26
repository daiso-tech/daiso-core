---
"@daiso-tech/core": minor
---

## Cross-Platform File Storage and Extracted Locking

The `IFileStorage` contract has been updated to remove Node.js-specific read methods and extract built-in locking into a standalone plugin. The `FileStorage` class now works in non-Node.js environments such as Cloudflare Workers without requiring Node.js compatibility.

### Motivation

The previous `IFileStorage` contract included Node.js-specific methods (`getBuffer`, `getReadable`) that prevented the component from working in edge-runtime environments. Additionally, built-in locking coupled the `FileStorage` class to the lock infrastructure even for users who didn't need it. By extracting locking into a plugin and replacing Node-specific APIs with runtime-agnostic alternatives, the file-storage module is now portable across environments.

### Breaking Changes

**Removed methods from `IFile`:**

- `IFile.getBuffer` — use `IFile.getBytes` instead (returns `Uint8Array | null`).
- `IFile.getBufferOrFail` — use `IFile.getBytesOrFail` instead (returns `Uint8Array` or throws).
- `IFile.getReadable` — use `IFile.getStream` instead (returns a readable stream).
- `IFile.getReadableOrFail` — use `IFile.getStreamOrFail` instead (returns a readable stream or throws).

**Removed behaviour:**

- Built-in locking from the `FileStorage` class — locking is now provided by the standalone `withFileStorageLock` plugin.

### New Plugin-Based Capabilities

**`withFileStorageLock`** — Adds distributed locking to file storage operations.

- Import path: `@daiso-tech/core/file-storage/plugins`

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { withFileStorageLock } from "@daiso-tech/core/file-storage/plugins";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { MemoryLockFactory } from "@daiso-tech/core/lock/memory-lock-factory";

const adapter = withPlugin(
    new MemoryFileStorageAdapter(),
    withFileStorageLock({ lockFactory: new MemoryLockFactory() }),
);
```

### Migration

- Replace all calls to `getBuffer(key)` with `getBytes(key)`.
- Replace all calls to `getBufferOrFail(key)` with `getBytesOrFail(key)`.
- Replace all calls to `getReadable(key)` with `getStream(key)`.
- Replace all calls to `getReadableOrFail(key)` with `getStreamOrFail(key)`.
- If you relied on the built-in locking, apply the `withFileStorageLock` plugin to your file storage adapter as shown above.
