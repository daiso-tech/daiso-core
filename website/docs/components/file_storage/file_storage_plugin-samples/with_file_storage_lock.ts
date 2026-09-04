import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLock } from "eridu-tech/file-storage/plugins";
import { MemoryLockFactory } from "eridu-tech/lock/memory-lock-factory";

const adapter = new MemoryFileStorageAdapter();
const lockFactory = new MemoryLockFactory();

// Apply the lock plugin to the adapter
const lockedAdapter = withPlugin(adapter, withFileStorageLock({ lockFactory }));
