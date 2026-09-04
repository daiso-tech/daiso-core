import { retryInterval } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = use(unstableFn, [
    retryInterval({
        // Retry for up to 10 seconds
        time: TimeSpan.fromSeconds(10),
        // Wait 500ms between each attempt
        interval: TimeSpan.fromMilliseconds(500),
    }),
]);

await fn();
