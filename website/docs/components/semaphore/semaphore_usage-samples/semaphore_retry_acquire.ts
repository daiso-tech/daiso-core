import { retry } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2,
});

const hasAquired = await use(async () => {
    return await semaphore.acquire();
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
        await semaphore.release();
    }
}
