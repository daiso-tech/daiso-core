const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // By default "semaphore" is used as collection name
    collectionName: "my-semaphore",
});

await mongodbSemaphoreAdapter.init();
