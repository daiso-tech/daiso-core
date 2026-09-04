import { retry } from "eridu-tech/resilience";
import { FailedAcquireLockError } from "eridu-tech/lock/contracts";
import { use } from "eridu-tech/middleware";

const lock = lockFactory.create("lock");

try {
    await use(async () => {
        await lock.acquireOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireLockError,
        }),
    ])();
    // The critical section
} finally {
    await lock.release();
}
