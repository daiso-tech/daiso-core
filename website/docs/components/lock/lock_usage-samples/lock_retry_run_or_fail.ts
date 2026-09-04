import { retry } from "eridu-tech/resilience";
import { FailedAcquireLockError } from "eridu-tech/lock/contracts";
import { use } from "eridu-tech/middleware";

const lock = lockFactory.create("lock");

await use(async () => {
    await lock.runOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: FailedAcquireLockError,
    }),
])();
