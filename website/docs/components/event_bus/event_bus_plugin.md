---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: EventBus plugin
tags:
    - EventBus
    - Plugins
keywords:
    - EventBus
    - Plugins
    - withEventBusPrefix
    - withEventBusSchema
    - withListenerTracking
---

# EventBus Plugins

## withEventBusPrefix plugin

The EventBus prefix plugin intercepts calls to an event bus adapter and transparently prefixes all event names with a configurable string. This enables logical event namespace isolation without modifying the adapter implementation.

### Use cases

- **Multi-tenant systems** — Prefix event names with a tenant identifier to isolate events between tenants
- **Environment isolation** — Separate development, staging, and production event streams
- **Module scoping** — Organize events by feature or module to avoid naming collisions

### How it works

The `withEventBusPrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts an event name. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the event name argument, and forwards the modified arguments to the original method.

The plugin prefixes event names for the following methods:

| Method           | Event name argument | Pattern        |
| ---------------- | ------------------- | -------------- |
| `dispatch`       | Second argument     | `prefix + key` |
| `addListener`    | Second argument     | `prefix + key` |
| `removeListener` | Second argument     | `prefix + key` |

Methods that do not accept an event name are unaffected.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withEventBusPrefix } from "eridu-tech/event-bus/plugins";

const adapter = new MemoryEventBusAdapter();

// Apply the prefix plugin
const prefixedAdapter = withPlugin(adapter, withEventBusPrefix("tenant-42:"));

// The event name "user.created" is automatically prefixed to "tenant-42:user.created"
await prefixedAdapter.addListener(context, "user.created", listener);
await prefixedAdapter.dispatch(context, "user.created", payload);
```

#### Using with EventBus class

The plugin can be applied directly to the adapter passed to the `EventBus` constructor:

```ts
import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withPlugin } from "eridu-tech/middleware";
import { withEventBusPrefix } from "eridu-tech/event-bus/plugins";

const adapter = new MemoryEventBusAdapter();
const prefixedAdapter = withPlugin(adapter, withEventBusPrefix("app:"));

const eventBus = new EventBus({
    adapter: prefixedAdapter,
});

// All operations through `eventBus` will use "app:..." event names
await eventBus.addListener("user.created", listener);
await eventBus.dispatch("user.created", data);
```

### Before/after behavior

**Before** — Event names are used as-is:

```
adapter.dispatch(context, "user.created", data)     → dispatches "user.created"
adapter.addListener(context, "user.created", listener) → listens to "user.created"
```

**After** — Event names are automatically prefixed:

```
adapter.dispatch(context, "user.created", data)     → dispatches "app:user.created"
adapter.addListener(context, "user.created", listener) → listens to "app:user.created"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withEventBusSchema plugin

The EventBus schema plugin validates event data against a schema map before dispatching and, optionally, before delivering events to listeners. This ensures that only data conforming to the defined schema reaches the adapter and your event handlers.

### Use cases

- **Input validation** — Ensure dispatched event data matches the expected shape before it reaches the adapter
- **Listener safety** — Validate event data before it reaches listeners, preventing malformed data from causing runtime errors
- **Schema enforcement** — Enforce a contract between event producers and consumers at runtime
- **Standard Schema compliance** — Works with any library that implements the `StandardSchemaV1` specification (Zod, ArkType, Valibot, etc.)

### How it works

The `withEventBusSchema` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on the `dispatch` method. When `dispatch` is invoked, the plugin intercepts the call, validates the event data against the schema associated with the event name, and forwards either the validated data (passthrough) or throws on validation failure.

When `shouldValidateListeners` is `true` (default), the plugin also enhances `addListener` to wrap listener functions with validation logic. The wrapped listener validates incoming event data before passing it to the original listener.

| Method        | Behaviour                                                 |
| ------------- | --------------------------------------------------------- |
| `dispatch`    | Validates event data against the schema before forwarding |
| `addListener` | Wraps the listener to validate event data on each call    |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withEventBusSchema } from "eridu-tech/event-bus/plugins";
import { z } from "zod";

const adapter = new MemoryEventBusAdapter();

const enhanced = withPlugin(
    adapter,
    withEventBusSchema({
        eventMapSchema: {
            "user.created": z.object({
                userId: z.string(),
            }),
        },
    }),
);

// Valid event data passes through
await enhanced.dispatch(context, "user.created", { userId: "123" });

// Invalid event data throws
await enhanced.dispatch(context, "user.created", {
    userId: 123,
} as never); // throws

// Listeners receive validated event data
await enhanced.addListener(context, "user.created", (event) => {
    console.log(event.userId); // event is validated
});
```

#### Disabling listeners validation

If you only want to validate event data on dispatch and skip listener validation, set `shouldValidateListeners` to `false`:

```ts
const enhanced = withPlugin(
    adapter,
    withEventBusSchema({
        eventMapSchema: {
            "user.created": z.object({
                userId: z.string(),
            }),
        },
        shouldValidateListeners: false,
    }),
);

// Dispatch is still validated
await enhanced.dispatch(context, "user.created", { userId: "123" });

// Listeners receive the raw event data without validation
await enhanced.addListener(context, "user.created", (event) => {
    console.log(event);
});
```

