# @daiso-tech/core

## 0.59.0

### Minor Changes

- dbcb9e3: # New DI Component: Eager Dependency-Injection Container

    A new dependency-injection (IoC) component is available at `eridu-tech/di`. The
    `./di` package export now resolves to the **eager** container implementation
    (`dist/di/implementations/eager`), and its public contract surface lives in
    `eridu-tech/di/contracts`.

    ## What's included
    - **Registrations** — `registerFactory`, `registerValue`, `registerDynamic`,
      plus `overrideFactory` / `overrideValue` for testing and `registerProvider`
      for grouped, provider-based registration.
    - **Lifetimes** — `singleton`, `transient`, and `scoped`.
    - **Object-literal dependencies** — factories declare dependencies as a record
      (`DepsTokens<TDeps>`) and receive a single `deps` object plus the current
      execution context: `ServiceFactory = Invocable<[deps, executionContext], ...>`.
    - **Scopes & forking** — `container.run()` executes a scope in which scoped
      services resolve once, and `container.fork()` creates child containers that
      inherit registrations and overrides.
    - **Graph validation** — on `init()`, the container validates the service graph
      and eagerly initializes singletons in dependency order, surfacing
      `InvalidGraphDiError` for cycles, invalid lifetime edges, and undeclared
      dependencies.

- dfa440e: # Architectural Shift: Composable FileStorage Plugins

    The file-storage module has undergone a significant architectural refactoring. Cross-cutting behaviours that were previously hard-coded into `FileStorage`, `FileStorageResolver`, and even `FsFileStorageAdapter` (key validation, lowercase normalisation, and content-type inference) have been extracted into standalone, composable plugins built on the middleware plugin system (`PluginFn`/`withPlugin`). The core `FileStorage` class is now a thin passthrough, while optional capabilities are layered on via plugins.

    ## Motivation

    The previous architecture baked key validation, lowercase normalisation, and content-type inference directly into the core classes and the filesystem adapter. This made these behaviours difficult to opt out of, mix, reorder, or reuse across different adapters, and forced every consumer to pay the cost of behaviour they might not need.

    The new plugin-based architecture keeps the core classes focused on a single responsibility — delegating to an `IFileStorageAdapter` — and provides each cross-cutting behaviour as an independent `PluginFn<IFileStorageAdapter>` that can be composed via `withPlugin(adapter, ...plugins)`.

    ### Breaking Changes

    **Removed from `FileStorage` / `FileStorageSettingsBase`:**

    - The `defaultContentType` setting — content-type inference is now handled by the `withFileStorageInferContentTypeOnWrite` / `withFileStorageInferContentTypeOnRead` plugins. `application/octet-stream` is used as the default content type on write and read unless you use a plugin that can infer the content type.
    - The `onlyLowercase` setting — key lowercasing is now handled by the `withFileStorageLowerCase` plugin.
    - The `keyValidator` setting — key validation is now handled by the `withFileStorageKeyValidator` plugin.

    **Removed from `FileStorageResolver`:**

    - `setDefaultContentType(contentType)` — use the content-type inference plugins instead.
    - `setOnlyLowercase(onlyLowercase)` — use the `withFileStorageLowerCase` plugin instead.
    - `setKeyValidator(keyValidator)` — use the `withFileStorageKeyValidator` plugin instead.

    **Moved exports:**

    - `defaultKeyValidator` and `FileKeyValidator` are no longer exported from `eridu-tech/file-storage`. They now live in the plugins module alongside `withFileStorageKeyValidator`.

    **Changed contracts:**

    - `FileAdapterMetadata.contentType` is now `string | null`. A `null` value indicates the storage backend does not store or expose a content type for the file; reading such metadata through `FileStorage` falls back to `application/octet-stream` unless a content-type inference plugin is applied.

    **Changed adapter behaviour:**

    - `FsFileStorageAdapter.getMetaData` no longer infers the content type from the file key extension and now reports `null` for the content type. Apply the `withFileStorageInferContentTypeOnRead` or `withFileStorageInferFileTypeOnRead` plugins to restore content-type inference.

    ### New Plugins

    The plugins below are applied to a file-storage adapter with `withPlugin(adapter, ...plugins)`.

    **`withFileStorageKeyValidator`** — Validates every file key before it reaches a file-storage adapter. When a key fails validation, an `InvalidKeyFileError` is thrown and the underlying adapter method is never invoked.

    - Uses the built-in `defaultKeyValidator` by default, which rejects keys containing `../`, newlines (`\n`), tabs (`\t`), and keys that are empty or whitespace-only.
    - A custom validator can be supplied as the first argument.

    ```ts
    import { withPlugin } from "eridu-tech/middleware";
    import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
    import { withFileStorageKeyValidator } from "eridu-tech/file-storage/plugins";

    const adapter = withPlugin(
        new MemoryFileStorageAdapter(),
        withFileStorageKeyValidator(),
    );
    ```

    **`withFileStorageLowerCase`** — Lowercases every file key before it reaches the underlying adapter, enforcing a consistent, case-insensitive key format.

    ```ts
    import { withPlugin } from "eridu-tech/middleware";
    import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
    import { withFileStorageLowerCase } from "eridu-tech/file-storage/plugins";

    const adapter = withPlugin(
        new MemoryFileStorageAdapter(),
        withFileStorageLowerCase(),
    );
    ```

    **`withFileStorageInferContentTypeOnRead`** — Infers the content type from the file key extension when reading file metadata (`getMetaData`). Meant for adapters that cannot save the content type of a file and instead need it inferred, such as `FsFileStorageAdapter`.

    **`withFileStorageInferContentTypeOnWrite`** — Infers the content type from the file key extension when writing files or generating signed URLs. Inference for signed URLs can be toggled via the `inferSignedDownloadUrl` and `inferSignedUploadUrl` settings (both default to `true`).

    **`withFileStorageInferFileTypeOnRead`** — Infers the content type from the actual file bytes (via the `file-type` library) when reading file metadata.

    **`withFileStorageInferFileTypeOnWrite`** — Infers the content type from the actual file bytes (via the `file-type` library) when writing files, so files with misleading or missing extensions still get an accurate content type.

    ### Migration

    **Before (built-in behaviour):**

    ```ts
    const fileStorage = new FileStorage({
        adapter: new MemoryFileStorageAdapter(),
        defaultContentType: "application/octet-stream",
        onlyLowercase: true,
        keyValidator: myValidator,
    });
    ```

    **After (explicit plugin composition):**

    ```ts
    import { withPlugin } from "eridu-tech/middleware";
    import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
    import {
        withFileStorageKeyValidator,
        withFileStorageLowerCase,
    } from "eridu-tech/file-storage/plugins";

    const adapter = withPlugin(
        new MemoryFileStorageAdapter(),
        withFileStorageKeyValidator(myValidator),
        withFileStorageLowerCase(),
    );
    const fileStorage = new FileStorage({ adapter });
    ```

    ### New Dependency
    - Added `file-type` for content-based file type detection, used by the file-type inference plugins.

## 0.58.0

### Minor Changes

- bbfafec: ## Cache adapter API simplification

    Simplified the `ICacheAdapter` contract by removing the `removeAll` method and renaming `removeByKeyPrefix` to `removeByPrefix`.

    ### What changed
    - **Removed** `ICacheAdapter.removeAll(context)`.
    - **Renamed** `ICacheAdapter.removeByKeyPrefix(prefix, context)` to `ICacheAdapter.removeByPrefix(prefix, context)`.
    - Calling `removeByPrefix` with an empty string prefix (`""`) now clears the entire cache, which replaces the removed `removeAll` method.

    ### Migration
    - Replace calls to `removeAll(context)` with `removeByPrefix("", context)`.
    - Rename any calls to `removeByKeyPrefix(prefix, context)` to `removeByPrefix(prefix, context)`.
    - If you maintain a custom implementation of `ICacheAdapter`, update it to the new contract and remove the `removeAll` method.

## 0.57.4

### Patch Changes

- 95bc7f2: Changed all type-only imports to the top-level `import type` form and adjusted the ESLint config accordingly, so the compiled output no longer emits runtime side-effect imports for type-only packages like `@standard-schema/spec` (fixes `ERR_MODULE_NOT_FOUND` for consumers).

## 0.57.3

### Patch Changes

- e513526: Updated dependency versions.

    > **Minimum Node.js version is now `>=24`** — added via the `engines` field in `package.json`. Ensure your runtime uses Node.js 24 or newer.

    **dependencies**

    | Package     | From      | To        |
    | ----------- | --------- | --------- |
    | `superjson` | `^2.2.2`  | `^2.2.6`  |
    | `type-fest` | `^5.6.0`  | `^5.8.0`  |
    | `uuid`      | `^11.0.5` | `^14.0.1` |

    **peerDependencies**

    | Package   | From      | To        |
    | --------- | --------- | --------- |
    | `ioredis` | `^5.0.0`  | `^6.0.0`  |
    | `kysely`  | `^0.28.0` | `^0.29.4` |
    | `mongodb` | `^6.0.0`  | `^7.5.0`  |

    **devDependencies**

    | Package                            | From        | To          |
    | ---------------------------------- | ----------- | ----------- |
    | `@aws-sdk/client-s3`               | `^3.1011.0` | `^3.1102.0` |
    | `@aws-sdk/s3-request-presigner`    | `^3.1011.0` | `^3.1102.0` |
    | `@changesets/cli`                  | `^2.27.7`   | `^2.31.1`   |
    | `@standard-schema/spec`            | `^1.0.0`    | `^1.1.0`    |
    | `@testcontainers/minio`            | `^11.13.0`  | `^12.0.4`   |
    | `@testcontainers/mongodb`          | `^10.13.2`  | `^12.0.4`   |
    | `@testcontainers/mysql`            | `^11.0.0`   | `^12.0.4`   |
    | `@testcontainers/postgresql`       | `^11.0.0`   | `^12.0.4`   |
    | `@testcontainers/redis`            | `^10.13.2`  | `^12.0.4`   |
    | `@types/better-sqlite3`            | `^7.6.13`   | `^9.6.0`    |
    | `@types/node`                      | `^25.6.0`   | `^26.1.2`   |
    | `@types/pg`                        | `^8.15.4`   | `^8.20.3`   |
    | `@types/uuid`                      | `^10.0.0`   | `^11.0.0`   |
    | `@typescript-eslint/eslint-plugin` | `^8.1.0`    | `^8.66.0`   |
    | `@typescript-eslint/parser`        | `^8.1.0`    | `^8.66.0`   |
    | `better-sqlite3`                   | `^12.5.0`   | `^13.0.2`   |
    | `commitizen`                       | `^4.3.1`    | `^4.3.2`    |
    | `execa`                            | — (new)     | `^10.0.1`   |
    | `hono`                             | `^4.12.26`  | `^4.13.0`   |
    | `ioredis`                          | `^5.4.1`    | `^6.0.0`    |
    | `kysely`                           | `^0.28.2`   | `^0.29.4`   |
    | `mongodb`                          | `^6.10.0`   | `^7.5.0`    |
    | `mysql2`                           | `^3.14.1`   | `^3.23.2`   |
    | `pg`                               | `^8.16.0`   | `^8.22.0`   |
    | `publint`                          | `^0.3.8`    | `^0.3.22`   |
    | `rimraf`                           | `^6.0.1`    | `^6.1.3`    |
    | `testcontainers`                   | `^11.13.0`  | `^12.0.4`   |
    | `tsc-alias`                        | `^1.8.10`   | `^1.9.1`    |
    | `tsx`                              | `^4.21.0`   | `^4.23.5`   |
    | `typedoc`                          | `^0.27.1`   | `^0.28.20`  |
    | `typedoc-plugin-merge-modules`     | `^6.1.0`    | `^7.0.0`    |
    | `typescript`                       | `^5.5.4`    | `^6.0.3`    |
    | `vite-tsconfig-paths`              | `^4.3.2`    | `^6.1.1`    |
    | `vitest`                           | `^3.0.2`    | `^4.1.10`   |
    | `zod`                              | `^3.25.49`  | `^4.4.3`    |

## 0.57.2

### Patch Changes

- 50d8345: First release under the new package name

## 0.57.1

### Patch Changes

- 121c86c: Updated readme

## 0.57.0

### Minor Changes

- f04a94b: Renamed `IInvokableObject` to `IInvocableObject` type
  Renamed `InvokableFn` to `InvocableFn` type
  Renamed `Invokable` to `Invocable` type
- dc2a537: ## Simplified Database Adapter Settings

    Removed the `enableTransactions`, `shouldRemoveExpiredKeys`, and `expiredKeysRemovalInterval` settings from all database-backed adapters. Database operations are now always wrapped in a transaction, and the built-in background cleanup of expired records has been removed.

    ### What changed

    **Removed `enableTransactions` from:**

    - `KyselyCacheAdapter`
    - `KyselyCircuitBreakerStorageAdapter`
    - `KyselyLockAdapter`
    - `KyselyRateLimiterStorageAdapter`
    - `KyselySemaphoreAdapter`
    - `KyselySharedLockAdapter`
    - `MongodbCircuitBreakerStorageAdapter`
    - `MongodbRateLimiterStorageAdapter`

    Every operation is now always executed inside a database transaction (with `serializable` isolation for the Kysely lock, semaphore, and shared-lock adapters), which matches the previous default behavior.

    **Removed `shouldRemoveExpiredKeys` and `expiredKeysRemovalInterval` from:**

    - `KyselyCacheAdapter`
    - `KyselyLockAdapter`
    - `KyselyRateLimiterStorageAdapter`
    - `KyselySemaphoreAdapter`
    - `KyselySharedLockAdapter`

    The background task that periodically removed expired records is no longer started automatically.

    ### Migration
    - Remove any `enableTransactions`, `shouldRemoveExpiredKeys`, or `expiredKeysRemovalInterval` options from adapter settings — they are no longer accepted.
    - If you relied on automatic expired-key cleanup, schedule `removeAllExpired()` yourself (e.g. with a cron job or `setInterval`), as the adapters no longer run it in the background.

## 0.56.0

### Minor Changes

