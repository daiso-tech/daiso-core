import { SlidingWindowLimiter } from "eridu-tech/rate-limiter/policies"
import { TimeSpan } from "eridu-tech/time-span"

new SlidingWindowLimiter({
    /**
     * The time span in which attempts are active before reseting.
     * The field is optional.
     *
     */
    window: TimeSpan.fromSeconds(1)

    /**
     * The field is optional.
     * ```
     */
    margin: TimeSpan.fromSeconds(4).divide(4)
})
