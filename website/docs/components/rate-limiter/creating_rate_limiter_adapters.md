---
sidebar_position: 5
sidebar_label: Creating adapters
pagination_label: Creating RateLimiter adapters
tags:
    - RateLimiter
    - Creating adapters
    - Creating database adapters
keywords:
    - RateLimiter
    - Creating adapters
    - Creating database adapters
---

# Creating RateLimiter adapters

## Implementing your custom IRateLimiterAdapter

In order to create an adapter you need to implement the [`IRateLimiterAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterAdapter.html) contract.

## Implementing your custom IRateLimiterStorageAdapter

We provide an additional contract [`IRateLimiterStorageAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterStorageAdapter.html) for building custom rate-limiter storage adapters tailored to [`DatabaseRateLimiterAdapter`](./configuring_rate_limiter_adapters.md#databaseratelimiteradapter) and [`DatabaseRateLimiterProviderFactory`](./rate_limiter_factory_resolver.md#databaseratelimiterfactoryresolver).

## Testing your custom IRateLimiterStorageAdapter

We provide a complete test suite to test your rate-limiter storage adapter implementation. Simply use the [`rateLimiterBreakerStorageTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/RateLimiter.rateLimiterBreakerStorageTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts file=./creating_rate_limiter_adapters-samples/rate_limiter_storage_test_suite.ts
```

## Implementing your custom IRateLimiterProvider class

In some cases, you may need to implement a custom [`RateLimiterProvider`](https://eridu-tech.github.io/eridu-tech-core/classes/RateLimiter.RateLimiterProvider.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IRateLimiterProvider`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterProvider.html) contract.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