- 12a2908: ## Execution Context Integration for All Adapters

    All adapter contracts across `Cache`, `CircuitBreaker`, `EventBus`, `FileStorage`, `Lock`, `RateLimiter`, `Semaphore`, and `SharedLock` now accept an `IReadableContext` parameter as the last argument on every method. This enables passing execution-scoped metadata — such as request IDs, tenant IDs, correlation tokens, or authentication context — through the adapter layer without adding framework-specific coupling.

    ### Motivation

    Previously, adapter methods had no standard mechanism to receive execution-scoped metadata. Users who needed to propagate context (e.g., for logging, tracing, or tenant isolation) had to implement workarounds such as storing context in closures, using global state, or threading custom parameters through non-standard extensions.

    By adding `context: IReadableContext` as the final parameter on all adapter methods, the execution context becomes a first-class citizen of the adapter contract. This follows the dependency inversion principle — adapters depend on the abstract `IReadableContext` interface rather than any concrete context implementation, keeping them portable across environments.

    ### Breaking Changes

    **All adapter methods** across the following contracts now require `context: IReadableContext` as the last positional argument:

    | Contract                 | Affected Methods                                                                                                                                                                                       |
    | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `ICacheAdapter`          | `get`, `getAndRemove`, `add`, `getOrAdd`, `put`, `update`, `increment`, `removeMany`, `removeAll`, `removeByKeyPrefix`                                                                                 |
    | `ILockAdapter`           | `acquire`, `release`, `forceRelease`, `refresh`, `getState`                                                                                                                                            |
    | `ICircuitBreakerAdapter` | `getState`, `trackFailure`, `trackSuccess`, `updateState`, `reset`, `isolate`                                                                                                                          |
    | `IEventBusAdapter`       | `dispatch`, `addListener`, `removeListener`                                                                                                                                                            |
    | `IFileStorageAdapter`    | `exists`, `getStream`, `getBytes`, `getMetaData`, `add`, `addStream`, `update`, `updateStream`, `put`, `putStream`, `copy`, `copyAndReplace`, `move`, `moveAndReplace`, `removeMany`, `removeByPrefix` |
    | `IFileUrlAdapter`        | `getPublicUrl`, `getSignedDownloadUrl`, `getSignedUploadUrl`                                                                                                                                           |
    | `IRateLimiterAdapter`    | `getState`, `reset`, `updateState`                                                                                                                                                                     |
    | `ISemaphoreAdapter`      | `release`, `forceReleaseAll`, `refresh`, `getState`                                                                                                                                                    |
    | `ISharedLockAdapter`     | `acquireWriter`, `releaseWriter`, `forceReleaseWriter`, `refreshWriter`, `releaseReader`, `forceReleaseAllReaders`, `refreshReader`, `forceRelease`, `getState`                                        |

    **Note:** `ISemaphoreAdapter.acquire` and `ISharedLockAdapter.acquireReader` accept `context` via a settings object (`SemaphoreAcquireSettings` / `SharedLockAcquireSettings`) rather than as a positional argument, due to the number of parameters involved.

    ### Migration

    All call sites that invoke adapter methods directly must now pass a `context: IReadableContext` value as the last argument. In test environments, use `NoOpContext`:

    ```diff
    -import { NoOpContext } from "@daiso-tech/core/execution-context";
    -
    -const context = new NoOpContext();
    -await adapter.get(context, "myKey");
    +import { NoOpContext } from "@daiso-tech/core/execution-context";
    +
    +const context = new NoOpContext();
    +await adapter.get("myKey", context);
    ```

    All built-in adapter implementations (`Redis*Adapter`, `Kysely*Adapter`, `Memory*Adapter`, `MongoDB*Adapter`, `NoOp*Adapter`) have already been updated to accept and propagate the context parameter.

- 5c28ea2: ## Architectural Shift: Composable Cache Plugins

    The cache module has undergone a significant architectural refactoring. Behaviours that were previously hard-coded into the `Cache` and `CacheResolver` implementations — schema validation, TTL jitter, and write-lock serialisation — have been extracted into standalone, composable plugins. The core `Cache` class is now a thin passthrough that delegates operations directly to the underlying `ICacheAdapter`, while optional capabilities are layered on via the middleware plugin system (`PluginFn`/`withPlugin`).

    ### Motivation

    The previous architecture baked cross-cutting concerns like schema validation, TTL jittering, and distributed write locking directly into the `Cache` and `CacheResolver` classes. This had several drawbacks:

    - **Tight coupling**: Users who wanted only one feature (e.g., schema validation) still paid the overhead of the other features.
    - **Difficult to extend**: Adding new cross-cutting behaviours required modifying the core `Cache` class, increasing complexity and risk.
    - **No composability**: Behaviours could not be mixed, matched, or reordered independently.
    - **Testing complexity**: Core cache tests had to account for all combined behaviours.

    The new plugin-based architecture solves these problems by keeping the `Cache` class focused on a single responsibility — delegating to an `ICacheAdapter` — and providing each cross-cutting behaviour as an independent `PluginFn<ICacheAdapter>` that can be composed via `withPlugin(adapter, ...plugins)`.

    ### Breaking Changes

    **Removed from `CacheSettingsBase`:**

    - `schema` — use the `withCacheSchema` plugin instead.
    - `lockFactory` — use the `withCacheWriteLock` plugin instead.

    **Removed types:**

    - `CacheWriteSettings` — TTL is now passed as an inline `ITimeSpan | null` parameter on `add`, `put`, `getOrAdd`, and related methods.

    **Changed API signatures:**

    - `Cache` constructor no longer accepts `schema` or `lockFactory` settings.
    - `CacheResolver` no longer carries schema or write-lock configuration.
    - `ICache.getOrAdd` now accepts `ttl?: ITimeSpan | null` as its third parameter instead of a `CacheWriteSettings` object.

    ### New Plugin-Based Capabilities

    The following behaviours are no longer built into `Cache` or `CacheResolver`. They are available as opt-in plugins:

    **`withCacheJitter`** — Adds random jitter to TTL values on `add` and `put` operations to help prevent cache stampedes (thundering-herd problems).

    - Configurable via `defaultJitter` (default ±20 %).
    - `WITHOUT` this plugin, TTLs are stored as-is — no jitter is applied.
    - Import path: `@daiso-tech/core/cache/plugins`

    **`withCacheSchema`** — Validates cache values against a `StandardSchemaV1`-compliant schema before storing (`add`, `put`, `update`) and optionally on retrieval (`get`, `getAndRemove`).

    - Controlled via `shouldValidateOutput` (default `true`).
    - `WITHOUT` this plugin, no schema validation occurs — any value type is accepted.
    - Import path: `@daiso-tech/core/cache/plugins`

    **`withCacheWriteLock`** — Acquires a distributed lock via `ILockFactory` before executing mutating cache operations (`add`, `put`, `update`, `increment`, `getAndRemove`, `removeMany`), ensuring concurrent writes to the same cache entry are serialised.

    - The set of protected methods is configurable via `onlyMethods`.
    - `WITHOUT` this plugin, concurrent writes proceed without locking — the adapter's own concurrency guarantees apply.
    - Import path: `@daiso-tech/core/cache/plugins`

    ### How the New Architecture Works

    The `Cache` class has been simplified to a thin wrapper that:

    1. Accepts an `ICacheAdapter` (optionally enhanced by plugins) via `CacheSettings.adapter`.
    2. Delegates every operation (`get`, `add`, `put`, `update`, `increment`, `remove`, `clear`, etc.) directly to the adapter.
    3. No longer performs schema validation, TTL jittering, or write-lock acquisition internally.

    ### Migration

    Users who relied on the previous built-in schema validation, TTL jitter, or write-lock behaviour must now explicitly compose the corresponding plugins.

    | Previous behaviour                      | New requirement                                               |
    | --------------------------------------- | ------------------------------------------------------------- |
    | Schema validation on cache reads/writes | Apply `withCacheSchema({ schema })` to the adapter            |
    | TTL jitter to prevent stampedes         | Apply `withCacheJitter({ defaultJitter })` to the adapter     |
    | Distributed write locking               | Apply `withCacheWriteLock({ lockFactory })` to the adapter    |
    | All three behaviours combined           | Apply all three plugins via `withPlugin(adapter, p1, p2, p3)` |

    **Before (built-in behaviour):**

    ```ts
    const cache = new Cache({ adapter, schema: mySchema });
    ```

    **After (explicit plugin composition):**

    ```ts
    import { withPlugin } from "@daiso-tech/core/middleware";
    import { withCacheSchema } from "@daiso-tech/core/cache/plugins";

    const adapter = withPlugin(
        new MemoryCacheAdapter(),
        withCacheSchema({ schema: mySchema }),
    );
    const cache = new Cache({ adapter });
    ```

    If you do not apply any plugins, the cache behaves as a pure passthrough — no validation, no jitter, no locking. This reduces overhead when these features are not needed.

- 2467757: ## Architectural Shift: Composable EventBus Plugins

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

- 6594c43: ## Simplified Cache Adapter Contract

    The `IDatabaseCacheAdapter`, `IDatabaseCacheTransaction`, and `ICacheData` contracts have been removed in favor of the simpler `ICacheAdapter` contract. This eliminates the transaction-based database abstraction layer, making the cache adapter interface more straightforward.

    ### Motivation

    The `IDatabaseCacheAdapter` contract introduced unnecessary complexity by wrapping all results in `ICacheData` / `ICacheDataExpiration` objects and requiring transaction support. The simpler `ICacheAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

    ### Breaking Changes

    **Removed types:**

    - `IDatabaseCacheAdapter`
    - `IDatabaseCacheTransaction`
    - `ICacheData`
    - `ICacheDataExpiration`

    **Removed test utility:**

    - `databaseCacheAdapterTestSuite` — use `cacheAdapterTestSuite` instead.

    **Refactored adapters:**

    - `KyselyCacheAdapter` now implements `ICacheAdapter` directly instead of `IDatabaseCacheAdapter`.

    ### Migration

    Custom `IDatabaseCacheAdapter` implementations should migrate to `ICacheAdapter`. The new contract expects methods to return primitive values (`TType | null`, `boolean`, `void`) directly instead of wrapping results in `ICacheData` / `ICacheDataExpiration` objects. Use `cacheAdapterTestSuite` instead of `databaseCacheAdapterTestSuite` for testing.

- 1f6cbd6: ## Simplified Lock Adapter Contract

    The `IDatabaseLockAdapter`, `IDatabaseLockTransaction`, and `ILockData` contracts have been removed in favor of the simpler `ILockAdapter` contract. This eliminates the transaction-based database abstraction layer, making the lock adapter interface more straightforward.

    ### Motivation

    The `IDatabaseLockAdapter` contract introduced unnecessary complexity by wrapping results in `ILockData` / `ILockExpirationData` objects and requiring transaction support. The simpler `ILockAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

    ### Breaking Changes

    **Removed types:**

    - `IDatabaseLockAdapter`
    - `IDatabaseLockTransaction`
    - `ILockData`
    - `ILockExpirationData`

    **Removed test utility:**

    - `databaseLockAdapterTestSuite` — use `lockAdapterTestSuite` instead.

    **Removed classes:**

    - `DatabaseLockAdapter` derivable class

    **Refactored adapters:**

    - `KyselyLockAdapter` now implements `ILockAdapter` directly with `acquire`, `release`, `forceRelease`, `refresh`, and `getState` methods.

    ### Migration

    Custom `IDatabaseLockAdapter` implementations should migrate to `ILockAdapter`. The new contract expects methods with the following signatures:

    - `acquire(context, key, lockId, ttl): Promise<boolean>`
    - `release(context, key, lockId): Promise<boolean>`
    - `forceRelease(context, key): Promise<boolean>`
    - `refresh(context, key, lockId, ttl): Promise<boolean>`
    - `getState(context, key): Promise<ILockAdapterState | null>`

    Use `lockAdapterTestSuite` instead of `databaseLockAdapterTestSuite` for testing. Replace custom `DatabaseLockAdapter` subclasses with direct `ILockAdapter` implementations.

- 69c0ddf: ## Simplified Semaphore Adapter Contract

    The `IDatabaseSemaphoreAdapter`, `IDatabaseSemaphoreTransaction`, and related data contracts have been removed in favor of the simpler `ISemaphoreAdapter` contract. This eliminates the transaction-based database abstraction layer, making the semaphore adapter interface more straightforward.

    ### Motivation

    The `IDatabaseSemaphoreAdapter` contract introduced unnecessary complexity by wrapping results in `ISemaphoreData`, `ISemaphoreSlotData`, and `ISemaphoreSlotExpirationData` objects and requiring transaction support. The simpler `ISemaphoreAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

    ### Breaking Changes

    **Removed types:**

    - `IDatabaseSemaphoreAdapter`
    - `IDatabaseSemaphoreTransaction`
    - `ISemaphoreData`
    - `ISemaphoreSlotData`
    - `ISemaphoreSlotExpirationData`

    **Removed test utility:**

    - `databaseSemaphoreAdapterTestSuite` — use `semaphoreAdapterTestSuite` instead.

    **Refactored adapters:**

    - `KyselySemaphoreAdapter` now implements `ISemaphoreAdapter` directly with `acquire`, `release`, `forceReleaseAll`, `refresh`, and `getState` methods.

    ### Migration

    Custom `IDatabaseSemaphoreAdapter` implementations should migrate to `ISemaphoreAdapter`. The new contract expects methods with the following signatures:

    - `acquire(settings: SemaphoreAcquireSettings): Promise<boolean>`
    - `release(context, key, slotId): Promise<boolean>`
    - `forceReleaseAll(context, key): Promise<boolean>`
    - `refresh(context, key, slotId, ttl): Promise<boolean>`
    - `getState(context, key): Promise<ISemaphoreAdapterState | null>`

    Use `semaphoreAdapterTestSuite` instead of `databaseSemaphoreAdapterTestSuite` for testing. Replace custom `IDatabaseSemaphoreAdapter` subclasses with direct `ISemaphoreAdapter` implementations.

- 69c0ddf: ## Simplified Shared Lock Adapter Contract

    The `IDatabaseSharedLockAdapter`, `IDatabaseSharedLockTransaction`, and related data contracts have been removed in favor of the simpler `ISharedLockAdapter` contract. This eliminates the transaction-based database abstraction layer, making the shared-lock adapter interface more straightforward.

    ### Motivation

    The `IDatabaseSharedLockAdapter` contract introduced unnecessary complexity by wrapping results in `IWriterLockData`, `IReaderSemaphoreData`, and related objects, while requiring transaction support. The simpler `ISharedLockAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

    ### Breaking Changes

    **Removed types:**

    - `IDatabaseSharedLockAdapter`
    - `IDatabaseSharedLockTransaction`
    - `IWriterLockData`
    - `IWriterLockExpirationData`
    - `IReaderSemaphoreSlotExpirationData`
    - `IReaderSemaphoreSlotData`
    - `IReaderSemaphoreData`

    **Removed test utility:**

    - `databaseSharedLockAdapterTestSuite` — use `sharedLockAdapterTestSuite` instead.

    **Removed classes:**

    - `DatabaseSharedLockAdapter` derivable class

    **Refactored adapters:**

    - `KyselySharedLockAdapter` now implements `ISharedLockAdapter` directly with `acquireWriter`, `releaseWriter`, `forceReleaseWriter`, `refreshWriter`, `acquireReader`, `releaseReader`, `forceReleaseAllReaders`, `refreshReader`, `forceRelease`, and `getState` methods.

    ### Migration

    Custom `IDatabaseSharedLockAdapter` implementations should migrate to `ISharedLockAdapter`. The new contract expects methods with the following signatures:

    - `acquireWriter(context, key, lockId, ttl): Promise<boolean>`
    - `releaseWriter(context, key, lockId): Promise<boolean>`
    - `forceReleaseWriter(context, key): Promise<boolean>`
    - `refreshWriter(context, key, lockId, ttl): Promise<boolean>`
    - `acquireReader(settings: SharedLockAcquireSettings): Promise<boolean>`
    - `releaseReader(context, key, slotId): Promise<boolean>`
    - `forceReleaseAllReaders(context, key): Promise<boolean>`
    - `refreshReader(context, key, slotId, ttl): Promise<boolean>`
    - `forceRelease(context, key): Promise<boolean>`
    - `getState(context, key): Promise<ISharedLockAdapterState | null>`

    Use `sharedLockAdapterTestSuite` instead of `databaseSharedLockAdapterTestSuite` for testing. Replace custom `DatabaseSharedLockAdapter` subclasses with direct `ISharedLockAdapter` implementations.

