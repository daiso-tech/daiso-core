---
sidebar_position: 8
sidebar_label: Plugins
pagination_label: RateLimiter plugin
tags:
    - RateLimiter
    - Plugins
keywords:
    - RateLimiter
    - Plugins
    - withRateLimiterPrefix
---

# RateLimiter Plugins

## withRateLimiterPrefix plugin

The RateLimiter prefix plugin intercepts calls to a rate-limiter adapter and transparently prefixes all rate-limiter keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant rate limiting** — Prefix rate-limiter keys with a tenant identifier to apply separate rate limits per tenant
- **Endpoint scoping** — Organize rate limits by API endpoint or route prefix
- **Environment isolation** — Separate development, staging, and production rate limit state
- **User tier differentiation** — Prefix keys with a tier identifier (e.g., "free:", "premium:") to apply different rate limits

### How it works

The `withRateLimiterPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a rate-limiter key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method        | Key argument            | Pattern        |
| ------------- | ----------------------- | -------------- |
| `getState`    | Second argument (`key`) | `prefix + key` |
| `reset`       | Second argument (`key`) | `prefix + key` |
| `updateState` | Second argument (`key`) | `prefix + key` |

Every method on the `IRateLimiterAdapter` that operates on a specific rate-limiter key is prefixed.

### Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { withRateLimiterPrefix } from "@daiso-tech/core/rate-limiter/plugins";

const adapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});

// Apply the prefix plugin
const prefixedAdapter = withPlugin(
    adapter,
    withRateLimiterPrefix("tenant-42:"),
);

// The key "api:login" is automatically prefixed to "tenant-42:api:login"
const state = await prefixedAdapter.getState(context, "api:login");
```

#### Using with RateLimiterFactory

The plugin can be applied directly to the adapter passed to the `RateLimiterFactory` constructor:

```ts
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { withPlugin } from "@daiso-tech/core/middleware";
import { withRateLimiterPrefix } from "@daiso-tech/core/rate-limiter/plugins";

const adapter = new DatabaseRateLimiterAdapter({ ... });
const prefixedAdapter = withPlugin(adapter, withRateLimiterPrefix("free-tier:"));

const factory = new RateLimiterFactory({
    adapter: prefixedAdapter,
});
```

### Before/after behavior

**Before** — Rate-limiter keys are used as-is:

```
adapter.getState(context, "api:login")
→ checks rate limit for "api:login"
```

**After** — Rate-limiter keys are automatically prefixed:

```
adapter.getState(context, "api:login")
→ checks rate limit for "tenant-42:api:login"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
