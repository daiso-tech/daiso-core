import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";
import { z } from "zod";

const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
});

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    schema: userSchema,
});

await cache.add("user1", {
    name: "John",
    email: "john@example.com",
    age: 30,
});

// Throws a ValidationError because the email is not valid
await cache.add("user2", {
    name: "Jane",
    email: "not-an-email",
    age: 25,
});
