import { retryInterval } from "eridu-tech/resilience";
import { FailedAcquireLockError } from "eridu-tech/lock/contracts";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

const lock = lockFactory.create("resource");

await use(async () => {
    await lock.runOrFail(async () => {
        // ... critical section
    });
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: FailedAcquireLockError,
    }),
])();
