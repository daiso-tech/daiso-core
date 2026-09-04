import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { LockFactory } from "eridu-tech/lock";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const lockFactory = new LockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisLockAdapter(redisClient),
});

const lock = lockFactory.create("resource");
const serializedLock = serde.serialize(lock);
const deserializedLock = serde.deserialize(lock);
