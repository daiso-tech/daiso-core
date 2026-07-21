import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { withCacheFactory } from "@/cache/implementations/middlewares/with-cache-factory.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("function: withCacheFactory", () => {
    let cache: Cache<string>;

    beforeEach(() => {
        cache = new Cache<string>({
            adapter: new NoOpCacheAdapter(),
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    test("asd", async () => {
        const spy = vi.spyOn(cache, "getOrAdd");

        const withCache = withCacheFactory(cache);

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const ttl = TimeSpan.fromSeconds(20);
        await use(
            fn,
            withCache({
                ttl,
                key: (value) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(key, expect.any(Function), ttl);
    });
});
