import type { ICache, IReadableCache } from "eridu-tech/cache/contracts";
import { Cache } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";

async function readingFunc(cache: IReadableCache): Promise<void> {
    // You cannot access write methods like put, add and update
    // You will get typescript error if you try

    console.log("reading only:", await cache.get("a"));
}
async function manipulatingFunc(cache: ICache): Promise<void> {
    // You will get typescript error if you try

    await cache.add("a", 1);
    console.log("writing and reading:", await cache.get("a"));
}

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
await manipulatingFunc(cache);
await readingFunc(cache);
