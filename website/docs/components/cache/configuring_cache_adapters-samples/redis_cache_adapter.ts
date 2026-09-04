import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const serde = new Serde(new SuperJsonSerdeAdapter());
const redisCacheAdapter = new RedisCacheAdapter({
    database,
    serde,
});
