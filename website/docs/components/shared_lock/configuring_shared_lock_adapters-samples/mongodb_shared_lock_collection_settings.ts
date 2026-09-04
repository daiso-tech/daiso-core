const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSharedLockAdapter.init();
