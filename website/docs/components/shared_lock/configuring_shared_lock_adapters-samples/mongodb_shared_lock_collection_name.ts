const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // By default "shared-lock" is used as collection name
    collectionName: "my-shared-lock",
});

await mongodbSharedLockAdapter.init();
