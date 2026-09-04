const lock = lockFactory.create("resource");

await lock.runOrFail(async () => {
    // ... critical section
});
