import { retry } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

const lock = lockFactory.create("lock");

const hasAquired = await use(async () => {
    return await lock.acquire();
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
        await lock.release();
    }
}
