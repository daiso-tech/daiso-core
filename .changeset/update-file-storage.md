---
"@daiso-tech/core": minor
---

Updated the `IFileStorage` contract — removed node js read methods and extracted built-in locking into a standalone plugin.

### Changes

- **Removed** `IFile.getBuffer` — use `IFile.getBytes` instead (returns `Uint8Array | null`).
- **Removed** `IFile.getBufferOrFail` — use `IFile.getBytesOrFail` instead (returns `Uint8Array` or throws).
- **Removed** `IFile.getReadable` — use `IFile.getStream` instead (returns a readable stream).
- **Removed** `IFile.getReadableOrFail` — use `IFile.getStreamOrFail` instead (returns a readable stream or throws).
- **Removed** built-in locking from the `FileStorage` class — locking is now provided by the standalone `withFileStorageLock` plugin.

Now the `FileStorage` class will work in none `Node.js` environment like `cloudflare` workers without `Node.js` compatibility.

### Migration

- Replace all calls to `fileStorage.getBuffer(key)` with `fileStorage.getBytes(key)`.
- Replace all calls to `fileStorage.getBufferOrFail(key)` with `fileStorage.getBytesOrFail(key)`.
- Replace all calls to `fileStorage.getReadable(key)` with `fileStorage.getStream(key)`.
- Replace all calls to `fileStorage.getReadableOrFail(key)` with `fileStorage.getStreamOrFail(key)`.
- If you relied on the built-in locking in `FileStorage`, apply the `withFileStorageLock` plugin to your file storage adapter instead:

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
