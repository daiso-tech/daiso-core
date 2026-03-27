---
sidebar_position: 6
sidebar_label: Creating policies
pagination_label: Creating rate-limiter policies
---

# Creating policies

## Implementing your custom IRateLimiterPolicy

In order to create custom rate-limiter you need to implement the [`IRateLimiterPolicy`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterPolicy.html) contract. Custom rate-limiter policies can be used with [`DatabaseRateLimiterAdapter`](./configuring_rate_limiter_adapters.md#databaseratelimiteradapter) and [`DatabaseRateLimiterProviderFactory`](./rate_limiter_factory_resolver.md#databaseratelimiterfactoryresolver).

To understand how to implement a custom [`IRateLimiterPolicy`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterPolicy.html), refer to the [`FixedWindowLimiter`](https://github.com/yousif-khalil-abdulkarim/daiso-core/blob/main/src/rate-limiter/implementations/policies/fixed-window-limiter/fixed-window-limiter.ts) implementation.

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.