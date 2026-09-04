import { FixedWindowLimiter } from "eridu-tech/rate-limiter/policies";
import { TimeSpan } from "eridu-tech/time-span";

new FixedWindowLimiter({
    /**
     * The time span in which attempts are active before reseting.
     * The field is optional.
     */
    window: TimeSpan.fromSeconds(1),
});
