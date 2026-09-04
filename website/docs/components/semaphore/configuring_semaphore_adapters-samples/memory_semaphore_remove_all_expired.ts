import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

const memorySemaphoreAdapter = new MemorySemaphoreAdapter();

// Remove all expired semaphore keys manually.
await memorySemaphoreAdapter.removeAllExpired();
