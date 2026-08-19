---
sidebar_position: 6
sidebar_label: Creating policies
pagination_label: Creating CircuitBreaker policies
---

# Creating CircuitBreaker policies

## Implementing your custom ICircuitBreakerPolicy

In order to create custom circuit-breaker you need to implement the [`ICircuitBreakerPolicy`](https://eridu-tech.github.io/eridu-tech/types/CircuitBreaker.ICircuitBreakerPolicy.html) contract. Custom circuit-breaker policies can be used with [`DatabaseCircuitBreakerAdapter`](./configuring_circuit_breaker_adapters.md#databasecircuitbreakeradapter) and [`DatabaseCircuitBreakerProviderFactory`](./circuit_breaker_factory_resolver.md#databasecircuitbreakerfactoryresolver).

To understand how to implement a custom [`ICircuitBreakerPolicy`](https://eridu-tech.github.io/eridu-tech/types/CircuitBreaker.ICircuitBreakerPolicy.html), refer to the [`ConsecutiveBreaker`](https://github.com/yousif-khalil-abdulkarim/eridu-tech/blob/main/src/circuit-breaker/implementations/policies/consecutive-breaker/consecutive-breaker.ts) implementation.

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech/modules/CircuitBreaker.html) API docs.
