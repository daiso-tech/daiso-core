const lock = lockFactory.create("resource");

// Will return the key of the lock which is "resource"
console.log(lock.key);

// Will return the id of the lock
console.log(lock.id);

// Will return the ttl of the lock
console.log(lock.ttl);
