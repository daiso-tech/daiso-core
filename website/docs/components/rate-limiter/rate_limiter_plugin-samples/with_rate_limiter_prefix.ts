import { withPlugin } from "eridu-tech/middleware";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { withRateLimiterPrefix } from "eridu-tech/rate-limiter/plugins";

const adapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withRateLimiterPrefix("tenant-42:"),
);
