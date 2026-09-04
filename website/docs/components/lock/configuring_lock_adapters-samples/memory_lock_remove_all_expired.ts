import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

const memoryLockAdapter = new MemoryLockAdapter();

// Remove all expired lock keys manually.
await memoryLockAdapter.removeAllExpired();
