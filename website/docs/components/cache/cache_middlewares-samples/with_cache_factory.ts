import { withCacheFactory } from "eridu-tech/cache/middlewares";
import { Cache } from "eridu-tech/cache";
import { use } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { TimeSpan } from "eridu-tech/time-span";

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
const withCache = withCacheFactory(cache);

const fetchUser = async (userId: string): Promise<{ name: string }> => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
};

// Wrap with caching
const cachedFetchUser = use(
    fetchUser,
    withCache({
        key: (userId) => `user:${userId}`,
        ttl: TimeSpan.fromMinutes(10), // Cache for 10 minutes
    }),
);

const user = await cachedFetchUser("123"); // Cache miss — fetches and caches
const userAgain = await cachedFetchUser("123"); // Cache hit — returns immediately
