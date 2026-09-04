---
sidebar_position: 4
sidebar_label: Configuring policies
pagination_label: Configuring RateLimiter policies
---

# Configuring RateLimiter policies

## SlidingWindowLimiter

<!-- The `SlidingWindowLimiter` breaks after n requests in a row fail. -->

```ts file=./configuring_rate_limiter_policies-samples/sliding_window_limiter.ts
```

## FixedWindowLimiter

<!-- The `FixedWindowLimiter` breaks after a proportion of requests in a count based sliding window fail. -->

```ts file=./configuring_rate_limiter_policies-samples/fixed_window_limiter.ts
```

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
