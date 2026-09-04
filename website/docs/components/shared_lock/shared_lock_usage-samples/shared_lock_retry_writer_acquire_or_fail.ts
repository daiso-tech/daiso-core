import { retry } from "eridu-tech/resilience";
import { FailedAcquireWriterLockError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

try {
    await use(async () => {
        await sharedLock.acquireWriterOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireWriterLockError,
        }),
    ])();
    // The critical section
} finally {
    await sharedLock.release();
}
