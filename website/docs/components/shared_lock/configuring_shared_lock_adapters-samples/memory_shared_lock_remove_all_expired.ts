import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

const memorySharedLockAdapter = new MemorySharedLockAdapter();

// Remove all expired shared-lock keys manually.
await memorySharedLockAdapter.removeAllExpired();
