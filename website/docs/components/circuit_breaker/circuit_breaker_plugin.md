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

| Method         | Key argument            | Pattern        |
| -------------- | ----------------------- | -------------- |
| `getState`     | Second argument (`key`) | `prefix + key` |
| `isolate`      | Second argument (`key`) | `prefix + key` |
| `reset`        | Second argument (`key`) | `prefix + key` |
| `trackFailure` | Second argument (`key`) | `prefix + key` |
| `trackSuccess` | Second argument (`key`) | `prefix + key` |
| `updateState`  | Second argument (`key`) | `prefix + key` |

Every method on the `ICircuitBreakerAdapter` that operates on a specific circuit key is prefixed.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { withCircuitBreakerPrefix } from "eridu-tech/circuit-breaker/plugins";

const adapter = new DatabaseCircuitBreakerAdapter({
    adapter: new MemoryCircuitBreakerStorageAdapter(),
});

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withCircuitBreakerPrefix("service-a:"),
);
```

### Before/after behavior

**Before** — Circuit keys are used as-is:

```ts
adapter.getState("api:users", context);
// -> looks up circuit "api:users"
```

**After** — Circuit keys are automatically prefixed:

```ts
prefixedAdapter.getState("api:users", context);
// -> looks up circuit "service-a:api:users"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
