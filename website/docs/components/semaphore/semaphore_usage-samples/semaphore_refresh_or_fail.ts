const semaphore = semaphoreFactory.create("resource");

await semaphore.refreshOrFail();
