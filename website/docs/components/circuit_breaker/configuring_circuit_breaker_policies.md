---
sidebar_position: 4
sidebar_label: Configuring policies
pagination_label: Configuring circuit-breaker policies
---

# Configuring circuit-breaker policies

## ConsecutiveBreaker

The `ConsecutiveBreaker` breaks after n requests in a row fail.

```ts
import { ConsecutiveBreaker } from "@daiso-tech/core/circuit-breaker/policies"

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
    successThreshold: 5
})
```

## CountBreaker

The `CountBreaker` breaks after a proportion of requests in a count based sliding window fail.

```ts
import { CountBreaker } from "@daiso-tech/core/circuit-breaker/policies"

new CountBreaker({
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
     * Size of the count based sliding window.
     * The field is optional.
     */
    size: 20,

    /**
     * The minimum number of calls to go from closed -> open, half-opened -> closed or half-opened -> open.
     * The field is optional.
     */
    minimumNumberOfCalls: 20;
})
```

## SamplingBreaker

The `SamplingBreaker` breaks after a proportion of requests over a time period fail.

```ts
import { SamplingBreaker } from "@daiso-tech/core/circuit-breaker/policies"
import { TimeSpan } from "@daiso-tech/core/time-span"

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
    minimumRps: 5
})
```

## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.