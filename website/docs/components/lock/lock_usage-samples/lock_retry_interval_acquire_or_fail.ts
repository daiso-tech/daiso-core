import { retryInterval } from "eridu-tech/resilience";
import { FailedAcquireLockError } from "eridu-tech/lock/contracts";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const lock = lockFactory.create("resource");

try {
    await use(async () => {
        await lock.acquireOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the lock
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: FailedAcquireLockError,
        }),
    ])();
    // ... critical section
} finally {
    await lock.release();
}
