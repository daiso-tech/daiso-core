---
"@daiso-tech/core": minor
---

## Architectural Shift: Composable EventBus Plugins

The event-bus module has undergone a significant architectural refactoring. Schema validation that was previously hard-coded into the `EventBus` class has been extracted into a standalone, composable plugin. The core `EventBus` class is now a thin passthrough that delegates operations directly to the underlying `IEventBusAdapter`, while optional capabilities are layered on via the middleware plugin system (`PluginFn`/`withPlugin`).

### Motivation

The previous architecture baked schema validation directly into the `EventBus` and `EventBusResolver` classes. This had several drawbacks:

- **Tight coupling**: Users who didn't need schema validation still paid the overhead of importing the validation infrastructure.
- **Difficult to extend**: Adding new cross-cutting behaviours (such as event name prefixing) required modifying the core `EventBus` class.
- **No composability**: Behaviours could not be mixed, matched, or reordered independently.
- **Testing complexity**: Core EventBus tests had to account for all combined validation scenarios.

The new plugin-based architecture solves these problems by keeping the `EventBus` class focused on a single responsibility — delegating to an `IEventBusAdapter` — and providing each cross-cutting behaviour as an independent `PluginFn<IEventBusAdapter>` that can be composed via `withPlugin(adapter, ...plugins)`.

### Breaking Changes

**Removed from `EventBus` class:**

- `EventBusSettings` and `EventBusSettingsBase` no longer accept `eventMapSchema` or `shouldValidateOutput`. These are now configured via the `withEventBusSchema` plugin.
- `EventBusSettings` is no longer generic over `TEventMap` — the constructor signature is now `constructor(settings: EventBusSettings)` instead of `constructor(settings: EventBusSettings<TEventMap>)`.

**Removed from `EventBusResolver` class:**

- `EventBusResolverSettings` no longer accepts the `TEventMap` generic parameter — simplified to `EventBusResolverSettings<TAdapters>`.
- The `setEventMapSchema()` method has been removed. Use the `withEventBusSchema` plugin instead.

**Removed types:**

- `EventMapSchema` (previously exported from `@daiso-tech/core/event-bus`) — now exported from `@daiso-tech/core/event-bus/plugins` with an updated API.

**Removed behaviour:**

- The `EventBus` class no longer validates event data on `dispatch`, nor validates listener output on `addListener`, `listenOnce`, `asPromise`, `subscribeOnce`, or `subscribe`. Schema validation is now opt-in via the `withEventBusSchema` plugin.

### New Plugin-Based Capabilities

The following behaviours are no longer built into `EventBus`. They are available as opt-in plugins:

**`withEventBusSchema`** — Validates event data against a `StandardSchemaV1`-compliant schema map. On `dispatch`, the event data is validated before being forwarded to the adapter. When `shouldValidateListeners` is `true` (default), listener functions are also wrapped to validate event data before it reaches the listener.

- The `defineEventMapSchema` helper provides type-safety when defining the schema map.
- `WITHOUT` this plugin, no schema validation occurs — any event data is accepted.
- Import path: `@daiso-tech/core/event-bus/plugins`

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { withEventBusSchema } from "@daiso-tech/core/event-bus/plugins";
import { z } from "zod";

const adapter = withPlugin(
    new MemoryEventBusAdapter(),
    withEventBusSchema({
        eventMapSchema: {
            add: z.object({ a: z.number(), b: z.number() }),
        },
    }),
);
```

**`withEventBusPrefix`** — Prefixes all event names passed to an event bus adapter. Every method that accepts an event name (`dispatch`, `addListener`, `removeListener`) will have the given prefix prepended before the call is forwarded to the underlying adapter.

- Useful for multi-tenant systems, environment isolation, and module scoping.
- Import path: `@daiso-tech/core/event-bus/plugins`

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { withEventBusPrefix } from "@daiso-tech/core/event-bus/plugins";

const adapter = withPlugin(
    new MemoryEventBusAdapter(),
    withEventBusPrefix("app:"),
);
```

**`withListenerTracking`** — Solves the listener reference tracking problem that arises when middleware plugins wrap listener functions in `addListener`. It maintains an internal `original → wrapper` mapping so that `removeListener` correctly resolves the original listener to its wrapped counterpart before forwarding.

- Use this when composing plugins that wrap listeners (like `withEventBusSchema` with `shouldValidateListeners` enabled).
- Import path: `@daiso-tech/core/event-bus/plugins`

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import {
    withEventBusSchema,
    withListenerTracking,
    defineEventMapSchema,
} from "@daiso-tech/core/event-bus/plugins";
import { z } from "zod";

const eventMapSchema = defineEventMapSchema({
    add: z.object({ a: z.number(), b: z.number() }),
});
const adapter = withPlugin(
    new MemoryEventBusAdapter(),
    withListenerTracking(withEventBusSchema({ eventMapSchema })),
);
```

### How the New Architecture Works

The `EventBus` class has been simplified to a thin wrapper that:

1. Accepts an `IEventBusAdapter` (optionally enhanced by plugins) via `EventBusSettings.adapter`.
2. Delegates every operation (`dispatch`, `addListener`, `removeListener`, `listenOnce`, `asPromise`, `subscribeOnce`, `subscribe`) directly to the adapter.
3. No longer performs schema validation internally.

Plugins receive the adapter and an `enhance` function, allowing them to intercept and modify specific methods using the same middleware pattern used by all other daiso-core components.

### Migration

**Before (built-in validation):**

```ts
const eventBus = new EventBus({
    adapter: new MemoryEventBusAdapter(),
    eventMapSchema,
});
```

**After (explicit plugin composition):**

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { withEventBusSchema } from "@daiso-tech/core/event-bus/plugins";

const adapter = withPlugin(
    new MemoryEventBusAdapter(),
    withEventBusSchema({ eventMapSchema }),
);
const eventBus = new EventBus({ adapter });
```

### New Export Path

A new export path has been added to `package.json`:

```
@daiso-tech/core/event-bus/plugins
```

This exports `withEventBusSchema`, `withEventBusPrefix`, `withListenerTracking`, `EventMapSchema`, `WithEventBusSchemaSettings`, and `defineEventMapSchema`.
