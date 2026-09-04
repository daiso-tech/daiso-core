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

| Method        | Key argument           | Pattern        |
| ------------- | ---------------------- | -------------- |
| `getState`    | First argument (`key`) | `prefix + key` |
| `reset`       | First argument (`key`) | `prefix + key` |
| `updateState` | First argument (`key`) | `prefix + key` |

### Usage

```ts file=./rate_limiter_plugin-samples/with_rate_limiter_prefix.ts
```

### Before/after behavior

**Before** — Rate-limiter keys are used as-is:

```ts file=./rate_limiter_plugin-samples/unprefixed_get_state.ts
```

**After** — Rate-limiter keys are automatically prefixed:

```ts file=./rate_limiter_plugin-samples/prefixed_get_state.ts
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
