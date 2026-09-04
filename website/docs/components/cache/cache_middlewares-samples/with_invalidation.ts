import { withInvalidationFactory } from "eridu-tech/cache/middlewares";
import { Cache } from "eridu-tech/cache";
import { use } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
const withInvalidation = withInvalidationFactory(cache);

const updateUser = async (userId: string, name: string): Promise<void> => {
    await fetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
    });
};

// Wrap with invalidation
const invalidatingUpdateUser = use(
    updateUser,
    withInvalidation({
        key: (userId) => `user:${userId}`,
    }),
);

await invalidatingUpdateUser("123", "John");
// The "user:123" cache entry is removed after updateUser runs
