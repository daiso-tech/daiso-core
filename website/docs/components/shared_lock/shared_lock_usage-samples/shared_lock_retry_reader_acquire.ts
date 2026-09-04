import { retry } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const hasAquired = await use(async () => {
    return await sharedLock.acquireReader();
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
])();

if (hasAquired) {
    try {
        // The critical section
    } finally {
        await sharedLock.release();
    }
}
