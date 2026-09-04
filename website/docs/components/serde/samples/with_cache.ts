import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { Cache } from "eridu-tech/cache";
import { ListCollection } from "eridu-tech/collection";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
serde.registerClass(ListCollection);

const cache = new Cache({
    adapter: new RedisCacheAdapter({
        database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
        serde,
    }),
});

const listCollection = new ListCollection(["a", "b", "c", "d", "e"]);

await cache.add("list", listCollection);

const deserializedListCollection = await cache.get("list");
if (deserializedListCollection) {
    // Logs "c"
    console.log(deserializedListCollection.getOrFail(2));
}
