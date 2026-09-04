const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSemaphoreAdapter.init();
