import { retry } from "eridu-tech/resilience";
import { FailedAcquireSemaphoreError } from "eridu-tech/semaphore/contracts";
import { use } from "eridu-tech/middleware";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2,
});

await use(async () => {
    await semaphore.runOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: FailedAcquireSemaphoreError,
    }),
])();
