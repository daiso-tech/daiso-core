import { SamplingBreaker } from "eridu-tech/circuit-breaker/policies";
import { TimeSpan } from "eridu-tech/time-span";

new SamplingBreaker({
    /**
     * Percentage (from 0 to 1) failures before going from closed -> open.
     * The field is optional.
     */
    failureThreshold: 0.2,

    /**
     * Percentage (from 0 to 1) successes before going from half-open -> closed.
     * The field is optional.
     */
    successThreshold: 0.8,

    /**
     * Length of time over which to sample.
     * The field is optional.
     */
    timeSpan: TimeSpan.fromMinutes(1),

    /**
     * The sample length time.
     * The field is optional.
     */
    sampleTimeSpan: TimeSpan.fromMinutes(1).divide(6),

    /**
     * The minimum number of calls per seconds to go from closed -> open, half-opened -> closed or half-opened -> open.
     * The field is optional.
     */
    minimumRps: 5,
});
