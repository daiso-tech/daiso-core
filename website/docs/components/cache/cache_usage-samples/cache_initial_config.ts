import { TimeSpan } from "eridu-tech/time-span";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";

const cache = new Cache({
    // You can provide default TTL value
    // If you set it to null it means keys will be stored forever.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemoryCacheAdapter(),
});
