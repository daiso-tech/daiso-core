import { retry } from "eridu-tech/resilience";
import { LimitReachedReaderSemaphoreError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

try {
    await use(async () => {
        await sharedLock.acquireReaderOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: LimitReachedReaderSemaphoreError,
        }),
    ])();
    // The critical section
} finally {
    await sharedLock.release();
}
