const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});

// Will return the key of the semaphore which is "resource"
console.log(semaphore.key.toString());

// Will return the id of the semaphore
console.log(semaphore.id);

// Will return the ttl of the semaphore
console.log(semaphore.ttl);
