---
sidebar_position: 5
sidebar_label: Creating adapters
pagination_label: Creating rate-limiter adapters
tags:
 - Rate-limiter
 - Creating adapters
 - Creating database adapters
keywords:
 - Rate-limiter
 - Creating adapters
 - Creating database adapters
---

# Creating rate-limiter adapters

## Implementing your custom IRateLimiterAdapter

In order to create an adapter you need to implement the [`IRateLimiterAdapter`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterAdapter.html) contract.


## Implementing your custom IRateLimiterStorageAdapter

We provide an additional contract [`IRateLimiterStorageAdapter`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterStorageAdapter.html) for building custom rate-limiter storage adapters tailored to [`DatabaseRateLimiterAdapter`](./configuring_rate_limiter_adapters.md#databaseratelimiteradapter) and [`DatabaseRateLimiterProviderFactory`](./rate_limiter_factory_resolver.md#databaseratelimiterfactoryresolver).

## Testing your custom IRateLimiterStorageAdapter

We provide a complete test suite to test your rate-limiter storage adapter implementation. Simply use the [`rateLimiterBreakerStorageTestSuite`](https://daiso-tech.github.io/daiso-core/functions/RateLimiter.rateLimiterBreakerStorageTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MyRateLimiterStorageAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { rateLimiterBreakerStorageTestSuite } from "@daiso-tech/core/rate-limiter/test-utilities";
import { MemoryRateLimiterStorageAdapter } from "./MemoryRateLimiterStorageAdapter.js";

describe("class: MyRateLimiterStorageAdapter", () => {
    rateLimiterBreakerStorageTestSuite({
        createAdapter: () => new MemoryRateLimiterStorageAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom IRateLimiterProvider class

In some cases, you may need to implement a custom [`RateLimiterProvider`](https://daiso-tech.github.io/daiso-core/classes/RateLimiter.RateLimiterProvider.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IRateLimiterProvider`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterProvider.html) contract.

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.
