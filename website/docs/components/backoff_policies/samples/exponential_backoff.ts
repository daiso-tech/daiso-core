import { TimeSpan } from "eridu-tech/time-span";
import { exponentialBackoff } from "eridu-tech/backoff-policies";

// The settings argument is optional and all its fields are optional
const backoff = exponentialBackoff({
    maxDelay: TimeSpan.fromSeconds(60),
    minDelay: TimeSpan.fromMilliseconds(500),
    multiplier: 2,
    jitter: 0.5, // You can pass null to disable jitter
});
