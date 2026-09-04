import { retry } from "eridu-tech/resilience";
import { FailedAcquireSemaphoreError } from "eridu-tech/semaphore/contracts";
import { use } from "eridu-tech/middleware";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2,
});

try {
    await use(async () => {
        await semaphore.acquireOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireSemaphoreError,
        }),
    ])();
    // The critical section
} finally {
    await semaphore.release();
}
