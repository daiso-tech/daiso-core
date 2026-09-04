import { TimeSpan } from "eridu-tech/time-span";
import { linearBackoff } from "eridu-tech/backoff-policies";

// The settings argument is optional and all its fields are optional
const backoff = linearBackoff({
    maxDelay: TimeSpan.fromSeconds(60),
    minDelay: TimeSpan.fromMilliseconds(500),
    jitter: 0.5, // You can pass null to disable jitter
});
