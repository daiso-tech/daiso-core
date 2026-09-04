import { retryInterval } from "eridu-tech/resilience";
import { LimitReachedReaderSemaphoreError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await use(async () => {
    await sharedLock.runReaderOrFail(async () => {
        // ... critical section
    });
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: LimitReachedReaderSemaphoreError,
    }),
])();
