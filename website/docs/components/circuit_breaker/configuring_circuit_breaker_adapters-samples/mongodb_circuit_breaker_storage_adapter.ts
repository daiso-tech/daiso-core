import { MongodbCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbCircuitBreakerStorageAdapter =
    new MongodbCircuitBreakerStorageAdapter({
        client,
        database,
        serde,
    });

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbCircuitBreakerStorageAdapter.init();
