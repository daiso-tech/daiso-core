import { LockFactoryResolver } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import Redis from "ioredis";

const lockFactoryResolver = new LockFactoryResolver({
    adapters: {
        memory: new MemoryLockAdapter(),
        redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
