import { retry } from "eridu-tech/resilience";
import { FailedAcquireWriterLockError } from "eridu-tech/shared-lock/contracts";
import { use } from "eridu-tech/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

await use(async () => {
    await sharedLock.runWriterOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: FailedAcquireWriterLockError,
    }),
])();
