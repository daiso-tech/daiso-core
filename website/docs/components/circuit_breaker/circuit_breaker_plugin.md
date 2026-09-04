---
sidebar_position: 8
sidebar_label: Plugins
pagination_label: CircuitBreaker plugin
tags:
    - CircuitBreaker
    - Plugins
keywords:
    - CircuitBreaker
    - Plugins
    - withCircuitBreakerPrefix
---

# CircuitBreaker Plugins

## withCircuitBreakerPrefix plugin

The CircuitBreaker prefix plugin intercepts calls to a circuit-breaker adapter and transparently prefixes all circuit keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant systems** — Prefix circuit keys with a tenant identifier to isolate circuit state between tenants
- **Service versioning** — Separate circuit state for different API versions
- **Environment isolation** — Keep development, staging, and production circuit state separate
- **Region scoping** — Prefix keys with a region identifier in multi-region deployments

### How it works

The `withCircuitBreakerPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a circuit key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method         | Key argument           | Pattern        |
| -------------- | ---------------------- | -------------- |
| `getState`     | First argument (`key`) | `prefix + key` |
| `isolate`      | First argument (`key`) | `prefix + key` |
| `reset`        | First argument (`key`) | `prefix + key` |
| `trackFailure` | First argument (`key`) | `prefix + key` |
| `trackSuccess` | First argument (`key`) | `prefix + key` |
| `updateState`  | First argument (`key`) | `prefix + key` |

### Usage

```ts file=./circuit_breaker_plugin-samples/with_circuit_breaker_prefix.ts
```

### Before/after behavior

**Before** — Circuit keys are used as-is:

```ts file=./circuit_breaker_plugin-samples/unprefixed_circuit_lookup.ts
```

**After** — Circuit keys are automatically prefixed:

```ts file=./circuit_breaker_plugin-samples/prefixed_circuit_lookup.ts
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
