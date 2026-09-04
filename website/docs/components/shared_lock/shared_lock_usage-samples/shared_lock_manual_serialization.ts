import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const sharedLockFactory = new SharedLockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisSharedLockAdapter(redisClient),
});

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});
const serializedSharedLock = serde.serialize(sharedLock);
const deserializedSharedLock = serde.deserialize(sharedLock);
