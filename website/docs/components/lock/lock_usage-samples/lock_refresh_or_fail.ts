const lock = lockFactory.create("resource");

await lock.refreshOrFail();
