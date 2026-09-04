import { withRateLimiterFactory } from "eridu-tech/rate-limiter/middlewares";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";

const rateLimiterFactory = new RateLimiterFactory({
    adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter(),
    }),
});
const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

const fetchHandler = async (request: Request): Promise<Response> => {
    // ...
};

// Wrap with rate limiter — max 10 calls per window
const rateLimitedCall = use(
    fetchHandler,
    withRateLimiter({
        key: (req) => `api:${String(req.headers.get("x-ip"))}`,
        limit: 10,
    }),
);

await rateLimitedCall(
    new Request("/url", {
        method: "POST",
    }),
);
