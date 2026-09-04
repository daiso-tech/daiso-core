import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const memoryRateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();

// Remove all expired rate-limiter records manually.
await memoryRateLimiterStorageAdapter.removeAllExpired();
