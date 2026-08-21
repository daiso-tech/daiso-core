---
sidebar_position: 6
sidebar_label: Creating policies
pagination_label: Creating RateLimiter policies
---

# Creating RateLimiter policies

## Implementing your custom IRateLimiterPolicy

In order to create custom rate-limiter you need to implement the [`IRateLimiterPolicy`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterPolicy.html) contract. Custom rate-limiter policies can be used with [`DatabaseRateLimiterAdapter`](./configuring_rate_limiter_adapters.md#databaseratelimiteradapter) and [`DatabaseRateLimiterProviderFactory`](./rate_limiter_factory_resolver.md#databaseratelimiterfactoryresolver).

To understand how to implement a custom [`IRateLimiterPolicy`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterPolicy.html), refer to the [`FixedWindowLimiter`](https://github.com/yousif-khalil-abdulkarim/eridu-tech/blob/main/src/rate-limiter/implementations/policies/fixed-window-limiter/fixed-window-limiter.ts) implementation.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
