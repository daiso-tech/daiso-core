---
sidebar_position: 7
sidebar_label: Middleware
pagination_label: CircuitBreaker middleware
tags:
    - CircuitBreaker
    - Middlewares
    - AOP
keywords:
    - CircuitBreaker
    - Middlewares
    - AOP
---

# CircuitBreaker middleware

The CircuitBreaker middleware wraps function calls with a circuit-breaker, providing fault tolerance for distributed systems. Each unique key (derived from the function's arguments) gets its own circuit instance. When the circuit is **open**, the wrapped function is not called and an error is thrown instead, preventing cascading failures.

## Initial setup

```ts
import { withCircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker/middlewares";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";
import { useFactory } from "@daiso-tech/core/middleware";

const circuitBreakerFactory = CircuitBreakerFactory({
    // Configure adapter (e.g. Redis)
});

const withCircuitBreaker = withCircuitBreakerFactory(circuitBreakerFactory);

const use = useFactory();
```

:::info
Here is a complete list of settings for the [`WithCircuitBreaker`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.WithCircuitBreakerSettings.html) function.
:::

## Usage

```ts
const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

// Wrap with circuit-breaker
const protectedCall = use(
    callExternalApi,
    withCircuitBreaker({
        key: (endpoint) => `api:${endpoint}`,
    }),
);

await protectedCall("users"); // Succeeds or opens the circuit on repeated failures
```

## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.
