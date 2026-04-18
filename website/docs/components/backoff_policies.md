---
tags:
 - Utilities
keywords:
 - Utilities
---

# Backoff policies

The `@daiso-tech/core/backoff-policies` component

## Predefined backoff policies

The library includes predefined backoff policies:

- `constantBackoff` - Constant backoff policy with jitter

```ts
import { TimeSpan } from "@daiso-tech/core/time-span"
import { constantBackoff } from "@daiso-tech/core/backoff-policies"

// The settings argument is optional and all its fields are optional
const backoff = constantBackoff({
    delay: TimeSpan.fromSeconds(1),
    jitter: 0.5 // You can pass null to disable jitter
})
```

- `exponentialBackoff` - Exponential backoff policy with jitter

```ts
import { TimeSpan } from "@daiso-tech/core/time-span"
import { exponentialBackoff } from "@daiso-tech/core/backoff-policies"

// The settings argument is optional and all its fields are optional
const backoff = exponentialBackoff({
    maxDelay: TimeSpan.fromSeconds(60),
    minDelay: TimeSpan.fromMilliseconds(500),
    multiplier: 2,
    jitter: 0.5 // You can pass null to disable jitter
})
```

- `linearBackoff` - Linear backoff policy with jitter

```ts
import { TimeSpan } from "@daiso-tech/core/time-span"
import { linearBackoff } from "@daiso-tech/core/backoff-policies"

// The settings argument is optional and all its fields are optional
const backoff = linearBackoff({
    maxDelay: TimeSpan.fromSeconds(60),
    minDelay: TimeSpan.fromMilliseconds(500),
    jitter: 0.5 // You can pass null to disable jitter
})
```

- `polynomialBackoff` - Polynomial backoff policy with jitter

```ts
import { TimeSpan } from "@daiso-tech/core/time-span"
import { linearBackoff } from "@daiso-tech/core/backoff-policies"

// The settings argument is optional and all its fields are optional
const backoff = linearBackoff({
    maxDelay: TimeSpan.fromSeconds(60),
    minDelay: TimeSpan.fromMilliseconds(500),
    degree: 2,
    jitter: 0.5 // You can pass null to disable jitter
})
```

## Further information

For further information refer to [`@daiso-tech/core/backoff-policies`](https://daiso-tech.github.io/daiso-core/modules/BackoffPolicy.html) API docs.
