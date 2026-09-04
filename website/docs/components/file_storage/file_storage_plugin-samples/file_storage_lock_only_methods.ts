const adapter = withPlugin(
    adapter,
    withFileStorageLock({
        lockFactory,
        onlyMethods: ["add", "update", "removeMany"],
    }),
);
