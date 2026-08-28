---
sidebar_position: 7
sidebar_label: Middlewares
pagination_label: CircuitBreaker middlewares
tags:
    - CircuitBreaker
    - Middlewares
    - AOP
keywords:
    - CircuitBreaker
    - Middlewares
    - AOP
---

# CircuitBreaker middlewares

## withCircuitBreakerFactory middleware

The CircuitBreaker middleware wraps function calls with a circuit-breaker, providing fault tolerance for distributed systems. Each unique key (derived from the function's arguments) gets its own circuit instance. When the circuit is **open**, the wrapped function is not called and an error is thrown instead, preventing cascading failures.

### Usage

```ts
import { withCircuitBreakerFactory } from "eridu-tech/circuit-breaker/middlewares";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({
        adapter: new MemoryCircuitBreakerStorageAdapter(),
    }),
});
const withCircuitBreaker = withCircuitBreakerFactory(circuitBreakerFactory);

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

:::info
Here is a complete list of settings for the [`withCircuitBreaker`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.WithCircuitBreakerSettings.html) function.
:::

### Settings

| Option         | Type                             | Description                                                                                                                              |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `key`          | `Invocable<TParameters, string>` | A function that produces a unique identifier for the circuit from the wrapped function's arguments. Each unique key gets its own circuit state |
| `errorPolicy`  | `ErrorPolicy`                    | Determines which errors count toward opening the circuit. Defaults to treating all errors as failures                                     |
| `trigger`      | `CircuitBreakerTrigger`          | Optional custom trigger that determines when the circuit should open. Defaults to the built-in trigger                                   |
| `slowCallTime` | `ITimeSpan`                      | Optional duration above which a call is considered slow. Exceeding it counts toward opening the circuit (if configured in the trigger)    |

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