- 2e8ee5d: ## Cross-Platform File Storage and Extracted Locking

    The `IFileStorage` contract has been updated to remove Node.js-specific read methods and extract built-in locking into a standalone plugin. The `FileStorage` class now works in non-Node.js environments such as Cloudflare Workers without requiring Node.js compatibility.

    ### Motivation

    The previous `IFileStorage` contract included Node.js-specific methods (`getBuffer`, `getReadable`) that prevented the component from working in edge-runtime environments. Additionally, built-in locking coupled the `FileStorage` class to the lock infrastructure even for users who didn't need it. By extracting locking into a plugin and replacing Node-specific APIs with runtime-agnostic alternatives, the file-storage module is now portable across environments.

    ### Breaking Changes

    **Removed methods from `IFile`:**

    - `IFile.getBuffer` — use `IFile.getBytes` instead (returns `Uint8Array | null`).
    - `IFile.getBufferOrFail` — use `IFile.getBytesOrFail` instead (returns `Uint8Array` or throws).
    - `IFile.getReadable` — use `IFile.getStream` instead (returns a readable stream).
    - `IFile.getReadableOrFail` — use `IFile.getStreamOrFail` instead (returns a readable stream or throws).

    **Removed behaviour:**

    - Built-in locking from the `FileStorage` class — locking is now provided by the standalone `withFileStorageLock` plugin.

    ### New Plugin-Based Capabilities

    **`withFileStorageLock`** — Adds distributed locking to file storage operations.

    - Import path: `@daiso-tech/core/file-storage/plugins`

    ```ts
    import { withPlugin } from "@daiso-tech/core/middleware";
    import { withFileStorageLock } from "@daiso-tech/core/file-storage/plugins";
    import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
    import { MemoryLockFactory } from "@daiso-tech/core/lock/memory-lock-factory";

    const adapter = withPlugin(
        new MemoryFileStorageAdapter(),
        withFileStorageLock({ lockFactory: new MemoryLockFactory() }),
    );
    ```

    ### Migration
    - Replace all calls to `getBuffer(key)` with `getBytes(key)`.
    - Replace all calls to `getBufferOrFail(key)` with `getBytesOrFail(key)`.
    - Replace all calls to `getReadable(key)` with `getStream(key)`.
    - Replace all calls to `getReadableOrFail(key)` with `getStreamOrFail(key)`.
    - If you relied on the built-in locking, apply the `withFileStorageLock` plugin to your file storage adapter as shown above.

- 65e14ba: ## Architectural Shift: Composable `with*Prefix` Plugins

    The built-in namespacing system has been refactored into opt-in `with*Prefix` plugins across all affected components. The `@daiso-tech/core/namespace` module has been removed entirely. Key management is now simplified to plain strings, and prefixing is handled via middleware plugins when needed.

    ### Motivation

    The previous namespace system (`INamespace`, `IKey`, `Namespace` class) added unnecessary complexity for what is fundamentally a string-prefixing concern. Every component had to carry namespace configuration through its settings, and keys were wrapped in `IKey` objects instead of plain strings. This made the API harder to use and increased bundle size for users who didn't need namespacing.

    The new approach removes the namespace abstraction entirely. Key prefixing is now an opt-in `PluginFn` applied directly to the adapter, keeping the core components simple and the API surface clean.

    ### Breaking Changes

    **Removed `@daiso-tech/core/namespace` module:**

    - `INamespace` contract
    - `IKey` interface
    - `Namespace` class
    - `NoOpNamespace` class

    **Removed `namespace` setting** from component constructors:

    - `Cache` — `CacheSettingsBase.namespace`
    - `EventBus` — `EventBusSettingsBase.namespace`
    - `LockFactory` — `LockFactorySettingsBase.namespace`
    - `CircuitBreakerFactory`, `FileStorage`, `RateLimiterFactory`, `SemaphoreFactory`, `SharedLockFactory` — same pattern

    **Simplified key types** across all components:

    - All method parameters changed from `IKey` to `string`
    - `removeMany(keys: Iterable<string>)` changed to `removeMany(keys: Array<string>)`
    - Error classes (`KeyNotFoundCacheError`, `KeyExistsCacheError`, etc.) now accept `string` instead of `IKey`
    - `ILockState.key` changed from `IKey` to `string`

    ### New Plugin-Based Capabilities

    Key prefixing is now opt-in via middleware plugins. Available plugins:

    | Component       | Plugin                     | Import path                                |
    | --------------- | -------------------------- | ------------------------------------------ |
    | cache           | `withCachePrefix`          | `@daiso-tech/core/cache/plugins`           |
    | circuit-breaker | `withCircuitBreakerPrefix` | `@daiso-tech/core/circuit-breaker/plugins` |
    | file-storage    | `withFileStoragePrefix`    | `@daiso-tech/core/file-storage/plugins`    |
    | lock            | `withLockPrefix`           | `@daiso-tech/core/lock/plugins`            |
    | rate-limiter    | `withRateLimiterPrefix`    | `@daiso-tech/core/rate-limiter/plugins`    |
    | semaphore       | `withSemaphorePrefix`      | `@daiso-tech/core/semaphore/plugins`       |
    | shared-lock     | `withSharedLockPrefix`     | `@daiso-tech/core/shared-lock/plugins`     |
    | event-bus       | `withEventBusPrefix`       | `@daiso-tech/core/event-bus/plugins`       |

    ```ts
    import { withPlugin } from "@daiso-tech/core/middleware";
    import { withCachePrefix } from "@daiso-tech/core/cache/plugins";

    const adapter = withPlugin(
        new MemoryCacheAdapter(),
        withCachePrefix("tenant-42:"),
    );

    // Keys are automatically prefixed:
    await adapter.add(context, "my-key", "value");
    // Internally calls adapter.add(context, "tenant-42:my-key", "value")
    ```

    ### How the New Architecture Works

    Instead of passing a `Namespace` instance to the component constructor, prefixing is now applied at the adapter level. The `with*Prefix` plugin intercepts key-related method calls and prepends the configured prefix before forwarding to the underlying adapter. This keeps components adapter-agnostic and makes prefixing composable with other plugins.

    ### Migration

    **If you used `Namespace` directly**, replace with a `with*Prefix` plugin on the adapter:

    ```diff
    -import { Cache, Namespace } from "@daiso-tech/core";
    -
    -const cache = new Cache({
    -    adapter: new MemoryCacheAdapter(),
    -    namespace: new Namespace("my-app"),
    -});
    +import { Cache } from "@daiso-tech/core";
    +import { withPlugin } from "@daiso-tech/core/middleware";
    +import { withCachePrefix } from "@daiso-tech/core/cache/plugins";
    +
    +const adapter = withPlugin(new MemoryCacheAdapter(), withCachePrefix("my-app:"));
    +const cache = new Cache({ adapter });
    ```

    **If you imported `INamespace` or `IKey` types**, update to use plain `string` instead.

    **If you were using `NoOpNamespace`**, simply omit the `namespace` setting (it was the default).

## 0.55.0

### Minor Changes

- 7edaf05: ### Middleware Component Overhaul

    - **Decoupled middleware from execution-context**: The middleware component no longer depends on the `execution-context` component. The `Use` type and `useFactory` implementation have been refactored to remove the `IExecutionContext` dependency — middleware can now receive context via other mechanisms.
    - **Added `WithPlugin` contract and `withPluginFactory`**: Introduced the `WithPlugin` type and `withPluginFactory(enhance)` implementation, which applies one or more plugins (function or object-based) to an object instance, each receiving the instance and an `Enhance` function.

    ### Resilience Middleware Renaming

    All resilience component middleware factories have been renamed from `{name}-middleware-factory` to `with-{name}-factory` for a more consistent and descriptive naming convention:

    - **Cache**: `cacheMiddlewareFactory` → `withCacheFactory`
    - **Circuit Breaker**: `circuitBreakerMiddlewareFactory` → `withCircuitBreakerFactory`
    - **Lock**: `lockMiddlewareFactory` → `withLockFactory`
    - **Rate Limiter**: `rateLimiterMiddlewareFactory` → `withRateLimiterFactory` (detected as rename)
    - **Semaphore**: `semaphoreMiddlewareFactory` → `withSemaphoreFactory`
    - **Shared Lock**: `sharedLockMiddlewareFactory` → `withSharedLockFactory`

    ### Context Dependency Updates

    All resilience components now depend on `IReadableContext` instead of `IExecutionContext`:

    - Cache
    - Circuit Breaker
    - Event Bus
    - File Storage
    - Lock
    - Rate Limiter
    - Semaphore
    - Shared Lock

