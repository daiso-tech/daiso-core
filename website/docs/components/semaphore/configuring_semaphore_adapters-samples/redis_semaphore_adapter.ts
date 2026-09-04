import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisSemaphoreAdapter = new RedisSemaphoreAdapter(database);
