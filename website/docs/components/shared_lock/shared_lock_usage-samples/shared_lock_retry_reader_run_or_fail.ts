import { retry } from "eridu-tech/resilience";
import { LimitReachedReaderSemaphoreError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

await use(async () => {
    await sharedLock.runReaderOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: LimitReachedReaderSemaphoreError,
    }),
])();
