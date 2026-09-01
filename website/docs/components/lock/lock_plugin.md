---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: Lock plugin
tags:
    - Lock
    - Plugins
keywords:
    - Lock
    - Plugins
    - withLockPrefix
---

# Lock Plugins

## withLockPrefix plugin

The Lock prefix plugin intercepts calls to a lock adapter and transparently prefixes all lock keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant locking** — Prefix lock keys with a tenant identifier to prevent cross-tenant lock contention
- **Resource scoping** — Organize locks by resource type or module to avoid key collisions
- **Environment isolation** — Separate development, staging, and production lock state
- **Region isolation** — Prefix lock keys with a region identifier in multi-region deployments

### How it works

The `withLockPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a lock key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method         | Key argument            | Pattern        |
| -------------- | ----------------------- | -------------- |
| `acquire`      | First argument (`key`) | `prefix + key` |
| `forceRelease` | First argument (`key`) | `prefix + key` |
| `getState`     | First argument (`key`) | `prefix + key` |
| `refresh`      | First argument (`key`) | `prefix + key` |
| `release`      | First argument (`key`) | `prefix + key` |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { withLockPrefix } from "eridu-tech/lock/plugins";

const adapter = new MemoryLockAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withLockPrefix("tenant-42:"));
```

### Before/after behavior

**Before** — Lock keys are used as-is:

```ts
adapter.acquire("resource:42", "lock-id", ttl);
// -> acquires lock on "resource:42"
```

**After** — Lock keys are automatically prefixed:

```ts
prefixedAdapter.acquire("resource:42", "lock-id", ttl);
// -> acquires lock on "tenant-42:resource:42"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
