import { delay } from "eridu-tech/utilities/functions";

const lock = lockFactory.create("resource", {
    ttl: TimeSpan.fromMinutes(1),
});

async function doWork(): Promise<boolean> {
    // ... critical section
}

const hasAcquired = await lock.acquire();
if (hasAcquired) {
    try {
        while (true) {
            await lock.refresh(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await lock.release();
    }
}
