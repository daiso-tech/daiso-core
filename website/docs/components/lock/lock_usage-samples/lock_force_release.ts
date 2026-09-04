const lock = lockFactory.create("resource");

await lock.forceRelease();
