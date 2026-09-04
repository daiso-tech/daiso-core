import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const map = new Map<any, any>();
const memoryRateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter(
    map,
);
