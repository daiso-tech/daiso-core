import { MongodbRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbRateLimiterStorageAdapter = new MongodbRateLimiterStorageAdapter({
    client,
    database,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbRateLimiterStorageAdapter.init();
