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

# SharedLock Plugins

## withSharedLockPrefix plugin

The SharedLock prefix plugin intercepts calls to a shared-lock adapter and transparently prefixes all lock keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant reader-writer locks** — Prefix lock keys with a tenant identifier to isolate shared lock state between tenants
- **Resource scoping** — Organize shared locks by resource type or module
- **Environment isolation** — Separate development, staging, and production shared lock state
- **Read/write path scoping** — Apply consistent namespacing to both reader and writer lock operations

### How it works

The `withSharedLockPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a shared-lock key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method          | Key argument                 | Pattern        |
| --------------- | ---------------------------- | -------------- |
| `forceRelease`  | First argument (`key`)       | `prefix + key` |
| `getState`      | First argument (`key`)       | `prefix + key` |
| `acquireWriter` | First argument (`key`)       | `prefix + key` |
| `refreshWriter` | First argument (`key`)       | `prefix + key` |
| `releaseWriter` | First argument (`key`)       | `prefix + key` |
| `acquireReader` | `key` within settings object | `prefix + key` |
| `refreshReader` | First argument (`key`)       | `prefix + key` |

### Usage

```ts file=./shared_lock_plugin-samples/with_shared_lock_prefix.ts
```

### Before/after behavior

**Before** — Shared lock keys are used as-is:

```ts file=./shared_lock_plugin-samples/unprefixed_acquire_writer.ts
```

**After** — Shared lock keys are automatically prefixed:

```ts file=./shared_lock_plugin-samples/prefixed_acquire_writer.ts
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
