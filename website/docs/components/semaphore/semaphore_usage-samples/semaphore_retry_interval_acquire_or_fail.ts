import { retryInterval } from "eridu-tech/resilience";
import { FailedAcquireSemaphoreError } from "eridu-tech/semaphore/contracts";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});

try {
    await use(async () => {
        await semaphore.acquireOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the semaphore
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: FailedAcquireSemaphoreError,
        }),
    ])();
    // ... critical section
} finally {
    await semaphore.release();
}