#### Using with EventBus class

```ts
import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withPlugin } from "eridu-tech/middleware";
import {
    withEventBusSchema,
    defineEventMapSchema,
} from "eridu-tech/event-bus/plugins";
import { z } from "zod";

const eventMapSchema = defineEventMapSchema({
    "user.created": z.object({ userId: z.string() }),
});
const adapter = new MemoryEventBusAdapter();
const enhancedAdapter = withPlugin(
    adapter,
    withEventBusSchema({
        eventMapSchema,
    }),
);

const eventBus = new EventBus<typeof eventMapSchema>({
    adapter: enhancedAdapter,
});

// Both dispatch and listener delivery are validated
await eventBus.dispatch("user.created", { userId: "123" });
```

### Settings

| Option                    | Type             | Default | Description                                                                   |
| ------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------- |
| `eventMapSchema`          | `EventMapSchema` | —       | Map of event names to standard-schema-compliant schemas for validation        |
| `shouldValidateListeners` | `boolean`        | `true`  | Whether to validate event data in listener functions when events are received |

### Plugin ordering

When combining `withEventBusSchema` with `withEventBusPrefix`, the schema must come **first** in the array so it validates the original event names before `withEventBusPrefix` transforms them:

```ts
// ✅ Correct: schema is first in array → outermost → validates original "user.created"
const enhanced = withPlugin(adapter, [
    withEventBusSchema({ eventMapSchema }),
    withEventBusPrefix("app:"),
]);

// ❌ Wrong: prefix is first in array → outermost → schema receives "app:user.created"
const enhanced = withPlugin(adapter, [
    withEventBusPrefix("app:"),
    withEventBusSchema({ eventMapSchema }),
]);
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## withListenerTracking plugin

The `withListenerTracking` plugin wraps another plugin with automatic listener-reference tracking. When a middleware plugin intercepts `addListener` and wraps the listener function, the adapter stores the wrapped reference. If the caller later invokes `removeListener` with the original listener, the adapter cannot find it — the reference has changed.

This plugin solves that problem by ensuring that `removeListener` with the original listener correctly resolves through the chain.

### Use cases

- **Listener reference transparency** — Callers can use the original listener function with `removeListener` even when a plugin wraps the listener in `addListener`
- **Plugin safety** — Wrap plugins (such as `withEventBusSchema`) that transform listeners in `addListener` to ensure `removeListener` still resolves correctly
- **Per-plugin tracking** — Apply `withListenerTracking` to each plugin that wraps listeners; it does not automatically handle wrapping from other plugins in the chain

:::info
This plugin is only needed if you call `removeListener` at runtime. If you only register listeners during startup and never remove them, listener-reference tracking is unnecessary.
:::

### How it works

`withListenerTracking` wraps the provided plugin and adds tracking layers around `addListener` and `removeListener` on the adapter. When `addListener` is called, the original listener is wrapped with a tracking wrapper and the mapping from original to wrapper is stored in a `ListenerStore` keyed by event name. On `removeListener`, the original listener is resolved back to the tracking wrapper through the store before forwarding the call down the chain.

The plugin execution order is:

1. The user plugin's enhancements are applied first (inner layer)
2. The tracking enhancements are applied second (outermost layer)

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import {
    withEventBusSchema,
    withListenerTracking,
} from "eridu-tech/event-bus/plugins";
import { z } from "zod";

const adapter = new MemoryEventBusAdapter();

// When a schema validates listeners, it wraps the listener function.
// withListenerTracking ensures removeListener still works with the original
// listener reference.
const enhancedAdapter = withPlugin(
    adapter,
    withListenerTracking(
        withEventBusSchema({
            eventMapSchema: {
                "user.created": z.object({
                    userId: z.string(),
                }),
            },
        }),
    ),
);

const listener = (event: any) => {
    console.log(event);
};

await enhancedAdapter.addListener(context, "user.created", listener);

// removeListener with the original listener reference works correctly
// even though the schema plugin wrapped it internally
await enhancedAdapter.removeListener(context, "user.created", listener);
```

#### Chaining multiple tracking calls

Multiple `withListenerTracking` calls can be composed together:

```ts
const enhancedAdapter = withPlugin(adapter, [
    withListenerTracking(pluginA),
    withListenerTracking(pluginB),
]);
```

#### Using with EventBus class

```ts
import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withPlugin } from "eridu-tech/middleware";
import { withListenerTracking } from "eridu-tech/event-bus/plugins";

const adapter = new MemoryEventBusAdapter();

// Apply tracking around a prefix plugin
const trackedAdapter = withPlugin(
    adapter,
    withListenerTracking(withEventBusPrefix("app:")),
);

const eventBus = new EventBus({
    adapter: trackedAdapter,
});

const listener = (event: any) => {
    console.log(event);
};

await eventBus.addListener("user.created", listener);
await eventBus.removeListener("user.created", listener);
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::
