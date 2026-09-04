import { TimeSpan } from "eridu-tech/time-span";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";

const rateLimiterFactory = new RateLimiterFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter(),
    }),
});
