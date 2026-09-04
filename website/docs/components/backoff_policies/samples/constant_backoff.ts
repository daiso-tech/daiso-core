import { TimeSpan } from "eridu-tech/time-span";
import { constantBackoff } from "eridu-tech/backoff-policies";

// The settings argument is optional and all its fields are optional
const backoff = constantBackoff({
    delay: TimeSpan.fromSeconds(1),
    jitter: 0.5, // You can pass null to disable jitter
});
