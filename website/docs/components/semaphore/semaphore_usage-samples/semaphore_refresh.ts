import { delay } from "eridu-tech/utilities";

const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
    ttl: TimeSpan.fromMinutes(1),
});

async function doWork(): Promise<boolean> {
    // ... critical section
}

const hasAcquired = await semaphore.acquire();
if (hasAcquired) {
    try {
        while (true) {
            await semaphore.refresh(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await semaphore.release();
    }
}
