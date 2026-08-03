<p align="center">
	<img src="https://img.shields.io/npm/v/eridu-tech" alt="npm version">
	<img src="https://img.shields.io/npm/dy/eridu-tech" alt="NPM Downloads">
	<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white" alt="TypeScript">
	<img src="https://img.shields.io/badge/module%20type-ESM-blue" alt="ES Modules">
	<img src="https://img.shields.io/npm/l/eridu-tech" alt="License">
</p>

# eridu-tech

**Write business logic once. Replace infrastructure anytime.**

The adapter-first backend toolkit for TypeScript — 17 officially maintained components with 4,640+ integration and behavior tests.

[**Explore the Docs**](https://www.eridu-tech.io/docs/installation) · [**API docs**](https://eridu-tech.github.io/eridu-tech-core/modules.html) · [**GitHub**](https://github.com/eridu-tech/eridu-tech-core) · [**NPM**](https://www.npmjs.com/package/eridu-tech)

---

## ⚡ Quick Install

```bash
npm install eridu-tech
```

---

## ✨ Why eridu-tech?

- **Switch infrastructure without rewriting business logic**: The adapter pattern keeps your code decoupled from vendors. Use Redis today, Postgres tomorrow — no refactoring required.
- **Test everything without Docker**: Every component ships with an in-memory adapter and built-in Vitest helpers. Write fast, isolated tests without external services.
- **Bring your own framework**: No DI container required. Plug directly into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.
- **Type-safe from day one**: Full TypeScript support with precise generics, rich intellisense, and auto-import friendly APIs — errors caught at compile time, not runtime.
- **Standard schema validation built in**: First-class integration with [Standard Schema](https://standardschema.dev/). Use [Zod](https://zod.dev/), Valibot, or ArkType to enforce both compile-time and runtime data safety.
- **ESM native. No CommonJS baggage.**: Built on modern JavaScript primitives. Fully compatible with Node.js, Bun, Deno, and the modern bundler ecosystem.

---

## 🧬 Unified architecture

A single serialization engine, a single execution context, and composable middleware — every component shares the same architecture.

### 🔁 Serde — Serialize anything. Restore everything.

The Serde component provides a unified serialization and deserialization engine with fully type-safe schemas. It supports custom serializers for any type and includes a built-in SuperJSON adapter that handles Date, Map, Set, and BigInt out of the box. Serde is used internally across LockFactory, Cache, EventBus, and other components.

- Shared serialization engine used throughout Eridu-tech
- Powers LockFactory, Cache, EventBus, and more
- Built-in SuperJSON adapter — Date, Map, Set & BigInt out of the box
- Register custom serializers for your own types

### ⚡ ExecutionContext — Propagate context across async boundaries.

The ExecutionContext component propagates any kind of async context across execution boundaries. Most components use it to become implicitly execution-context-aware, allowing them to automatically share the same transaction and other contextual state.

- Type-safe context tokens
- Async context propagation
- No manual parameter passing

### 🔗 Middleware — AOP-style middleware. Compose behavior. Keep logic clean.

The Middleware component provides a composable AOP-style middleware pipeline with before/after hooks, error handling, and context propagation. It supports wrapping standalone functions with `use()`, enhancing class methods with `enhance()`, and packaging reusable middleware into plugins with `withPlugin()`. Built-in middlewares include retry, timeout, fallback, and more.

- AOP with before/after hooks around any function
- Built-in retry, timeout, fallback middlewares and so many more
- Function wrapping with `use()`, class enhancement with `enhance()`, plugin system with `withPlugin()`
- Built-in prefixing plugins for majority of components and so many more

### 🌐 HttpRouter — Define routes. Stay framework-agnostic.

The HttpRouter component provides a framework-agnostic HTTP routing layer with type-safe endpoint definitions, standard-schema validation, and middleware support. It works with any Winter TC compatible runtime or adapter and can be used across Express, Fastify, Hono, Next.js, Nuxt, SvelteKit, and more.

- Type-safe route definitions with standard-schema validation
- Works with Next.js App Router, Nuxt, SvelteKit, and any winter tc compatible runtime or adapter
- Build on top of Hono.js Router adapters
- Middleware chains & route groups

### 🌍 EnvAccessor — Type-safe environment variables. From any source.

The EnvAccessor component provides easy type-safe access to environment variables. It supports multiple sync and async sources (process.env, secrets managers), schema validation, and convenient access patterns.

- Type-safe reads with full autocompletion
- Multiple sources — process.env and async secret providers
- Optional Zod schema validation
- `get()` returns null on missing fields; `getOr()` falls back to a default

### 🗂️ ConfigAccessor — Read config safely. Stay type-safe.

The ConfigAccessor component provides standardized type-safe access to domain configuration variables. It supports optional schema validation — useful for dynamic configurations like per-tenant settings.

- Type-safe reads with full autocompletion
- Nested objects and arrays up to 2 levels deep
- Optional Zod schema validation
- `get()` returns null on missing paths; `getOr()` falls back to a default

---

## 🎯 Who is this for?

eridu-tech is built for backend and fullstack TypeScript developers who value flexibility and testability.

### ✅ Perfect for

- **Backend applications:** Build REST APIs, background workers, CLIs, and backend other services using reusable, composable components.
- **Framework-agnostic projects:** Works with Express, Fastify, Hono, Next.js, Nuxt, SvelteKit, Cloudflare Workers, Bun, Deno, Node.js, and any runtime supporting the standard winter tc Fetch api.
- **Adapter-first architectures:** Switch between Redis, PostgreSQL, SQLite, MongoDB, S3, local storage, in-memory implementations, or your own adapters without changing business logic.
- **Distributed systems:** Use distributed locks, semaphores, shared locks, circuit breakers, rate limiters, caches, and event buses that work across multiple processes and machines.
- **Modular monoliths:** Share the same abstractions, middleware, and adapters across a single deployable application. Some components or workers can be used in microservices, but the library is primarily designed for modular monolith architectures.
- **Library and framework authors:** Build reusable backend libraries on stable interfaces instead of coupling to specific vendors or infrastructure.
- **Testing and local development:** Use in-memory and NoOp adapters for fast, deterministic tests, then swap to production infrastructure with configuration only.
- **Portable backend code:** Write infrastructure-independent code that can move between cloud providers, databases, storage providers, and runtimes with minimal changes.
- **Adopting individual components:** Use specific components without being forced to adopt the entire library or a DI container — each component works standalone.
- **Incremental adoption:** Start with a single component and gradually adopt more as your project grows.

### ⭐ Not ideal for

- **Microservices:** The library is designed for modular monoliths where components share the same process and runtime. While some components (like distributed locks, circuit breakers, and event buses) work across processes, the broader adapter model and shared abstractions are not optimized for microservice architectures.
- **Frontend-only applications:** eridu-tech is designed for backend and server-side development, not browser applications.
- **Projects tightly coupled to one vendor:** If your application intentionally depends on provider-specific features instead of abstractions, the adapter model may provide little benefit.
- **Very small scripts:** If you only need a single Redis call, file upload, or cache operation, the abstraction layer may be unnecessary overhead.
- **Applications requiring provider-specific capabilities:** Features unique to a particular database, cache, or cloud service may require using that provider's native SDK directly instead of a generic abstraction.
- **Pure JavaScript projects prioritizing simplicity:** While usable from JavaScript, the library is designed around TypeScript's type system, generics, and inference for the best developer experience.

---

## 🧩 Officially Maintained Components

A growing collection of officially maintained components. Every component ships with multiple built-in adapters — swap infrastructure without changing a single line of business logic.

### Foundation

- [**Middleware and AOP**](https://www.eridu-tech.io/docs/components/middleware) — `Near-stable` — Composable middleware pipeline with before/after hooks, error handling — the foundation for every component's plugin system.
- [**Collection**](https://www.eridu-tech.io/docs/components/collection) — `Near-stable` — Type-safe collection utilities with powerful query, transform, and pagination primitives.
- [**Serde**](https://www.eridu-tech.io/docs/components/serde) — `Experimental` — Serialize and deserialize data with a built-in SuperJSON adapter (Date, Map, Set, BigInt) and custom serializers — the backbone for all data interchange across the ecosystem.
- [**Codec**](https://www.eridu-tech.io/docs/components/codec) — `Experimental` — Encode and decode data with a unified, type-safe interface — includes a built-in Base64 codec and lets you build custom codecs for any protocol.
- [**Execution Context**](https://www.eridu-tech.io/docs/components/execution_context) — `Near-stable` — Type-safe, composable context propagation for request IDs, user info, and tracing metadata across async boundaries — without thread-local hacks.
- [**Typed Config Access**](https://www.eridu-tech.io/docs/components/config_accessor) — `Near-stable` — Standardized type-safe access to domain configuration variables — with optional schema validation and full TypeScript inference.
- [**Typed Env Access**](https://www.eridu-tech.io/docs/components/env_accessor) — `Near-stable` — Type-safe environment variable access from multiple sync/async sources with parsing, defaults, and validation — never read `process.env` raw again.

### Storage

- [**Cache**](https://www.eridu-tech.io/docs/components/cache/cache_usage) — `Near-stable` — Caching with pluggable stores (in-memory, Redis, etc.), TTL policies, and stampede protection.
- [**File Storage**](https://www.eridu-tech.io/docs/components/file_storage/file_storage_usage) — `Near-stable` — Abstract file storage with adapters for local disk, S3-compatible, and other backends — upload, stream, and serve with one API.

### Resilience

- [**Circuit Breaker**](https://www.eridu-tech.io/docs/components/circuit_breaker/circuit_breaker_usage) — `Near-stable` — Prevent cascading failures with configurable thresholds, half-open recovery, and custom fallback strategies.
- [**Rate Limiter**](https://www.eridu-tech.io/docs/components/rate-limiter/rate_limiter_usage) — `Near-stable` — Throttle request rates with configurable limits, sliding windows, and pluggable backends — protect your services from overload.
- [**Resilience**](https://www.eridu-tech.io/docs/components/resilience) — `Near-stable` — Timeout, fallback, retry, with configurable policies and backoffs.

### Concurrency

- [**Lock**](https://www.eridu-tech.io/docs/components/lock/lock_usage) — `Near-stable` — Distributed lock primitives with lease management, blocking and non-blocking acquisition, and automatic release.
- [**Shared Lock**](https://www.eridu-tech.io/docs/components/shared_lock/shared_lock_usage) — `Near-stable` — Read-write distributed locks for coordinating concurrent access with shared and exclusive modes.
- [**Semaphore**](https://www.eridu-tech.io/docs/components/semaphore/semaphore_usage) — `Near-stable` — Rate-limit concurrent access to shared resources with dynamic permit allocation.

### Messaging

- [**Event Bus**](https://www.eridu-tech.io/docs/components/event_bus/event_bus_usage) — `Near-stable` — Pub/sub event bus for dispatching and listening to events with pluggable transport backends — independent of underlying technology.

### Web

- [**HTTP Router**](https://www.eridu-tech.io/docs/components/http_router/http_router_usage) — `Near-stable` — Framework-agnostic HTTP router built on the Hono router engine — implements the Winter TC fetch standard with middleware chains and typed path parameters.

[**View all component docs →**](https://www.eridu-tech.io/docs/components/overview)

---

## 🔮 Upcoming Components

Components currently in design or development — not yet available in any release.

- **DI Container** — A lightweight, type-safe dependency injection container for wiring application components without tight coupling.
- **Transaction Context** — Coordinate database transactions across components with the after-commit pattern. Foundation for reliable messaging — powers the Outbox, Inbox, Scheduler, and Notifications.
- **CLI Command** — A unified API for defining and executing CLI commands with a transport adapter architecture. Run commands locally via child processes, remotely over SSH or HTTP, inside Docker containers, or through custom transports — all from the same command definition.
- **Structured concurrency** — Run async tasks in structured scopes where child tasks are tied to their parent's lifetime — with automatic cancellation, error propagation, and resource cleanup.
- **Promise Queue** — A configurable promise queue to control the number of concurrently executing promises and prevent resource exhaustion.
- **Logging & Observability** — Support for observability — logging, metrics, and tracing — with a pluggable adapter system. Pre-built adapters for [OpenTelemetry](https://opentelemetry.io/) and a local adapter that saves logs, traces, and metrics to disk.
- **Introspection** — Inspect the actual runtime state of any component through pre-built CLI commands — view registered handlers, active jobs, queue depth, lock holders, and more without digging into logs or metrics.
- **Job Scheduler** — Schedule work with full flexibility — immediate dispatch, delayed execution, and recurring jobs. Uses Transaction Context for reliable execution.

[**View full roadmap →**](https://www.eridu-tech.io/docs/roadmap)

---

## 🆚 How eridu-tech compares

### NestJS — A full framework with built-in DI vs a library that fits your needs.

| Instead of NestJS                                                                     | With eridu-tech                                                      |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Opinionated framework with its own DI, decorators, and modules.                       | A library, not a framework — DI optional, no decorators, plain classes.    |
| Conventions wholesale: DI central, most primitives only work inside NestJS.           | Same cache/lock/event bus in any framework — no lock-in.                   |
| NodeJS runtime only.                                                                  | Runs anywhere Winter TC runs — Node, Bun, Deno, edge.                      |
| Can't embed in a full-stack framework or host as one server.                          | Edge-adaptable via the adapter pattern.                                    |
| Not adapted for edge runtimes.                                                        | Embeds in any full-stack framework — host as one server.                   |
| Request-scoped only — no custom scopes.                                               | Scope-agnostic — request, custom, or no scope.                             |
| Wraps existing libs — BullMQ, cache-manager, class-validator, class-transformer, etc. | Own primitives with pluggable adapters — in-memory adapters for testing.   |
| Geared toward microservices and monoliths.                                            | Built for modular monoliths — swap infrastructure without rewriting logic. |
| No execution context flowing through all components.                                  | Execution context flowing through all components.                          |
| No shared serialization engine across components.                                     | Shared serialization engine (Serde) across components.                     |
| No built-in transaction context.                                                      | Will have a transaction context.                                           |

### AdonisJS — A batteries-included full-stack framework vs composable primitives.

| Instead of AdonisJS                                          | With eridu-tech                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Bundles routing, ORM (Lucid), auth, sessions, validation.    | No app framework, ORM, or auth — just infrastructure behind adapters. |
| Prescribed folder structure and conventions.                 | Combine with any application layer — you bring the structure.         |
| NodeJS runtime only.                                         | Runs anywhere Winter TC runs — Node, Bun, Deno, edge.                 |
| Can't embed in a full-stack framework or host as one server. | Embeds in any full-stack framework — host as one server.              |
| Not adapted for edge runtimes.                               | Edge-adaptable via the adapter pattern.                               |
| No execution context flowing through all components.         | Execution context flowing through all components.                     |
| No shared serialization engine across components.            | Shared serialization engine (Serde) across components.                |
| No built-in transaction context.                             | Will have a transaction context.                                      |

### TRPC / ORPC — End-to-end typed APIs vs the server-side infrastructure behind them.

| Instead of TRPC / ORPC                                                         | With eridu-tech                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| End-to-end type safety between client and server.                              | Not an RPC framework — not a tRPC or ORPC replacement.                                                     |
| Define procedures once — call from the client with full inference, no codegen. | Backend infrastructure behind pluggable adapters — caching, locks, rate limiting, scheduling, event buses. |
| Excellent for type-safe full-stack APIs at the client-server boundary.         | Complementary — tRPC procedures can call services backed by eridu-tech.                              |
| No built-in battery included backend infrastructure                            | Choose tRPC for typed transport; add eridu-tech for reusable server-side infra.                      |

### Next.js, Nuxt, etc. — Meta-frameworks for the web vs a framework-agnostic backend.

| Instead of Next.js, Nuxt, etc.                                          | With eridu-tech                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Excel at client rendering, SSR, routing, and a rich frontend ecosystem. | Not a web or frontend framework — not a replacement for Next.js or Nuxt.                           |
| Ship their own server-side APIs and route handlers.                     | Complements them — route handlers and server actions can use cache, locks, queues, and schedulers. |
| Often the best starting point for shipping a web app quickly.           | Same backend logic moves between a meta-framework and a standalone API service or worker.          |
| Backend logic locked into the meta-framework.                           | Add eridu-tech for portable, testable server-side infra.                                     |
| No built-in battery included backend infrastructure                     |                                                                                                    |

### Composing your own stack — Hand-picked libraries vs a consistent, integrated layer.

| Instead of composing your own stack                                               | With eridu-tech                                                                         |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Maximum control and minimal dependencies — pick exactly the libraries you want.   | Consistent, integrated layer — shared patterns and common adapter interfaces.                 |
| Simpler and lighter for small, focused use cases.                                 | Heavier than a single raw library, but ships in-memory adapters for testing without Docker.   |
| Better when you need one or two primitives or rely on provider-specific features. | Trade-off: an abstraction layer — raw libraries win for a single Redis call or a tiny script. |
| No shared conventions — you wire libraries together yourself.                     | No glue code — components interoperate through a shared serde and execution context.          |
| Locked into what you picked — adding more means more glue code.                   | Adopt incrementally — start with one component and add more as the project grows.             |

---

## ⭐ Find this library useful? Give it a ⭐

If you see potential in eridu-tech, starring the repo on GitHub helps others discover it and motivates continued development. It takes one click and means a lot.

[⭐ Star on GitHub](https://github.com/eridu-tech/eridu-tech-core)

---

## 🚀 Ready to build something great?

Get up and running in minutes with a single install.

```bash
npm install eridu-tech
```

[**Get started →**](https://www.eridu-tech.io/docs/installation) · [**View on GitHub**](https://github.com/eridu-tech/eridu-tech-core)
