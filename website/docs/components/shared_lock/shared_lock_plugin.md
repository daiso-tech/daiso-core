---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: SharedLock plugin
tags:
    - SharedLock
    - Plugins
keywords:
    - SharedLock
    - Plugins
    - withSharedLockPrefix
---

# SharedLock plugin

The SharedLock prefix plugin intercepts calls to a shared-lock adapter and transparently prefixes all lock keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

## Use cases

- **Multi-tenant reader-writer locks** — Prefix lock keys with a tenant identifier to isolate shared lock state between tenants
- **Resource scoping** — Organize shared locks by resource type or module
- **Environment isolation** — Separate development, staging, and production shared lock state
- **Read/write path scoping** — Apply consistent namespacing to both reader and writer lock operations

## How it works

The `withSharedLockPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a shared-lock key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method                   | Key argument                 | Pattern        |
| ------------------------ | ---------------------------- | -------------- |
| `forceRelease`           | Second argument (`key`)      | `prefix + key` |
| `getState`               | Second argument (`key`)      | `prefix + key` |
| `acquireWriter`          | Second argument (`key`)      | `prefix + key` |
| `forceReleaseWriter`     | Second argument (`key`)      | `prefix + key` |
| `refreshWriter`          | Second argument (`key`)      | `prefix + key` |
| `releaseWriter`          | Second argument (`key`)      | `prefix + key` |
| `acquireReader`          | `key` within settings object | `prefix + key` |
| `forceReleaseAllReaders` | Second argument (`key`)      | `prefix + key` |
| `refreshReader`          | Second argument (`key`)      | `prefix + key` |

### Writer methods

All writer-related methods (`acquireWriter`, `forceReleaseWriter`, `refreshWriter`, `releaseWriter`) receive the key as a positional argument (second parameter). The plugin prefixes this key directly.

### Reader methods

Reader methods that accept a key as a positional argument (`forceReleaseAllReaders`, `refreshReader`) have their key prefixed directly. The `acquireReader` method accepts a single settings object — the plugin destructures it, prefixes the `key` field, and reconstructs the object:

```ts
// Before:
adapter.acquireReader({ context, key: "my-key", lockId: "l1", limit: 5, ttl });

// After plugin transforms:
adapter.acquireReader({
    context,
    key: "prefix:my-key",
    lockId: "l1",
    limit: 5,
    ttl,
});
```

## Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import { withSharedLockPrefix } from "@daiso-tech/core/shared-lock/plugins";

const adapter = new MemorySharedLockAdapter();

// Apply the prefix plugin
const prefixedAdapter = withPlugin(adapter, withSharedLockPrefix("tenant-42:"));

// Writer lock — key is prefixed
await prefixedAdapter.acquireWriter(context, "resource:42", "lock-id", ttl);

// Reader lock — key within settings object is prefixed
await prefixedAdapter.acquireReader({
    context,
    key: "resource:42",
    lockId: "reader-1",
    limit: 10,
    ttl: TimeSpan.fromMinutes(5),
});
```

### Using with SharedLockFactory

The plugin can be applied directly to the adapter passed to the `SharedLockFactory` constructor:

```ts
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import { withPlugin } from "@daiso-tech/core/middleware";
import { withSharedLockPrefix } from "@daiso-tech/core/shared-lock/plugins";

const adapter = new MemorySharedLockAdapter();
const prefixedAdapter = withPlugin(adapter, withSharedLockPrefix("prod:"));

const factory = new SharedLockFactory({
    adapter: prefixedAdapter,
});
```

## Before/after behavior

**Before** — Shared lock keys are used as-is:

```
adapter.acquireWriter(context, "doc:42", "writer-1", ttl)
→ acquires writer lock on "doc:42"
```

**After** — Shared lock keys are automatically prefixed:

```
adapter.acquireWriter(context, "doc:42", "writer-1", ttl)
→ acquires writer lock on "tenant:doc:42"
```

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
