---
"@daiso-tech/core": minor
---

### Middleware system simplification

The middleware module has been simplified by removing the factory layer and exposing pre-configured public APIs directly.

#### Breaking changes

- **`useFactory` is now internal.** Instead of calling `useFactory()` to create a `Use` function, import the pre-configured `use` constant directly from `@daiso-tech/core/middleware`.
- **`enhanceFactory` is now internal.** Instead of calling `enhanceFactory(use)` to create an `Enhance` function, import the pre-configured `enhance` constant directly from `@daiso-tech/core/middleware`.
- **`withPluginFactory` is now internal.** Instead of calling `withPluginFactory(enhance)` to create a `WithPlugin` function, import the pre-configured `withPlugin` constant directly from `@daiso-tech/core/middleware`.
- **`UseFactorySettings` type and `defaultPriority` option removed.** `useFactory` no longer accepts a settings object. The default priority for function-based middlewares is now always `0`. To assign a custom priority, set the `priority` property on an `IMiddlewareObject`.

#### New public API

- Added `use` — a pre-configured middleware application function. Import directly from `@daiso-tech/core/middleware`.
- Added `enhance` — a pre-configured method enhancer. Import directly from `@daiso-tech/core/middleware`.
- Added `withPlugin` — a pre-configured plugin applicator. Import directly from `@daiso-tech/core/middleware`.

#### Migration guide

**Before:**
```ts
import { useFactory, enhanceFactory, withPluginFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
const enhance = enhanceFactory(use);
const withPlugin = withPluginFactory(enhance);
```

**After:**
```ts
import { use, enhance, withPlugin } from "@daiso-tech/core/middleware";
```

You cannot rely on `defaultPriority` setting, all middlewares default priorities are `0`.
