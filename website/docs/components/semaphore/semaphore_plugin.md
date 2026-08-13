---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: Semaphore plugin
tags:
    - Semaphore
    - Plugins
keywords:
    - Semaphore
    - Plugins
    - withSemaphorePrefix
---

# Semaphore Plugins

## withSemaphorePrefix plugin

The Semaphore prefix plugin intercepts calls to a semaphore adapter and transparently prefixes all semaphore keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant semaphores** — Prefix semaphore keys with a tenant identifier to isolate concurrency limits between tenants
- **Resource scoping** — Organize semaphores by resource type to avoid key collisions
- **Environment isolation** — Separate development, staging, and production semaphore state
- **Pool differentiation** — Prefix keys with a pool name to manage independent semaphore pools

### How it works

The `withSemaphorePrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a semaphore key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method            | Key argument                 | Pattern        |
| ----------------- | ---------------------------- | -------------- |
| `acquire`         | `key` within settings object | `prefix + key` |
| `forceReleaseAll` | Second argument (`key`)      | `prefix + key` |
| `getState`        | Second argument (`key`)      | `prefix + key` |
| `refresh`         | Second argument (`key`)      | `prefix + key` |
| `release`         | Second argument (`key`)      | `prefix + key` |

#### Special handling for `acquire`

The `acquire` method accepts a single settings object rather than positional arguments. The plugin destructures the settings object, prefixes the `key` field, and reconstructs the object with all other fields preserved:

```ts
// Before:
adapter.acquire({ context, key: "my-key", slotId: "s1", limit: 5, ttl });

// After plugin transforms:
adapter.acquire({ context, key: "prefix:my-key", slotId: "s1", limit: 5, ttl });
```

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { withSemaphorePrefix } from "eridu-tech/semaphore/plugins";

const adapter = new MemorySemaphoreAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withSemaphorePrefix("pool-1:"));
```

### Before/after behavior

**Before** — Semaphore keys are used as-is:

```ts
adapter.acquire({ context, key: "connections", ... })
// -> acquires slot on "connections"
```

**After** — Semaphore keys are automatically prefixed:

```ts
prefixedAdapter.acquire({ context, key: "connections", ... })
// -> acquires slot on "pool-1:connections"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
