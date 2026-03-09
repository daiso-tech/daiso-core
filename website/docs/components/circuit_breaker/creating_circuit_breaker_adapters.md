---
sidebar_position: 5
sidebar_label: Creating adapters
pagination_label: Creating circuit-breaker adapters
tags:
 - Circuit-breaker
 - Creating adapters
 - Creating database adapters
keywords:
 - Circuit-breaker
 - Creating adapters
 - Creating database adapters
---

# Creating circuit-breaker adapters

## Implementing your custom ICircuitBreakerAdapter

In order to create an adapter you need to implement the [`ICircuitBreakerAdapter`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreakerAdapter.html) contract.


## Implementing your custom ICircuitBreakerStorageAdapter

We provide an additional contract [`ICircuitBreakerStorageAdapter`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreakerStorageAdapter.html) for building custom circuit-breaker storage adapters tailored to [`DatabaseCircuitBreakerAdapter`](./configuring_circuit_breaker_adapters.md#databasecircuitbreakeradapter) and [`DatabaseCircuitBreakerProviderFactory`](./circuit_breaker_provider_factory.md#databasecircuitbreakerproviderfactory).

## Testing your custom ICircuitBreakerStorageAdapter

We provide a complete test suite to test your circuit-breaker storage adapter implementation. Simply use the [`circuitBreakerStorageTestSuite`](https://daiso-tech.github.io/daiso-core/functions/CircuitBreaker.circuitBreakerStorageTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MyCircuitBreakerStorageAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { circuitBreakerStorageTestSuite } from "@daiso-tech/core/circuit-breaker/test-utilities";
import { MemoryCircuitBreakerStorageAdapter } from "./MemoryCircuitBreakerStorageAdapter.js";

describe("class: MyCircuitBreakerStorageAdapter", () => {
    circuitBreakerStorageTestSuite({
        createAdapter: () => new MemoryCircuitBreakerStorageAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ICircuitBreakerProvider class

In some cases, you may need to implement a custom [`CircuitBreakerProvider`](https://daiso-tech.github.io/daiso-core/classes/CircuitBreaker.CircuitBreakerProvider.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ICircuitBreakerProvider`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreakerProvider.html) contract.

## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.
