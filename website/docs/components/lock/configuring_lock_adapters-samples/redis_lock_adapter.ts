import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisLockAdapter = new RedisLockAdapter(database);
