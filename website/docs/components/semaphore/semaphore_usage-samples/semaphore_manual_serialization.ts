import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { SemaphoreFactory } from "eridu-tech/semaphore";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const semaphoreFactory = new SemaphoreFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisSemaphoreAdapter(redisClient),
});

const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});
const serializedSemaphore = serde.serialize(semaphore);
const deserializedSemaphore = serde.deserialize(semaphore);
