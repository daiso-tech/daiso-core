import { retryInterval } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const hasAcquired = await use(async () => {
    return await sharedLock.acquireReader();
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
])();

if (hasAcquired) {
    try {
        // ... critical section
    } finally {
        await sharedLock.releaseReader();
    }
}
