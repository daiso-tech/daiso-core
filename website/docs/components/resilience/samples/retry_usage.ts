import { retry } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = use(unstableFn, [
    retry({
        // Will retry 4 times
        maxAttempts: 4,
    }),
]);

await fn();