- 6fcfd1f: ### Middleware system simplification

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
    import {
        useFactory,
        enhanceFactory,
        withPluginFactory,
    } from "@daiso-tech/core/middleware";

    const use = useFactory();
    const enhance = enhanceFactory(use);
    const withPlugin = withPluginFactory(enhance);
    ```

    **After:**

    ```ts
    import { use, enhance, withPlugin } from "@daiso-tech/core/middleware";
    ```

    You cannot rely on `defaultPriority` setting, all middlewares default priorities are `0`.

## 0.54.1

### Patch Changes

- 3377c6d: Updatead README.md file

## 0.54.0

### Minor Changes

- d945731: Add new `HttpRouter` component — a framework-agnostic HTTP router implementing the Winter TC fetch standard.

    Key features:

    - **Winter TC compliant** — Exposes a standard `fetch(request: Request): Response` signature compatible with any runtime (Node.js, Bun, Deno, Cloudflare Workers, etc.)
    - **Typed routing** — Path parameters, optional parameters, wildcards, regex-constrained parameters, and method matching
    - **Route grouping** — Prefix-based route grouping with nesting support
    - **Three middleware layers** — Router-level Winter TC middleware, shared middleware via `router.use()`, and endpoint-specific middleware via `middlewares` builder
    - **Rich request handling** — `HttpReq` with access to JSON body, form data (including file uploads), path/query parameters, headers, cookies, and Standard Schema validation
    - **Fluent response builder** — `HttpRes` with status codes, headers, cookie management (set, remove, check, strip), and helpers for `text()`, `html()`, `json()`, `notFound()`, `redirect()`, `permanentRedirect()`
    - **Winter TC interoperability** — `HttpRouter.fromWinterTcHandler()` static method to adapt Winter TC handlers for use as endpoint handlers, plus `WinterTcMiddlewareFn`, `IWinterTcMiddlewareObject`, and `defineWinterTcMiddleware`
    - **Typed HTTP errors** — `HttpError` class for structured error responses with status codes
    - **File upload support** — `HttpFile` with content access methods (text, bytes, stream, buffer) and file properties
    - **Testing utilities** — `HttpReq.test()` with `TestReqSettings` for creating synthetic requests with mocked params, headers, cookies, and body variants (JSON, URL-encoded, multipart, custom)
    - **Composable architecture** — Built on Hono's router engine (SmartRouter, RegExpRouter, TrieRouter) with support for custom router adapters

## 0.53.0

### Minor Changes

- e7404ad: Introduced new component `@daiso-tech/core/config-accessor`, including the `ConfigAccessor` class and the `IConfigAccessor` contract. This component provides a type-safe way to read domain configuration values by path, with support for optional schema validation and default values.
- 3a8c200: Introduced new component `@daiso-tech/core/env-accessor`, including the `EnvAccessor` class and the `IEnvAccessor` contract. This component provides a type-safe way to read environment variables, with support for required schema validation, default values and multiple sources (e.g you can read from aws secret manager and process.env and merge them together).

## 0.52.3

### Patch Changes

- fbf668e: Update @daiso-tech/execution-context/contracts exports to not use type imports so the executionContext function can be used.

## 0.52.2

### Patch Changes

- b4769e0: Updated website docs start page and README.md file

## 0.52.1

### Patch Changes

- e1f0d97: Updated `enhanceFactory` function to take a `Use` function instance.

## 0.52.0

### Minor Changes

- e0f63c8: Added new middlewares factories:

    - `cacheMiddlewareFactory`
    - `circuitBreakerMiddlewareFactory`
    - `lockMiddlewareFactory`
    - `rateLimiterMiddlewareFactory`
    - `semaphoreMiddlewareFactory`
    - `sharedLockMiddlewareFactory`

- e0f63c8: Added new middleware utility `enhanceFactory` that allows apply middlewares to methods.

    Works with object literal methods:

    ```ts
    import {
        enhanceFactory,
        type MiddlewareFn,
    } from "@daiso-tech/core/middleware";

    const enhance = enhanceFactory();
    function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
        return async ({ next, args }) => {
            const argsAsStr = args.map((arg) => String(arg)).join(", ");
            console.log(`args: ${argsAsStr}`);
            return await next();
        };
    }

    const obj = {
        async hello(name: string): Promise<string> {
            return `Hello world, ${name}`;
        },
    };
    enhance(obj, "hello", [log()]);

    // Will log "args: Jhon"
    await obj.hello("Jhon");
    ```

    Works with instance methods:

    ```ts
    import {
        enhanceFactory,
        type MiddlewareFn,
    } from "@daiso-tech/core/middleware";

    const enhance = enhanceFactory();
    function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
        return async ({ next, args }) => {
            const argsAsStr = args.map((arg) => String(arg)).join(", ");
            console.log(`args: ${argsAsStr}`);
            return await next();
        };
    }

    class Obj {
        async hello(name: string): Promise<string> {
            return `Hello world, ${name}`;
        }
    }
    const obj = new Obj();
    enhance(obj, "hello", [log()]);

    // Will log "args: Jhon"
    await obj.hello("Jhon");
    ```

    Works with static methods:

    ```ts
    import {
        enhanceFactory,
        type MiddlewareFn,
    } from "@daiso-tech/core/middleware";

    const enhance = enhanceFactory();
    function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
        return async ({ next, args }) => {
            const argsAsStr = args.map((arg) => String(arg)).join(", ");
            console.log(`args: ${argsAsStr}`);
            return await next();
        };
    }

    class Obj {
        static async hello(name: string): Promise<string> {
            return `Hello world, ${name}`;
        }
    }
    enhance(Obj, "hello", [log()]);

    // Will log "args: Jhon"
    await Obj.hello("Jhon");
    ```

    Works with prototypes methods:

    ```ts
    import {
        enhanceFactory,
        type MiddlewareFn,
    } from "@daiso-tech/core/middleware";

    const enhance = enhanceFactory();
    function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
        return async ({ next, args }) => {
            const argsAsStr = args.map((arg) => String(arg)).join(", ");
            console.log(`args: ${argsAsStr}`);
            return await next();
        };
    }

    class Obj {
        async hello(name: string): Promise<string> {
            return `Hello world, ${name}`;
        }
    }
    enhance(Obj.prototype, "hello", [log()]);

    const obj = new Obj();

    // Will log "args: Jhon"
    await obj.hello("Jhon");
    ```

- e064850: Now you can passs both `IEventBus` or `IEventBusAdapter` to:

    - `CacheSettingsBase.eventBus`
    - `EventBusSettingsBase.eventBus`
    - `FileStorageSettingsBase.eventBus`
    - `CircuitBreakerFactorySettingsBase.eventBus`
    - `RateLimiterBreakerFactorySettingsBase.eventBus`
    - `LockFactorySettingsBase.eventBus`
    - `SemaphoreFactorySettingsBase.eventBus`
    - `SharedLockFactorySettingsBase.eventBus`

    Reduces boilerplate by eliminating the need to manually initialize an `EventBus` instance.

    Now you also can passs both `ILockFactoryBase`, `ILockAdapter` or `IDatabaseLockAdapter` to:

    - `CacheSettingsBase.lockFactory`
    - `FileStorageSettingsBase.lockFactory`

    Reduces boilerplate by eliminating the need to manually initialize an `LockFactory` instance.

### Patch Changes

- e0f63c8: Added missing package json exports:

    - `"@daiso-tech/core/file-size"`
    - `"@daiso-tech/core/file-storage"`
    - `"@daiso-tech/core/file-storage/contracts"`
    - `"@daiso-tech/core/file-storage/fs-file-storage-adapter"`
    - `"@daiso-tech/core/file-storage/memory-file-storage-adapter"`
    - `"@daiso-tech/core/file-storage/no-op-file-storage-adapter"`
    - `"@daiso-tech/core/file-storage/s3-file-storage-adapter"`
    - `"@daiso-tech/core/shared-lock"`

## 0.51.1

### Patch Changes

- 320fba6: Updated README file

## 0.51.0

### Minor Changes

- 07f2b2a: #### Added ExecutionContext support for managing execution state and context propagation. Includes:

    - `IExecutionContext` contract defining the execution context interface
    - `ExecutionContext` class for managing execution state
    - `AlsExecutionContextAdapter` for AsyncLocalStorage-based context tracking
    - `NoOpExecutionContextAdapter` for environments without context support
    - Context management utilities for tracking execution flow across async operations

- bc1abbe: Now you can listen to multiple events when using event-bus component
- c989553: You can now pass `ILockFactory` to the `FileStorage` class constructor to ensure concurrency safety and data integrity.
- 6ba746b: #### Integrated execution-context with the following adapters:

    - `ICacheAdapter`
    - `IDatabaseCacheAdapter`
    - `ICircuitBreakerAdapter`
    - `ICircuitBreakerStorageAdapter`
    - `IEventBusAdapter`
    - `IFileStorageAdapter`
    - `ISignedFileStorageAdapter`
    - `ILockAdapter`
    - `IDatabaseLockAdapter`
    - `IRateLimiterAdapter`
    - `IRateLimiterStorageAdapter`
    - `ISemaphoreAdapter`
    - `IDatabaseSemaphoreAdapter`
    - `ISharedLockAdapter`
    - `IDatabaseSharedLockAdapter`

    Now all these adapters take instance of `IReadableExecutionContext` as first argument.

    #### Integrated execution-context with following classes:
    - `Cache`
    - `CircuitBreakerFactory`
    - `EventBus`
    - `FileStorage`
    - `LockFactory`
    - `RateLimiterFactory`
    - `SemaphoreFactory`
    - `SharedLockFactory`

    Now you can pass `IExecutionContext` contract via the constructor.

- 3a3df7c: - **Unified Middleware System**: Introduced a new middleware component that replaces the legacy Hooks system. - **Hybrid Support**: Natively handles both synchronous and asynchronous functions within a single interface. - **Execution Context**: Added full support for passing execution context through the middleware chain. - **Priority Management**: Built-in support for defining execution order via priority levels.

    ### Changed
    - **Removed Hooks Component**: The legacy Hooks system has been removed to reduce architectural complexity.
        - **Simplified API**: Removed the need for separate classes for sync and async hooks, significantly reducing boilerplate.
        - **Refined DX**: Replaced the verbose and complex Hooks API with a more ergonomic and streamlined middleware pattern.

- 8ecb340: #### Breaking Changes

    The `Task` class and `ITask` contract have been removed completely. Now native `Promise` is used across following components:

    - cache
    - collection
    - event-bus
    - file-storage
    - rate-limiter
    - circuit-breaker
    - lock
    - semaphore
    - shared-lock

    #### New Features
    - Added a reusable delay utility
    - The following classes support `waitUntil` configuration, facilitating seamless integration with serverless environments like `Vercel`, `Cloudflare`, and `Netlify`:
        - `Cache`
        - `LockFactory`
        - `SemaphoreFactory`
        - `SharedLockFactory`
        - `CircuitBreakerFactory`
        - `RateLimiterFactory`
        - `FileStorage`
        - `EventBus`

### Patch Changes

- 068bdc6: # Summary

    Introduced the `retryInterval` middleware and streamlined the concurrency API by removing legacy blocking methods.

    ## Breaking Changes

    Removed several "blocking" methods across the locking and semaphore contracts. These methods are now redundant, as their behavior can be more flexibly achieved using the new `retryInterval` middleware.

    **Affected Methods:**

    - `ILock`: `acquireBlocking`, `acquireBlockingOrFail`, `runBlockingOrFail`
    - `ISemaphore`: `acquireBlocking`, `acquireBlockingOrFail`, `runBlockingOrFail`
    - `ISharedLock`:
        - Writer: `acquireWriterBlocking`, `acquireWriterBlockingOrFail`, `runWriterBlockingOrFail`
        - Reader: `acquireReaderBlocking`, `acquireReaderBlockingOrFail`, `runReaderBlockingOrFail`

    ## New Features
    - **`retryInterval` Middleware**: A new utility that retries a function call at a specified interval until a defined timeout is reached. This provides a unified way to handle retries across the framework without needing specialized "blocking" variants of every method.

## 0.50.0

### Minor Changes

- 0ec316f: Renamed following contracts and classes:

    - Renamed `ILockProvider` contract to `ILockFactory`
    - Renamed `ILockProviderFactory` contract to `ILockFactoryResolver`
    - Renamed `LockProvider` class to `LockFactory`
    - Renamed `LockProviderFactory` class to `LockFactoryResolver`
    - Renamed `lockProviderTestSuite` function to `lockFactoryTestSuite`
    - Renamed `ISemaphoreProvider` contract to `ISemaphoreFactory`
    - Renamed `ISemaphoreProviderFactory` contract to `ISemaphoreFactoryResolver`
    - Renamed `SemaphoreProvider` class to `SemaphoreFactory`
    - Renamed `SemaphoreProviderFactory` class to `SemaphoreFactoryResolver`
    - Renamed `semaphoreProviderTestSuite` function to `semaphoreFactoryTestSuite`
    - Renamed `ISharedLockProvider` contract to `ISharedLockFactory`
    - Renamed `ISharedLockProviderFactory` contract to `ISharedLockFactoryResolver`
    - Renamed `SharedLockProvider` class to `SharedLockFactory`
    - Renamed `SharedLockProviderFactory` class to `SharedLockFactoryResolver`
    - Renamed `sharedLockProviderTestSuite` function to `sharedLockFactoryTestSuite`
    - Renamed `ICacheFactory` contract to `ICacheResolver`
    - Renamed `CacheFactory` class to `CacheResolver`
    - Renamed `IEventBusFactory` contract to `IEventBusResolver`
    - Renamed `EventBusFactory` class to `EventBusResolver`
    - Renamed `IFileStorageFactory` contract to `IFileStorageResolver`
    - Renamed `FileStorageFactory` class to `FileStorageResolver`
    - Renamed `IFileProvider` contract to `IFileFactory`
    - Renamed `FileProvider` class to `FileFactory`
    - Renamed `ICircuitBreakerProvider` contract to `ICircuitBreakerFactory`
    - Renamed `ICircuitBreakerProviderFactory` contract to `ICircuitBreakerFactoryResolver`
    - Renamed `CircuitBreakerProvider` class to `CircuitBreakerFactory`
    - Renamed `CircuitBreakerProviderFactory` class to `CircuitBreakerFactoryResolver`
    - Renamed `DatabaseCircuitBreakerProviderFactory` class to `DatabaseCircuitBreakerFactoryResolver`
    - Renamed `IRateLimiterProvider` contract to `IRateLimiterFactory`
    - Renamed `IRateLimiterProviderFactory` contract to `IRateLimiterFactoryResolver`
    - Renamed `RateLimiterProvider` class to `RateLimiterFactory`
    - Renamed `RateLimiterProviderFactory` class to `RateLimiterFactoryResolver`
    - Renamed `DatabaseRateLimiterProviderFactory` class to `DatabaseRateLimiterFactoryResolver`

## 0.49.1

### Patch Changes

- b44bb9f: Updated readme

## 0.49.0

### Minor Changes

- 7db431a: Updated `IKey` to extend `IEquals` to support key comparison for `INamespace`.
- 7db431a: Introduced a new contract `IReadableCache` which allows only reading from the cache.
- 7db431a: Added new FileStorage component.
- 7db431a: Updated following contracts `IRateLimiter`, `ICircuitBreaker`, `ILock`, `ISemaphore`, and `ISharedLock`. Their `key` field has been updated from a `string` to the more specific `IKey` contract.

## 0.48.5

### Patch Changes

- a32ca36: Updated package.json to point to new website

## 0.48.4

### Patch Changes

- 7742543: Updated readme

## 0.48.3

### Patch Changes

- 6fbbea5: Updated README file and docs url

## 0.48.2

### Patch Changes

- 9a8421e: Updated docs

## 0.48.1

### Patch Changes

- a7ae31c: Updated `ICollection` contract to `IterableValue` type instead of `Iterable` type.

## 0.48.0

### Minor Changes

- 313375a: The method for listening to events dispatched by various components, such as the cache, has changed.

    Before update:

    ```ts
    import { ICache, CACHE_EVENTS.FOUND } from "@daiso-tech/core/cache/contracts";

    declare const cache: ICache

    await cache.addListener(CACHE_EVENTS.FOUND, event => {
        console.log(event);
    })
    ```

    After update:

    ```ts
    import { ICache, CACHE_EVENTS.FOUND } from "@daiso-tech/core/cache/contracts";

    declare const cache: ICache

    await cache.events.addListener(CACHE_EVENTS.FOUND, event => {
        console.log(event);
    })
    ```

## 0.47.0

### Minor Changes

- 4f3a8c1: Added new setting to `KyselyRateLimiterStorageAdapter`, `KyselyCircuitBreakerStorageAdapter`, `KyselyLockAdapter`, `KyselySemaphoreAdapter` and `KyselySharedLockAdapter`that allows for disabling transactions.
- 49c470c: Added new setting to all `MongodbRateLimiterStorageAdapter` and `MongodbCircuitBreakerStorageAdapter` that allows for disabling transactions.

## 0.46.0

### Minor Changes

- f1eb8eb: Updated and simplified the `IDatabaseCacheAdapter` contract.

### Patch Changes

- f1eb8eb: Fixed a bug where MongoDB was imported from an incorrect file, causing a 'module not found' error.

## 0.45.0

### Minor Changes

- 58ed80b: Added `INamespace` contract and `NoOpNamespace` class for disabling namespacing
- bce1f55: Update `Namespace` class to be serializable.
- c0e55b3: Now `RateLimiter` objects created by `RateLimiterProvider` class is serializable and deserializable
- e690f13: Added a new static method, `TimeSpan.fromStr`, which parses a time-formatted string to create a new `TimeSpan` instance.

    Example:

    ```ts
    import { TimeSpan } from "@daiso-tech/core/time-span";

    TimeSpan.fromStr("5s");
    ```

## 0.44.0

### Minor Changes

- fd9f21d: Added a new rate-limiter component

### Patch Changes

- 670763b: Updated `RedisCircuitBreakerAdapterSettings`:

    before:

    ```ts
    export type RedisCircuitBreakerAdapterSettings = {
        database: Redis;

        backoff?: BackoffSettingsEnum;

        policy?: CircuitBreakerPolicySettingsEnum;
    };
    ```

    now:

    ```ts
    export type RedisCircuitBreakerAdapterSettings = {
        database: Redis;

        backoffPolicy?: BackoffSettingsEnum;

        circuitBreakerPolicy?: CircuitBreakerPolicySettingsEnum;
    };
    ```

## 0.43.2

### Patch Changes

- 48d0b06: Update ci-cd release.yaml workflow
- 8db5b00: Updated relase.yaml file
- 32bab22: Update gh actions relase.yaml

## 0.43.1

### Patch Changes

- 76d6295: Updated documentation

## 0.43.0

### Minor Changes

- 2e300d5: Updated the backoff policies so the jitter can be disabled by passing null as value.
- 512063a: You can now pass in `boolean`, `Task<boolean>`, `Invokable<[], Promiseable<boolean>>` to the `pipeWhen` method of an `Task` and `AsyncHooks`.
- 3caa433: Added new methods to `ICache` contract:

    - `addOrFail` same as the `add` method but throws an error if key already exists
    - `updateOrFail` same as `update` method but throws an error if key is not found
    - `incrementOrFail` same as `increment` method but throws an error if key is not found
    - `decrementOrFail` same as `decrement` method but throws an error if key is not found
    - `removeOrFail` same as `remove` method but throws an error if key is not found

    Seperated `WrittenCacheEvent` to multiple events:

    - `AddedCacheEvent`
    - `UpdatedCacheEvent`
    - `RemovedCacheEvent`
    - `IncrementedCacheEvent`
    - `DecrementedCacheEvent`

    Removed `TypeCollectionError` of the Collection component.

- d58a233: Removed runReader, runReaderBlock, runWriter and runWriterBlocking from ISharedLock contract
- fa85e84: Added rate limiter component
- a944e5f: Added new event bus adapter contracts:

    - `IEventBusDispatcherAdapter`
    - `IEventBusListenableAdapter`

- f90e497: Now you can pass an array of Error classes as error policy.
- d58a233: Removed run and runBlocking methods from ISemaphore contract
- d58a233: Removed run and runBlocking methods from ILock contract
- a944e5f: Renamed `IEventBus.asPromise` to `IEventBus.asTask`
- 30cbe23: Update ICollection, IAsyncCollection, ListCollection, IterableCollection and AsyncIterableCollection to work with ArrayLike types.

    **Feature**: Enhance collection interfaces/classes to support `ArrayLike` types.

    **Details**: Updates `ICollection`, `IAsyncCollection`, `ListCollection` contracats and `IterableCollection`, `AsyncIterableCollection` classes to correctly handle `ArrayLike` inputs, improving interoperability.

- 16be35d: Added new circuit-breaker component
- d58a233: Removed Result type
- b0cf7e8: Added new `ITask` contract
- b7a4d46: Renamed backoff policies to not use the "Policy" as suffix.

## 0.42.0

### Minor Changes

- 12de151: Updated the import paths of all adapters. Refer to [documentation](https://daiso-core.vercel.app/).

## 0.41.1

### Patch Changes

- cd19230: Updated the readme file

## 0.41.0

### Minor Changes

- fcbfd0c: Updated `RedisPubSubEventBusAdapterSettings` type. The previous fields, `dispatcherClient` and `listenerClient`, have been removed. You'll now use a single field, client, which handles both dispatching and listening.
- 3e47a49: Moved `Hooks` and `AsyncHooks` classes to their own module.
  Now you import `Hooks` and `AsyncHooks` class from `"@daiso-tech/core/hooks"`.
- d4cd60b: Update the `IDatabaseLockAdapter` contract.

    before:

    ```ts
    export type IDatabaseLockAdapter = {
        insert(
            key: string,
            owner: string,
            expiration: Date | null,
        ): Promise<void>;

        updateIfExpired(
            key: string,
            owner: string,
            expiration: Date | null,
        ): Promise<number>;

        remove(key: string): Promise<ILockExpirationData | null>;

        removeIfOwner(key: string, owner: string): Promise<ILockData | null>;

        updateExpirationIfOwner(
            key: string,
            owner: string,
            expiration: Date,
        ): Promise<number>;

        find(key: string): Promise<ILockData | null>;
    };
    ```

    after:

    ```ts
    export type IDatabaseLockAdapter = {
        transaction<TReturn>(
            fn: InvokableFn<
                [transaction: IDatabaseLockTransaction],
                Promise<TReturn>
            >,
        ): Promise<TReturn>;

        remove(key: string): Promise<ILockExpirationData | null>;

        removeIfOwner(key: string, lockId: string): Promise<ILockData | null>;

        updateExpiration(
            key: string,
            lockId: string,
            expiration: Date,
        ): Promise<number>;

        find(key: string): Promise<ILockData | null>;
    };
    ```

- 974f5e3: ## Feature: Introducing `ITimeSpan` Contract for Flexible Time Handling ⏱️

    A new contract, `ITimeSpan`, has been introduced:

    ```ts
    export const TO_MILLISECONDS = Symbol("TO_MILLISECONDS");

    export type ITimeSpan = {
        /**
         * Converts the time span to its total duration in milliseconds.
         */
        [TO_MILLISECONDS](): number;
    };
    ```

    By replacing the concrete `TimeSpan` class with this interface, we achieve greater flexibility and interoperability. This makes it easy for developers to use external time libraries (e.g., `Luxon`) by simply implementing `ITimeSpan` on their duration objects.

- d4cd60b: Updated `LockProviderCreateSettings` type.

    before:

    ```ts
    export type LockProviderCreateSettings = {
        ttl?: TimeSpan | null;

        owner?: OneOrMore<string>;
    };
    ```

    after:

    ```ts
    export type LockProviderCreateSettings = {
        ttl?: TimeSpan | null;

        lockId?: string;
    };
    ```

- d4cd60b: Updated `ILock` contract.

    - Removed the method `getRemainingTime`.
    - Removed the method `getOwner`.
    - Removed the method `isExpired`.
    - Removed the method `isLocked`.
    - Added `getState` method that replaces the following methods `getRemainingTime`, `getOwner`, `isExpired` and `isLocked`.
    - Added `key` readonly field that returns the lock instance key.
    - Added `id` readonly field that returns the lock instance id.
    - Added `ttl` readonly field that returns the lock instance ttl.
    - The `refreshOrFail` now only throws one error, it throws `FailedRefreshLockError`

- 9d85f6c: - Renamed constant variable `ASYNC_ERRORS` to `RESILIENCE_ERRORS`.

    - Removed base `ResilienceError` class.
    - Removed `bulkhead` middleware.
    - Removed `sequentialHedging` and `concurrentHedging` middlewares.
    - Removed resilience error hierarchy.

- eb98bd2: - Added new contract `IComparable`, `IGreaterThan`, `IGreaterThanOrEquals`, `ILessThan` and `ILessThanOrEquals` which are used for comparing objects.

    - Updated `TimeSpan` class so it implements the `IComparable` contract.

- 93c3c3a: Added new default namespaces for the following components:

    - `Cache`
    - `CacheFactory`
    - `EventBus`
    - `EventBusFactory`
    - `LockProvider`
    - `LockFactory`

    Now you can use following constant variables:

    - ```ts
      const DEFAULT_CACHE_NAMESPACE = new Namespace("@cache");
      ```
    - ```ts
      const DEFAULT_EVENT_BUS_NAMESPACE = new Namespace("@event-bus");
      ```
    - ```ts
      const DEFAULT_LOCK_PROVIDER_NAMESPACE = new Namespace("@lock-provider");
      ```

- d4cd60b: Updated LockProviderFactory class.

    - Renamed `setCreateOwnerId` to `setCreateLockId`.

- d4cd60b: Updated and removed some lock events.

    - Renamed error `KeyAlreadyAcquiredLockError` to `FailedAcquireLockError`.
    - Renamed error `UnownedReleaseLockError` to `FailedReleaseLockError`.
    - Renamed error `UnownedRefreshLockError` to `FailedRefreshLockError`.

- eb98bd2: Update `TimeSpan` class `fromDateRange` method arguments. Now it only takes on required argument which is an object of type `TimeSpanFromDateRangeSettings`.

    ````ts
    export type TimeSpanFromDateRangeSettings = {
        /**
         * @default
         * ```ts
         * new Date()
         * ```
         */
        start?: Date;

        /**
         * @default
         * ```ts
         * new Date()
         * ```
         */
        end?: Date;
    };
    ````

- d4cd60b: Renamed, updated and removed some lock events.

    - Renamed event `UnownedReleaseTryLockEvent` to `FailedReleaseLockEvent`.
    - Renamed event `UnownedRefreshTryLockEvent` to `FailedRefreshLockEvent`.
    - Removed event `UnexpireableKeyRefreshTryLockEvent`.
    - Renamed `owner` field to `lockId`.
    - Now in all events you can access the lock state.

- 9cfd9ea: Changed the `NamespaceSettings` type:

    before:

    ```ts
    export type NamespaceSettings = {
        identifierDelimeter?: string;

        keyDelimeter?: string;

        rootIdentifier?: string;
    };
    ```

    after:

    ```ts
    /**
     *
     * IMPORT_PATH: `"@daiso-tech/core/utilities"`
     * @group Namespace
     */
    export type NamespaceSettings = {
        delimeter?: string;

        rootIdentifier?: string;
    };
    ```

- d4cd60b: Update the `ILockAdapter` contract.

    before:

    ```ts
    export type ILockAdapter = {
        acquire(
            key: string,
            owner: string,
            ttl: TimeSpan | null,
        ): Promise<boolean>;

        release(key: string, owner: string): Promise<boolean>;

        forceRelease(key: string): Promise<boolean>;

        refresh(
            key: string,
            owner: string,
            ttl: TimeSpan,
        ): Promise<LockRefreshResult>;
    };
    ```

    after:

    ```ts
    export type ILockAdapter = {
        acquire(
            key: string,
            lockId: string,
            ttl: TimeSpan | null,
        ): Promise<boolean>;

        release(key: string, lockId: string): Promise<boolean>;

        forceRelease(key: string): Promise<boolean>;

        refresh(key: string, lockId: string, ttl: TimeSpan): Promise<boolean>;

        getState(key: string): Promise<ILockAdapterState | null>;
    };
    ```

- 24228e2: Added shared lock component (a.k.a reader writer lock).
- 48df7f5: Moved `Namespace` class to it's own module. The `Namespace` class have been simplified to be used publicly.
  Now you import `Namespace` class from `"@daiso-tech/core/namespace"`.
- 974f5e3: Moved `TimeSpan` class and `ITimeSpan` contract to their own module.
  Now you import `TimeSpan` class from `"@daiso-tech/core/time-span"`.
  Now you import `ITimeSpan` contract from `"@daiso-tech/core/time-span/contracts"`.
- 2ce4a7b: Enforced versioning in `IFlexibleSerde` contract and `Serde` class to support future format changes in serialized data.
- 4ce80a4: Updated `ICacheBase` contract to not use `OneOrMore` types as keys meaning you cannot pass in an iterable of string as a key.

    `ICacheBase` contract before:

    ```ts
    export type ICacheBase<TType = unknown> = {
        exists(key: OneOrMore<string>): LazyPromise<boolean>;

        missing(key: OneOrMore<string>): LazyPromise<boolean>;

        get(key: OneOrMore<string>): LazyPromise<TType | null>;

        getOrFail(key: OneOrMore<string>): LazyPromise<TType>;

        getAndRemove(key: OneOrMore<string>): LazyPromise<TType | null>;

        getOr(
            key: OneOrMore<string>,
            defaultValue: AsyncLazyable<NoneFunc<TType>>,
        ): LazyPromise<TType>;

        getOrAdd(
            key: OneOrMore<string>,
            valueToAdd: AsyncLazyable<NoneFunc<TType>>,
            ttl?: ITimeSpan | null,
        ): LazyPromise<TType>;

        add(
            key: OneOrMore<string>,
            value: TType,
            ttl?: ITimeSpan | null,
        ): LazyPromise<boolean>;

        put(
            key: OneOrMore<string>,
            value: TType,
            ttl?: ITimeSpan | null,
        ): LazyPromise<boolean>;

        update(key: OneOrMore<string>, value: TType): LazyPromise<boolean>;

        increment(
            key: OneOrMore<string>,
            value?: Extract<TType, number>,
        ): LazyPromise<boolean>;

        decrement(
            key: OneOrMore<string>,
            value?: Extract<TType, number>,
        ): LazyPromise<boolean>;

        remove(key: OneOrMore<string>): LazyPromise<boolean>;

        removeMany(keys: Iterable<OneOrMore<string>>): LazyPromise<boolean>;

        clear(): LazyPromise<void>;
    };
    ```

    `ICacheBase` contract after:

    ```ts
    export type ICacheBase<TType = unknown> = {
        exists(key: string): LazyPromise<boolean>;

        missing(key: string): LazyPromise<boolean>;

        get(key: string): LazyPromise<TType | null>;

        getOrFail(key: string): LazyPromise<TType>;

        getAndRemove(key: string): LazyPromise<TType | null>;

        getOr(
            key: string,
            defaultValue: AsyncLazyable<NoneFunc<TType>>,
        ): LazyPromise<TType>;

        getOrAdd(
            key: string,
            valueToAdd: AsyncLazyable<NoneFunc<TType>>,
            ttl?: ITimeSpan | null,
        ): LazyPromise<TType>;

        add(
            key: string,
            value: TType,
            ttl?: ITimeSpan | null,
        ): LazyPromise<boolean>;

        put(
            key: string,
            value: TType,
            ttl?: ITimeSpan | null,
        ): LazyPromise<boolean>;

        update(key: string, value: TType): LazyPromise<boolean>;

        increment(
            key: string,
            value?: Extract<TType, number>,
        ): LazyPromise<boolean>;

        decrement(
            key: string,
            value?: Extract<TType, number>,
        ): LazyPromise<boolean>;

        remove(key: string): LazyPromise<boolean>;

        removeMany(keys: Iterable<string>): LazyPromise<boolean>;

        clear(): LazyPromise<void>;
    };
    ```

- 3cb44fb: Removed `lazyPromiseFactory` setting field from following types:

    - `CacheSettingsBase`
    - `CacheFactorySettings`
    - `EventBusSettingsBase`
    - `EventBusFactorySettings`
    - `LockProviderSettingsBase`
    - `LockProviderFactorySettings`
    - `AsyncIterableCollectionSettings`

- 69ab9fc: Added semaphore component.

### Patch Changes

- 69ab9fc: Updated bug with `KyselyCacheAdapter`, now when the `detInit` method is called it will remove the interval timer.
- 69ab9fc: Updated bug with `KyselyLockAdapter`, now when the `detInit` method is called it will remove the interval timer.
- 4a83f7e: Fixed: `SuperJsonSerdeAdapter` no longer replaces an existing `ISerdeTransformerAdapter` when registerCustom is called with a duplicate name.

## 0.40.0

### Minor Changes

- 99e8913: Simplified `ILockAdapter` methods, now they return `Promise` instead of `PromiseLike`. Also updated `forceRelease` and `refresh` methods:
    - `forceRelease` method returns true if the lock was released or false if the lock doesnt exists.
    - `forceRelease` method returns `LockRefreshResult` enum instead of `boolean`.
- 99e8913: Updated `IDatabaseLockAdapter` contract.

    Before update:

    ```ts
    export type ILockData = {
        owner: string;
        expiration: Date | null;
    };

    export type IDatabaseLockAdapter = {
        insert(
            key: string,
            owner: string,
            expiration: Date | null,
        ): PromiseLike<void>;

        update(
            key: string,
            owner: string,
            expiration: Date | null,
        ): PromiseLike<number>;

        remove(key: string, owner: string | null): PromiseLike<void>;

        refresh(
            key: string,
            owner: string,
            expiration: Date,
        ): PromiseLike<number>;

        find(key: string): PromiseLike<ILockData | null>;
    };
    ```

    After update:

    ```ts
    export type ILockExpirationData = {
        expiration: Date | null;
    };

    export type ILockData = ILockExpirationData & {
        owner: string;
    };

    export type IDatabaseLockAdapter = {
        insert(
            key: string,
            owner: string,
            expiration: Date | null,
        ): Promise<void>;

        updateIfExpired(
            key: string,
            owner: string,
            expiration: Date | null,
        ): Promise<number>;

        remove(key: string): Promise<ILockExpirationData | null>;

        removeIfOwner(key: string, owner: string): Promise<ILockData | null>;

        updateExpirationIfOwner(
            key: string,
            owner: string,
            expiration: Date,
        ): Promise<number>;

        find(key: string): Promise<ILockData | null>;
    };
    ```

- 85d0b53: Simplified the `IEventBusAdapter` it now uses `Promises` intead of `PromiseLike`
- 99e8913: Updated `ILock` contract, now `forceRelease` method returns `true` when if the lock was released or `false` if the lock doesnt exists.
- 9b004d2: Simplified `ICacheAdapter` and `IDatabaseCacheAdapter`, now they return `Promise` instead of `PromiseLike`
- 99e8913: Updated `IPrunable`, `IDeinitizable`, and `IInitizable` contracts, they now use Promises instead of PromiseLike

## 0.39.0

### Minor Changes

- 7d25a1f: Removed `UnexpectedLockError`, `UnexpectedCollectionError`, `UnexpectedCacheError`, `registerLockErrorsToSerde`, `registerCahceErrorsToSerde`, `registerCollectionErrorsToSerde`, removed `EventBusError` and `UnexpectedEventBusError`

### Patch Changes

- 4a8b68f: Made the internal types, KyselyLockAdapterTable, KyselyLockAdapterTables, KyselyCacheAdapterTable, KyselyCacheAdapterTables, KyselyCacheAdapterSettings, MongodbLockDocument and MongodbCacheDocument public.
- aea3c29: Updated documentation
- 4a8b68f: KyselyCacheAdapter now performs cleanup periodically instead of once.
- 4a8b68f: KyselyCacheAdapter now performs cleanup periodically instead of once.
- 9a1e697: Updated the docs

## 0.38.0

### Minor Changes

- 279becc: Update `HedgingSettings.waitTime` field. Instead you can now pass in a middlewares that wrap the primary function and fallback function.
- 90340f9: Now the `fallback` middleware works with `Result` type, meaning the middleware will add a fallback value when the function returns a failed `Result`.
- 32f0a88: Changed the result type to be object instead of an array
- 90340f9: The `observe` middleware works now with `Result` type. This means the middleware will call the `onError` callback when the function returns a failed `Result`.
- 90340f9: Removed `RetryAsyncError`. Now the `retry` middleware will throw the last error.
- 279becc: Removed `concurrentHedging` middleware because it was buggy and unreliable.
- 90340f9: Now the `retry` middleware works with `Result` type, meaning the middleware will retry when the function returns a failed `Result`.
- 90340f9: The `ErrorPolicy` type has been updated and now you can pass a class. The `ErrorPolicy` will verify whether the error is an instance of that class.
- 8608081: Now `ErrorPolicy` can handle return values that are false boolean values.
- ba6907b: Removed the following `EventBus` errors:

    - `UnableToRemoveListenerEventBusError`
    - `UnableToAddListenerEventBusError`
    - `UnableToDispatchEventBusError`

    `EventBus` errors obscures unexpected errors originating from the underlying client, making it harder to identify the root cause.

- ba6907b: Removed the following `LockProvider` errors:

    - `UnableToReleaseLockError`
    - `UnableToAquireLockError`

    `LockProvider` errors obscures unexpected errors originating from the underlying client, making it harder to identify the root cause.

## 0.37.3

### Patch Changes

- 3ca15f1: Updated package.json

## 0.37.2

### Patch Changes

- 8cbf371: Updated package.json

## 0.37.1

### Patch Changes

- 4137d8c: Updated the docs

## 0.37.0

### Minor Changes

- bd9e529: ---

    ## "@daiso-tech/core": minor

    `LibsqlLockAdapter` and `SqliteLockAdapter` have been removed. Use `KyselyLockAdapter` instead. It supports `postgres`, `mysql`, and `sqlite` (including derived databases) via `kysely`.

- bd9e529: `LibsqlCacheAdapter` and `SqliteCacheAdapter` have been removed. Use `KyselyCacheAdapter` instead. It supports `postgres`, `mysql`, and `sqlite` (including derived databases) via `kysely`.
- 2cb3dd2: Added [standard schema](https://standardschema.dev/) integration with following components:

    - `Collection` and `AsyncCollection` components can now use [standard schema](https://standardschema.dev/) object filter all items match the schema and thereafter transform the matched items.
    - `Cache` component can now use [standard schema](https://standardschema.dev/) object to validate all input and output data.
    - `EventBus` component can now use [standard schema](https://standardschema.dev/) object to validate all input and output data.
    - `fallback` middleware can now use [standard schema](https://standardschema.dev/) as error policy.
    - `retry` middleware can now use [standard schema](https://standardschema.dev/) as error policy.

## 0.36.0

### Minor Changes

- 3ca9190: Renamed `FallbackSettings.fallbackPolicy` to `FallbackSettings.errorPolicy`
- 3ca9190: - Removed the following types:

                                                                                                                                      - `AsyncFactoryable`
                                                                                                                                      - `Factoryable`

    - Updated remaining factory types to use the new `InvokableFn` and `InvokableObject` contracts:
        - Synchronous factories:
            - `FactoryFn`
            - `IFactoryObject`
            - `Factory`
        - Asynchronous factories:
            - `AsyncFactoryFn`
            - `IAsyncFactoryObject`
            - `AsyncFactory`

    This change simplifies the type hierarchy and ensures consistent behavior between factory and invokable patterns.

- 3ca9190: Renamed `IAsyncCollection.values` method `IAsyncCollection.copy`
- 3ca9190: Renamed `ICollection.values` method `ICollection.copy`
- 3ca9190: Made `LockProviderSettingsBase.namespace` optional by using default value
- 3ca9190: Made `CacheSettingsBase.namespace` optional by using default value
- 3ca9190: Renamed `RetrySettings.retryPolicy` to `RetrySettings.errorPolicy`
- 47f061a: Renamed the `KeyPrefixer` class to `Namespace`.
  Renamed the `CacheSettingsBase.keyPrefixer` setting to `CacheSettingsBase.namespace`.
  Renamed the `EvebtBusSettingsBase.keyPrefixer` setting to `EvebtBusSettingsBase.namespace`.
  Renamed the `LockProviderSettingsBase.keyPrefixer` setting to `LockProviderSettingsBase.namespace`.
- 3ca9190: Added new methods to the `Namespace` class:

    - `setIdentifierDelimeter` method: allows for overriding `NamespaceSettings.identifierDelimeter`
    - `setKeyDelimeter` method: allows for overriding `NamespaceSettings.keyDelimeter`
    - `setRootIdentifier` method: allows for overriding `NamespaceSettings.rootIdentifier`
    - `appendRoot` method: allows for appending to `InternalNamespace` class constructor argument `_rootPrefix`

- 3ca9190: Added new types `ResultFailure` and `ResultSuccess`.
- 3ca9190: Made `CacheSettingsBase.namespace` optional by using default value

### Patch Changes

- cc0d9e9: Fixed a serialization issue in the Lock class where using multiple adapters caused improper serialization and deserialization. The Lock now correctly serializes and deserializes across all supported adapters.
- d2f36f2: Added documentation website

## 0.35.4

### Patch Changes

- 9747f8d: Renamed `FoundCacheEventt` type to `FoundCacheEvent`.

## 0.35.3

### Patch Changes

- 9a127d2: Updated documentation

## 0.35.2

### Patch Changes

- a3223f5: docs/async-hooks
- a3223f5: Updated docs of `AsyncHooks` and `Hooks` classes.

## 0.35.1

### Patch Changes

- b7438c6: Updated `concurentHedging middleware to abort promises by AbortSignal`

## 0.35.0

### Minor Changes

- a2c56f4: Added a new `sequentialHedging` middleware that executes the primary function and all fallback functions sequentially.
  It returns the result of the first successful function and automatically cancels all remaining function.
  If all function fail than error is thrown.
- a2c56f4: Updated the settings of `dynamic`, `fallback`, `hedging`, `observe`, `retry`, and `timeout` middlewares.
- a2c56f4: Updated the `AsyncHook` class to accept an `AbortSignalBinder` parameter. This enables binding an `AbortSignal` to the middleware for two-way abortion control.
  The `AsyncHook` know exposes function name to the middleware function which is useful for logging.
- f604f53: Simplified the `IEventBus` contract to use event map instead of classes for events. The following classes / contracts are effected:
    - `ILockProvider` contract and `LockProvider` class.
    - `ICache` contract and `Cache` class.
    - `IFlexibleSerde` contract and `Serde` class.
        - The `registerEvent` method is not needed longer and thereby is removed.
- f604f53: Renamed the cache events.
- a2c56f4: Updated `Hook` class. It know exposes function name to the middleware function which can is useful for logging.
- a2c56f4: Added new `bulkhead` middleware to limit concurrent execution of `PromiseLike` objects to a specified maximum.
- f604f53: Renamed the lock events.
- a2c56f4: Added a new `concurrentHedging` middleware executes the primary function and all fallback functions concurrently.
  It returns the result of the first successful function and automatically aborts all remaining functions.
  If all function fail than error is thrown.

## 0.34.0

### Minor Changes

- 7e5a059: Added new utility `Hooks` class which allows for adding middlewares to any sync functions.
- 96e2f95: Removed `delay`, `takeUntilAbort` `takeUntilTimeout` from `IAsyncCollection` contract.
- 96e2f95: Following methods where removed from `LazyPromise`:

    - `setAbortSignal`
    - `setTotalTimeout`
    - `setRetryTimeout`
    - `setRetryPolicy`
    - `setRetryAttempts`
    - `setBackofPolicy`

    The new approach allows you to apply `AsyncMiddleware` to `LazyPromise` by the `pipe` and `pipeWhen` methods. This change promotes a more composable and extendable design while reducing API surface area.

- f8a6439: Added following middlewares:
    - `dynamic`: Enables runtime configuration of other middlewares for flexible behavior adjustments.
    - `fallback`: Provides a default value or fallback mechanism when an error occurs.
    - `retry`: Automatically retries failed operations with customizable retry policies.
    - `timeout`: Ensures functions terminate after a specified duration to prevent hanging.
    - `observe`: Monitors async functions, tracking success/failure states for logging or analytics.
- 7e5a059: Added new utility `AsyncHooks` class which allows for adding middlewares to any sync and async functions.

### Patch Changes

- ea8aff2: Enhanced performance of `crossJoin` method in the following collection classes:
    - `ListCollection`
    - `IterableCollection`
    - `AsyncIterableCollection`

## 0.33.0

### Minor Changes

- afba80e: Changed `ILock` contract to not extend `IEventListenable` contract. Meaning you can't add listeners to a specific `ILock`. This feature was unnecessary.
- 73973ef: Removed `addListenerMany`, `removeListenerMany`, `subscribeMany`, and `dispatchMany` from `IEventBus` contract because they where unnecessary.
- d223f07: Removed `IGroupableEventBus` contract and remove `getGroup` method from `IEventBus` meaning you cant longer use `withGroup` and `getGroup` methods of the `EventBus`class. This feature was not flexible.
- 2ae41e0: Changed `Cache` class so it cannot take adapter factory. This feature was not flexible and unnecessary.
- 653a224: Removed `IGroupableLockProvider` contract and remove `getGroup` method from `ILockProvider` meaning you cant longer use `withGroup` and `getGroup` methods of the `LockProvider`class. This feature was not flexible.
- de018b1: Changed `EventBus` class so it cannot take adapter factory. This feature was not flexible and unnecessary.
- f54390c: Removed the `group` field from all `ICache` events.
- ab20280: Removed `IGroupableCache` contract and remove `getGroup` method from `ICache` meaning you cant longer use `withGroup` and `getGroup` methods of the `Cache`class. This feature was not flexible.
- 75a0999: Changed `LockProvider` class so it cannot take adapter factory. This feature was not flexible and unnecessary.

## 0.32.1

### Patch Changes

- 7b77989: Updated documentation.

## 0.32.0

### Minor Changes

- d66438f: Addded new static method to <i>LazyPromise</i> class:
    - The <i>fromCallback</i> method is a convenient utility for wrapping Node.js-style callback functions into a <i>LazyPromise</i>.
- d66438f: Removed <i>onError</i>, <i>onSuccess</i>, and <i>onFinally</i> from <i>LazyPromise</i>. Added <i>addListener</i> and <i>removeListener</i> instead, making it easier to track and handle all states of a <i>LazyPromise</i> which is useful for observability.
- d66438f: Removed <i>LazyPromiseSettings</i> from the follwing classes:

    - Cache
    - CacheFactory
    - LockProvider
    - LockProviderFactory
    - EventBus
    - EventBusFactory
    - AsyncIterableCollection

    Instead, you now pass a <i>lazyPromiseFactory</i> settings field to configure <i>LazyPromise</i> defaults for these classes.

## 0.31.1

### Patch Changes

- 1747137: Improved docs

## 0.31.0

### Minor Changes

- a897a71: Updated the <i>LazyPromise</i> <i>wrapFn</i> method to support <i>Invokable</i> tyeps as an argument

### Patch Changes

- a897a71: Fixed a typing bug in the static <i>LazyPromise</i> wrap method.

## 0.30.0

### Minor Changes

- 45bc897: Updated <i>ICollection</i> and <i>IAsyncCollection</i> to support <i>Invokable</i> types, for example allowing <i>IInvokableObject</i> instances as predicates.

## 0.29.0

### Minor Changes

- c4058ae: Added <i>subscribeOnce</i> method to the <i>IEventBus</i> contract. It works like <i>listenOnce</i> but returns an <i>unsubscribe</i> function for easier management.

### Patch Changes

- c4058ae: Fixed a bug in the <i>EventBus</i> class's <i>listenOnce</i> method: listener can now be removed before their first trigger.
- 501e19c: Fixed major bug with package.json exports field

## 0.28.1

### Patch Changes

- d597727: Fixed a bug in <i>LockProvider</i> where using two <i>ILockAdapter<i> instances with the same name caused ILock serialization/deserialization issues. Now, you can pass in unique prefix to <i>LockProvider</i> to differentiate them.

## 0.28.0

### Minor Changes

- f7c33fb: Added new <i>ICacheAdapter</i> class: <i>NoOpCacheAdapter</i> that is used for easily mocking <i>ICache</i> for testing.
- ceaac8a: Removed <i>setTimeout</i> method of <i>LazyPromise</i> class.
- f7c33fb: Added <i>ILockAdapter</i> class: <i>NoOpLockAdapter</i> that is used for easily mocking <i>ILockProvider</i> for testing.
- ceaac8a: Added new method to <i>LazyPromise</i> class:
    - <i>setRetryTimeout</i>: Sets a timeout for each retry attempt, ensuring it aborts if retry exceeds the specified time.
- ceaac8a: Added new method to <i>LazyPromise</i> class:
    - <i>setTotalTimeout</i>: Sets a timeout <i>LazyPromise</i>, ensuring it aborts if <i>LazyPromise</i> exceeds the specified time.
- 8285a0d: Added new methods to ILock contract: runBlockingOrFail, and acquireBlockingOrFail.

### Patch Changes

- 8f69793: Updated documentation
- f7c33fb: Fixed a bug with <i>LockProviderFactory</i> class, now each named <i>ILockAdapter</i> has a unique <i>KeyPrefixer</i> instance.
- f7c33fb: Updated old types of <i>LockProviderFactory</i> class.
- f7c33fb: Fixed a bug with <i>CacheFactory</i> class, now each named <i>ICacheAdapter</i> has a unique <i>KeyPrefixer</i> instance.
- 8f69793: Fixed a bug with resolving the OneOrMore type
- f7c33fb: Fixed a bug with <i>KeyPrefixer</i> class <i>originalRootPrefix</i> method.
- f7c33fb: Updated old types of <i>EventBusFactory</i> class.
- 6cae88d: Updated the <i>ICache</i> contract: modified the <i>removeMany</i> method to accept an <i>Iterable</i> argument instead of an <i>Array</i>.

## 0.27.0

### Minor Changes

- e6ad128: Added new method <i>onError</i> on <i>LazyPromise</i> class.
- 5a2a996: Updated the <i>Cache</i> and <i>CacheFactory</i> classes, they can now take factory function/object that returns a <i>ICacheAdapter</i> and <i>IDatabaseCacheAdapter</i>.
- 0602f10: Made the <i>LockProviderFactory</i> class configurable by using the builder pattern.
- d947cb3: Shortend the import paths
- e6ad128: Changed <i>LazyPromise</i> class to be immutable.
- 9c8b932: Made the <i>CacheFactory</i> class configurable by using the builder pattern.
- e6ad128: Moved the <i>delay</i> function to <i>LazyPromise</i> class as a static method.
- e6ad128: Added new method <i>onSuccess</i> on <i>LazyPromise</i> class.
- 5a2a996: Removed <i>withGroup</i> and <i>group</i> methods from <i>ICacheAdapter</i>. Added <i>removeAll</i> method to <i>ICacheAdapter</i>.
- e6ad128: Removed callbacks from <i>LazyPromise</i> <i>defer</i> method.
- 0602f10: Updated the <i>LockProvider</i> and <i>LockProviderFactory</i> classes, they can now take factory function/object that returns a <i>ILockAdapter</i> or <i>IDatabaseLockAdapter</i>.
- 5a2a996: Removed the following methods from <i>ICache</i> contract:
    - <i>existsMany</i>
    - <i>missingMany</i>
    - <i>getMany</i>
    - <i>getOrMany</i>
    - <i>addMany</i>
    - <i>updateMany</i>
    - <i>putMany</i>
      Changed the <i>removeMany<i> method, it now returns a boolean.
- b9d03e1: Removed <i>withGroup</i> and <i>group</i> methods from <i>IEventBusAdapter</i> contract.
- 0602f10: Removed <i>withGroup</i> and <i>group</i> methods from <i>ILockAdapter</i> and <i>IDatabaseLockAdapter</i>.
- 9c8b932: Made the <i>EventBusFactory</i> class configurable by using the builder pattern.
- 5a2a996: Added <i>IDatabaseCacheAdapter</i> contract.
- e6ad128: Added new method <i>onFinally</i> on <i>LazyPromise</i> class.
- b9d03e1: Updated the <i>EventBus</i> and <i>EventBusFactory</i> classes, they can now take factory function/object that returns a <i>IEventBusAdapter</i>.

### Patch Changes

- 5a2a996: Fixed a bug with <i>LockProvider</i> class
- dd22f21: Fixed a typecript bug with <i>IEventListenable</i> contract.

## 0.26.1

### Patch Changes

- 2128106: Fixed a but <i>LockProvider</i> class

## 0.26.0

### Minor Changes

- a93ee80: The <i>Pipeline</i> class <i>invoke</i> method can now take function, async function, LazyPromise and reguler value
- 70e2494: Changed <i>IInvokableObject</i> method name
- b34c3dc: The <i>LazyPromise</i> <i>defer</i> method now accepts callbacks <i>onSuccess</i>, <i>onFailure</i>, and <i>onFinally</i>.
- 70e2494: Removed <i>IEventListenerObject</i> and <i>EventListener</i> types.
- 84e333c: Added new <i>Pipeline</i> utility class makes it easy to chain multiple functions and <i>IInvokableObject</i> instances together. Each function or object in the pipeline can inspect or modify the input as it passes through. The <i>Pipeline</i> class is immutable, so you can safely extend or modify it without causing issues.
- 0cc289d: Changed the serialization, deserialization of the <i>TimeSpan</i> class

## 0.25.0

### Minor Changes

- a4349e5: Renamed <i>ILockListener</i> contract to <i>ILockListenable</i>.
- a4349e5: Renamed <i>ICacheListener</i> contract to <i>ICacheListenable</i>.
- 92d7dd3: The <i>LockProvider</i> class and <i>LockProviderFactory</i> class uses <i>MemoryEventBusAdapter</i> by default now.
- 76063a4: Renamed <i>IEventListener</i> contract to <i>IEventListenable</i>.
- 89aa51e: Added 2 new methods for <i>ILock</i> contract, <i>acquireBlocking</i> and <i>runBlocking</i>.
  They retry acquiring the lock at a set interval until the timeout is reached."
- 76063a4: Renamed <i>Listener</i> type to <i>EventListener</i>
- 76063a4: Enhanced the <i>IEventListenable</i> contract to support both function, object literal and class instance listeners, providing greater flexibility in event handling.
- afa57c7: Added new method <i>asPromise</i> to the <I>IEventBus<i>. The <i>asPromise</i> method returns <i>LazyPromise</i> objecet that resolves once the <i>BaseEvent</i> is dispatched.

### Patch Changes

- 57e4bb5: Updated documentation
- 92d7dd3: The <i>Cache</i> class and <i>CacehFactory</i> class uses <i>MemoryEventBusAdapter</i> by default now.

## 0.24.0

### Minor Changes

- 1f1b344: Renamed function <i>registerEventBusErrors</i> to <i>registerEventBusErrorsToSerde</i>.
- 78bad79: Made <i>ListCollection</i> and <i>IterableCollection</i> class serializable and deserializable.
- 1f1b344: Renamed function <i>registerCacheErrors</i> to <i>registerCacheErrorsToSerde</i>
- 8253d62: Changed <i>Lock</i> class so it now doesn't implement <i>ISerdeTransformer</i> contract.
- fadaaeb: - Changes
    - Converted the project to ESM only module.
    - Removed the main entrypoint and multiple entry points to the project via package.json exports field.
- 4e4b1b8: Added new <i>Serde</i> class that implements <i>IFlexibleSerded</i> and that can be derivied from <i>IFlexibleSerdeAdapter</i>.
- 1f1b344: Renamed function <i>registerCacheEvents</i> to <i>registerCacheEventsToSerde</i>
- 66215ea: The <i>ISerdeTransformer</i> contract name field can now be bot a <i>string</i> and <i>string[]</i>.

### Patch Changes

- 7055619: Improved lock component documentation
- 8253d62: Fixed a bug with <i>Lock</i> class serialization and deserialization
- 1f1b344: Added new functions <i>registerCollectionsToSerde</i> and <i>registerCollectionErrorsToSerde</i>

## 0.23.0

### Minor Changes

- 9160158: Renamed <i>UnownedExtendLockError</i> to <i>UnownedRefreshLockError</i>
- ebd0666: Removed <i>IDatabaseLockAdapter</i> inheritance from <i>IDeinitizable</i> and <i>IInitizable</i> to simplify the contract.
- 4a4b537: Removed the <i>ISerdeRegistrable</i> contract
- ebd0666: Removed <i>isLocked</i> method and <i>getRemainingTime</i> method from <i>ILockAdapter</i>.

### Patch Changes

- 4a4b537: Updated READNE.md and package.json.
- ebd0666: - <i>Lock</i> class
    - Fixed a bug in <i>acquireOrFail</i>, it now correctly throws an error.

## 0.22.2

### Patch Changes

- e456cbe: Updated READNE.md and package.json.

## 0.22.1

### Patch Changes

- c2a6a79: Added more documentation for the lock component

## 0.22.0

### Minor Changes

- ecabc49: - Changes
    - Remove static settings methods and settings builder classes from:
        - EventBus class
        - EventBusFactory class
        - MemoryEventBusAdapter class
        - RedisPubSubEventBusAdapter class
- 1c41caf: - New features
    - Added new <i>ILock</i> <i>UnexpectedLockErrorEvent</i> that will dispatched when error occurs.
    - Added event listeners to <i>ILockProvider</i>, enabling monitoring of lock events from multiple locks.
    - Changes
        - Made all the <i>ILock</i> events defered when dispatched.
- 1821d46: - New features
    - Added new <i>ICache</i> <i>UnexpectedCacheErrorEvent</i> that will dispatched when error occurs.
    - Changes
        - Made all the <i>ICache</i> events defered when dispatched.
- 9a0c764: - Changes
    - Remove static settings methods and settings builder classes from:
        - Cache class
        - CacheFactory class
        - MemoryCacheAdapter class
        - MongodbCacheAdapter class
        - LibsqlCacheAdapter class
        - SqliteCacheAdapter class
        - RedisCacheAdapter class
- 9ef0a81: - New features
    - Added distributed lock.
        - Contracts
            - Added IDatabaseLockAdapter
            - Added ILockAdapter
            - ILockProvider
            - ILockProviderFactory
            - ILock
        - Derivables
            - Added <i>LockProvider</i> class.
            - Added <i>LockProviderFactory</i> class.
        - Adapter
            - LibsqlLockAdapter
            - MemoryLockAdapter
            - MongodbLockAdapter
            - RedisLockAdapter
            - SqliteLockAdapter
- 0dfe16c: - Changes
    - Simplified the cacheAdapterTestSuite
    - Simplified the cacheTestSuite
- 8fa218c: - Changes
    - Simplified the eventBusAdapterTestSuite
    - Simplified the eventBusTestSuite
- e2f6d79: - Changes
    - IAsyncCollection: You can now pass in LazyPromise as default value in the following methods.
        - firstOr
        - lastOr
        - beforeOr
        - afterOr
    - Cache: You can now pass in LazyPromise as default value in the following methods.
        - getOr
        - getOrAdd

### Patch Changes

- ef2315b: Fixed a minor type bug
- d486046: Added missing exports
- 604e43f: - Improved documentations

## 0.21.1

### Patch Changes

- c3aaf06: - Fixed bugs with LazyPromise class
- ccf442d: - Removed <i>exists</i> mehtod from the <i>ICacheAdapter</i> contract and all classes that implement the contract.

## 0.21.0

### Minor Changes

- afdd280: - Removed <i>shouldRegisterEvents</i> and <i>shouldRegisterErrors</i> from <i>CacheSettings</i>.
    - Removed <i>shouldRegisterErrors</i> from <i>EventBusSettings</i>.
- 81396af: - Updated the documentation and made <i>CacheSettings.eventBus</i> field required.

## 0.20.0

### Minor Changes

- 3dfbd75: - Updated the <i>ICacheAdapter</i> contract: The <i>withGroup</i> method now accepts only a string as its argument.
    - Updated the <i>IEventBusAdapter</i> contract: The <i>withGroup</i> method now accepts only a string as its argument.

## 0.19.0

### Minor Changes

- 615e616: - Added new settings to the <i>Cache</i> class, allowing you to decide whether to register all <i>Cache</i> related events and errors.

## 0.18.0

### Minor Changes

- 29334ad: ### Changes
    - Simplified the event registration process by removing the <i>registerCacheEvents</i> function.
    - All cache-related events are now registered directly within the <i>Cache</i> class constructor for improved clarity and maintainability.
- a6fe783: ### Changes
    - Made all the cahce related Error serializable and deserializable
    - All cache related error are registered directly within the <i>Cache</i> class constructor for improved clarity and maintainability
- 97a3934: ### Changes
    - Made all the event bus related Error serializable and deserializable
    - All event bus related error are registered directly within the <i>EventBus</i> class constructor for improved clarity and maintainability
- f64191c: ### Changes
    - Introduced a new method, <i>registerCustom</i>, in the <i>IFlexibleSerde</i> contract.
      This method enables support for custom serialization and deserialization processes.

## 0.17.4

### Patch Changes

- 29aa4d7: Improved documentation

## 0.17.3

### Patch Changes

- 6d9dd94: Updated documentation

## 0.17.2

### Patch Changes

- c31871e: Added missing imports

## 0.17.1

### Patch Changes

- 5f8076b: Improved documentation

## 0.17.0

### Minor Changes

- e21e0ce: ### Changes

    - <i>ICache</i> and <i>ICacheAdapter</i> Enhancements:
        - All <i>ICache</i> and <i>ICacheAdapter</i> classes now take a single constructor argument.
        - A settings builder has been introduced for all <i>ICache</i> and <i>ICacheAdapter</i> classes.
    - <i>IEventBus</i> and <i>IEventBusAdapter</i> Enhancements:
        - All <i>IEventBus</i> and <i>IEventBusAdapter</i> classes now take a single constructor argument.
        - A settings builder has been introduced for all <i>IEventBus</i> and <i>IEventBusAdapter</i> classes.
    - <i>LazyPromise</i> class Enhancements:
        - Removed the settings from <i>LazyPromise</i> class.
        - Renamed to methods to use set as prefix

### Patch Changes

- e21e0ce: ### Changes
    - Generic Type Defaults: Added default generic types for the following interfaces and classes
    - Caching
        - ICache contract
        - Cache class
        - ICacheAdapter contract
        - MemoryCacheAdapter class
        - SqliteCacheAdapter class
        - LibsqlCacheAdapter class
        - RedisCacheAdapter class
        - MongodbCacheAdapter class
    - Event bus:
        - IEventBus contract
        - EventBus class
    - Collections:
        - IAsyncCollection contract
        - AsyncIterableCollection class
        - ICollection contract
        - IterableCollection class
        - ListCollection class
- caa9f36: ## Changes
    - Ensured consistent serialization and deserialization in all the cache adapters and event bus adapters.
- e21e0ce: ### Changes
    - Remove <i>withType</i> method from <i>ICacheFactory</i> and <i>IEventBusFactory</i>.

## 0.16.0

### Minor Changes

- 9197902: ## Changes
    - Moved cache group logic from the <i>Cache</i> class into the adapters classes.
        - **Key Impact**: Each adapter is now required to implement the <i>getGroup</i> and <i>withGroup</i> methods.
        - This change enhances flexibility for adapter-specific logic.
- 7d07f5d: ## New Features

    - Introduced new static helper methods for the <i>LazyPromise</i> class:

        - <i>all</i>
        - <i>allSettled</i>
        - <i>race</i>
        - <i>any</i>

        These methods are similar to JavaScript <i>Promise</i> methods but execute lazily.

- 29bfdf2: ## Changes
    - Renamed everything that start with </i>namespace</i> to </i>group</i>.
- cd2342b: ## Changes

    - Renamed all instances of the <i>ISerializer</i> contract to <i>ISerde</i>.
    - Added two new contracts:
        - <i>IDeserializer</i>: Handles only deserialization.
        - <i>ISerializer</i>: Handles olny serialization.

    ## New Features
    - Introduced the <i>ISerializable</i> contract, enabling classes to be marked as serializable.
    - Added the <i>IFlexibleSerde</i> contract, allowing registration of custom classes for serialization and deserialization.
    - Implemented the <i>ISerializable</i> contract the <i>TimeSpan</i> class.

- 46d2474: ## New features
    - Introduced a new static helper method <i>wrapFn</i> for the <i>LazyPromise</i> class.
      This method simplifies the process of wrapping asynchronous functions with <i>LazyPromise</i>.
- d3eec52: ## Changes
    - Removed abstract <i>BaseCache</i> class
    - Removed abstract <i>BaseEventBus</i> class
    - Added lazyPromiseSettings for <i>AsyncIterableCollection</i> class
    - Added lazyPromiseSettings for <i>Cache</i> class
    - Added lazyPromiseSettings for <i>EventBus</i> class
- 5e7dae8: ## New features

    - Introduced a instance static method <i>listenOnce</i> for the <i>IEventBus</i> contract and <i>EventBus</i> class.
      This method simplifies add listener that will only execute once.

    ## Changes
    - Moved event bus group logic from the <i>Cache</i> class into the adapters classes.
        - **Key Impact**: Each adapter is now required to implement the <i>getGroup</i> and <i>withGroup</i> methods.
        - This change enhances flexibility for adapter-specific logic.

- 67ec890: ## New Features
    - Introduced new static helper methods for the <i>AsyncIterableCollection</i>, <i>IterableCollection</i> and <i>ListCollection</i> classes:
        - <i>concat</i>
        - <i>difference</i>
        - <i>zip</i>

## 0.15.0

### Minor Changes

- e08c7d6: ## Changes
    - Changed <i>IEventBus</i> contract to use event maps types.
- 18e68be: ## Changes
    - Removed <i>abort</i>, <i>retry</i>, <i>timeout</i> methods.
    - Added these methods as part of the <i>LazyPromise</i> class for better developer experience.

### Patch Changes

- 2cc89b6: ## Minor features
    - Added reusable tests for <i>ICace</i> contract.

## 0.14.0

### Minor Changes

- 8b27f63: ## Changes
    - Added: A new <i>NoOpCacheAdapter</i> for mocking cache operations in testing environments.
    - Updated: All cache and eventbus adapters now require a serializer to be explicitly provided, ensuring consistent serialization behavior.
    - Removed: The validation feature has been removed from the <i>EventBus</i> and <i>EventBusFactory</i> classes.
    - Added: A new abstract class <i>BaseEventBus</i> to simplify the implementation of <i>IEventBus</i>. This allows direct use without needing <i>IEventBusAdapter</i>.

## 0.13.0

### Minor Changes

- 29e7aee: ### ICollection

    - **Added `toRecord`**: Converts a collection to a `Record` if the items are tuples of two elements, where the first element is a `string`, `number`, or `symbol`.
    - **Added `toMap`**: Converts a collection to a `Map` if the items are tuples of two elements.

    ### IAsyncCollection
    - **Added `toRecord`**: Converts a collection to a `Record` if the items are tuples of two elements, where the first element is a `string`, `number`, or `symbol`.
    - **Added `toMap`**: Converts a collection to a `Map` if the items are tuples of two elements.

## 0.12.0

### Minor Changes

- dc33da1: ## Changes

    - Added Cache module that can work ttl keys and none ttl keys.
    - Remove Storage module in favor of the Cache module because it can with ttl keys and none ttl keys.
    - Added MongodbCacheAdapter
    - Added SqliteCacheAdapter
    - Added LibsqlCacheAdapter
    - Added RedisCacheAdapter
    - Added MemoryCacheAdapter

    ## Changes
    - Added Cache module: Introduced a new Cache module that supports both TTL (time-to-live) keys and non-TTL keys.
    - Removed Storage module: Its functionality has been replaced by the more versatile Cache module, which supports both TTL and non-TTL keys.
        - New Cache Adapters: Added the following cache adapters for improved flexibility and compatibility:
        - MongodbCacheAdapter
        - SqliteCacheAdapter
        - LibsqlCacheAdapter
        - RedisCacheAdapter
        - MemoryCacheAdapter

## 0.11.0

### Minor Changes

- 6308641: ## Changes
    - Enhanced the IStorageFactory, so the will throw runtime erros.
    - Enhanced the IEventBusFactory, so the will throw runtime erros.
    - Simplified the IStorage contract
    - Simplified the IStorageAdapter contract
    - Simplified Storage class
    - Rewrote all the adapters

## 0.10.0

### Minor Changes

- f675866: ## Changes
    - Changed IAsyncCollection contract to use LazyPromise instead PromiseLike.
    - Changed IEventBus contract to use LazyPromise instead PromiseLike.
    - Changed IStorage contract to use LazyPromise instead PromiseLike.
    - Changed ISerializer contract to use PrommiseLike instead Promise.

## 0.9.0

### Minor Changes

- adfe30a: ## Changes
    - Added <i>get</i>, <i>getOrFail</i> and <i>set</i> methods for the <i>ICollection</i> and <i>IAsyncCollection</i> contracts
        - <i>get</i> method makes it easy to retrieve an item based on index. If item is not found null will be returned.
        - <i>getOr</i> method makes it easy to retrieve an item based on index. If item is not found an error will be thrown.
        - <i>set</i> method makes it easy to set item by index.

## 0.8.1

### Patch Changes

- 0684e61: ## Changes
    - Improved the IEventBusManager
    - Improved the IStorageManager

## 0.8.0

### Minor Changes

- a462c8f: ## New features

    - Added EventBus class and IEventBus contract that includes methods that are useful for multitennacy.
    - Added IEventBusAdapter, RedisEventBusAdapter and MemoryEventBusAdapter.

    ## Improvements
    - Improvevd IStorage so they trigger events that can be listenable
    - Improved IStorage by adding new methods that that are useful for multitennacy

    ## New Features
    - Introduced the `EventBus` class and the `IEventBus` contract, which provide essential methods for supporting multitenancy.
    - Added IEventBusAdapter contract the following event bus adapters:
        - `RedisEventBusAdapter`
        - `MemoryEventBusAdapter`

    ## Improvements
    - Enhanced `IStorage` to trigger events that can be subscribed to for better event-driven behavior.
    - Expanded `IStorage` with new methods designed to support multitenancy effectively.

## 0.7.0

### Minor Changes

- 99c4671: Simplified the storage contracts

## 0.6.0

### Minor Changes

- f324fc1: # Storage
    - Simplified StorageAdapter contract
    - Changed the StorageAdapter and Storage contract to use PromiseLike instead of Promise.
    - Changed the Storage class to use LazyPromise instead of Promise.
    - Removed unnecessary try catches from Storage class so unknown error can propagate up

## 0.5.0

### Minor Changes

- 790a76c: # IAsyncCollection and AsyncIterableCollection
  Changed IAsyncCollection contract to use PromiseLike instead of Promise.
  Changed AsyncIterableCollection to use LazyPromise instead of Promise.
  Removed all try catches catched unknown errors.
  Renamed timeout to takeUntilTimeout, and abort to takeUntilAbort.

## 0.4.0

### Minor Changes

- e2031da: # New features

    ## Async utilities
    - Added <i>abortable</i> async utility function.
    - Added <i>abortableIterable</i> utility function.
    - Added <i>delay</i> async utility function.
    - Added <i>delayIterable</i> utility function.
    - Added <i>retry</i> async utility function.
    - Added <i>retryIterable</i> utility function.
    - Added <i>timeout</i> async utility function.
    - Added <i>timeoutIterable</i> utility function.
    - Added <i>LazyPromise</i> class utility.
    - Added <i>constant</i>, <i>exponential</i>, <i>linear</i> and <i>polynomial</i> backoff policies.

    ## Utilities
    - Added TimeSpan class that makes easy to work time intervals.

- d070f85: Introduced a new namespace feature for the Storage contract. This enhancement enables the creation of a new Storage instance with a specified prefixed namespace, derived from the current Storage.

### Patch Changes

- d070f85: Removed AsyncDispose for StorageContract

## 0.3.0

### Minor Changes

- ff9b885: ## Cache

    ### Contracts
    - Added cache contract
    - Added cache adapter contract.

    ### Adapters
    - Added redis cache adapter
    - Added mongodb cache adapter
    - Added sqlite cache adapter.

    ## Serializer

    ### Contracts
    - Added serializer contract

    ### Adapters
    - Added super json serializer adapter
    - Added redis serializer adapter
    - Added mongodb serializer adapter
    - Added sqlite serializer adapter.

## 0.2.1

### Patch Changes

- fad301c: Removed documentation for internal functions

## 0.2.0

### Minor Changes

- 7cb54cb: ## ICollection and IAsyncCollection changes
  Removed the <i>throwOnIndexOverflow</i> setting from all ICollection and IAsyncCollection methods. This change was made because the setting <i>throwOnIndexOverflow</i> was unnecessary; it only applied to very large collections, where using JavaScript is not advisable.

    Changed the <i>slice</i> method signature to align with the JavaScript version.

    Changed the <i>shuffle</i> method to accept a custom Math.random function, making it easier for testing.

    Changed the <i>sum</i>, <i>average</i>, <i>median</i>, <i>min</i>, <i>max</i>, and <i>percentage</i> methods to throw an error when the collection is empty.

    Changed the <i>crossJoin</i> method signature and its usage to ensure proper type inference.

## 0.1.5

### Patch Changes

- 7206c93: Updated the docs

## 0.1.4

### Patch Changes

- 218a64c: Added link to docs in readme

## 0.1.3

### Patch Changes

- 60c686d: Added proper documentation, changed som method names, added 2 new methods

## 0.1.2

### Patch Changes

- a10193f: Empty collection class instances can be created without passing in empty arrays

## 0.1.1

### Patch Changes

- 25b7503: Added npmignore

## 0.1.0

### Minor Changes

- First release
