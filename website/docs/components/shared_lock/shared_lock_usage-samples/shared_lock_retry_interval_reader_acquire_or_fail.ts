import { retryInterval } from "eridu-tech/resilience";
import { LimitReachedReaderSemaphoreError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

try {
    await use(async () => {
        await sharedLock.acquireReaderOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the shared-lock
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: LimitReachedReaderSemaphoreError,
        }),
    ])();
    // ... critical section
} finally {
    await sharedLock.releaseReader();
}
