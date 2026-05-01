---
sidebar_position: 4
sidebar_label: Configuring policies
pagination_label: Configuring rate-limiter policies
---

# Configuring rate-limiter policies

## SlidingWindowLimiter

<!-- The `SlidingWindowLimiter` breaks after n requests in a row fail. -->

````ts
import { SlidingWindowLimiter } from "@daiso-tech/core/rate-limiter/policies"
import { TimeSpan } from "@daiso-tech/core/time-span"

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
````

## FixedWindowLimiter

<!-- The `FixedWindowLimiter` breaks after a proportion of requests in a count based sliding window fail. -->

```ts
import { FixedWindowLimiter } from "@daiso-tech/core/rate-limiter/policies";
import { TimeSpan } from "@daiso-tech/core/time-span";

new FixedWindowLimiter({
    /**
     * The time span in which attempts are active before reseting.
     * The field is optional.
     */
    window: TimeSpan.fromSeconds(1),
});
```

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.
