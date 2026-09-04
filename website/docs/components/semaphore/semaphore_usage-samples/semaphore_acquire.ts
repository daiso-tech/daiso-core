// 1 slot will be acquired
if (await semaphore.acquire()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await semaphore.release();
    }
} else {
    console.log("Unable to acquire");
}

// 2 slots will be acquired
if (await semaphore.acquire()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await semaphore.release();
    }
} else {
    console.log("Unable to acquire");
}

// Will log false because the limit is reached
console.log(await semaphore.acquire());
