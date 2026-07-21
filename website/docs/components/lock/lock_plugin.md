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
| `acquire`      | Second argument (`key`) | `prefix + key` |
| `forceRelease` | Second argument (`key`) | `prefix + key` |
| `getState`     | Second argument (`key`) | `prefix + key` |
| `refresh`      | Second argument (`key`) | `prefix + key` |
| `release`      | Second argument (`key`) | `prefix + key` |

Every method on the `ILockAdapter` that operates on a specific lock key is prefixed.

### Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import { withLockPrefix } from "@daiso-tech/core/lock/plugins";

const adapter = new MemoryLockAdapter();

// Apply the prefix plugin
const prefixedAdapter = withPlugin(adapter, withLockPrefix("tenant-42:"));

// The key "job:123" is automatically prefixed to "tenant-42:job:123"
const acquired = await prefixedAdapter.acquire(
    context,
    "job:123",
    "lock-id",
    ttl,
);
```

#### Using with LockFactory

The plugin can be applied directly to the adapter passed to the `LockFactory` constructor:

```ts
import { LockFactory } from "@daiso-tech/core/lock";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import { withPlugin } from "@daiso-tech/core/middleware";
import { withLockPrefix } from "@daiso-tech/core/lock/plugins";

const adapter = new MemoryLockAdapter();
const prefixedAdapter = withPlugin(adapter, withLockPrefix("worker:"));

const lockFactory = new LockFactory({
    adapter: prefixedAdapter,
});

// All locks acquired through lockFactory will use "worker:..." keys
```

### Before/after behavior

**Before** — Lock keys are used as-is:

```
adapter.acquire(context, "resource:42", "lock-id", ttl)
→ acquires lock on "resource:42"
```

**After** — Lock keys are automatically prefixed:

```
adapter.acquire(context, "resource:42", "lock-id", ttl)
→ acquires lock on "prod:resource:42"
```

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
