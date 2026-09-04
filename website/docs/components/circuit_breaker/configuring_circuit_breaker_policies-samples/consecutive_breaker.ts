import { ConsecutiveBreaker } from "eridu-tech/circuit-breaker/policies";

new ConsecutiveBreaker({
    /**
     * Amount of consecutive failures before going from closed -> open.
     * The field is optional.
     */
    failureThreshold: 5,

    /**
     * Amount of consecutive success before going from half-open -> closed.
     * The field is optional.
     */
    successThreshold: 5,
});
