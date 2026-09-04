import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import Redis from "ioredis";

const sharedLockFactoryResolver = new SharedLockFactoryResolver({
    adapters: {
        memory: new MemorySharedLockAdapter(),
        redis: new RedisSharedLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
