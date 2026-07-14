<p align="center">
	<img src="https://img.shields.io/npm/v/@daiso-tech/core" alt="npm version">
	<img src="https://img.shields.io/npm/dy/@daiso-tech/core" alt="NPM Downloads">
	<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white" alt="TypeScript">
	<img src="https://img.shields.io/badge/module%20type-ESM-blue" alt="ES Modules">
	<img src="https://img.shields.io/npm/l/@daiso-tech/core" alt="License">
</p>

# @daiso-tech/core

**Backend server SDK for TypeScript**

The library contains 4,640 tests — the majority are integration and behavior tests, ensuring reliability in real-world scenarios.

[**Explore the Docs**](https://daiso-tech.dev/docs/installation) | [**NPM Package**](https://www.npmjs.com/package/@daiso-tech/core)

---

## ⚡ Quick Install

```bash
npm install @daiso-tech/core
```

---

## ✨ Why @daiso-tech/core?

- **Type safe by default**: Full TypeScript support with precise generics, rich intellisense, and auto-import friendly APIs — errors caught at compile time, not runtime.
- **ESM ready**: Built on modern JavaScript primitives including ES modules. No CommonJS baggage — fully compatible with the modern Node.js and bundler ecosystem.
- **Easily testable**: Every component ships with an in-memory adapter and built-in Vitest helpers. Write fast, isolated tests without Docker or external services.
- **Standard schema support**: First-class integration with [Standard Schema](https://standardschema.dev/). Use [Zod](https://zod.dev/), Valibot, or ArkType to enforce both compile-time and runtime data safety.
- **Framework agnostic**: No DI container required. Plug directly into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.
- **Adapter pattern**: Swap infrastructure at will — Redis today, DynamoDB tomorrow. The adapter pattern keeps your business logic free from vendor lock-in.

---

## 🧩 Components

A growing collection of officially maintained, production-ready components. Every component ships with multiple built-in adapters — swap infrastructure without changing a single line of business logic.

### 🛡️ Resilience

- **Circuit-breaker**: Prevent cascading failures with an automatic circuit-breaker primitive that stops calls to a consistently failing service.
- **Rate limiter**: Control traffic flow to protect services from overload.
- **Hooks / Middleware**: Retry, fallback, and timeout logic for robust async flows.

### 🚦 Concurrency

- **Lock**: Guarantee mutual exclusion across multiple processes with a distributed lock, eliminating race conditions on shared resources.
- **Semaphore**: Limit concurrent access to a resource or code section across processes with a configurable distributed semaphore.
- **Shared lock**: Coordinate readers and writers efficiently — allow concurrent reads while ensuring exclusive, safe writes across processes.

### 💾 Storage

- **Cache**: Speed up your application by storing frequently accessed data in a pluggable cache store — Memory, Redis, Kysely, and MongoDB adapters included.
- **File storage**: Manage files with a unified API across local filesystem, in-memory, and cloud providers like AWS S3.

### 📥 Messaging

- **EventBus**: Publish and subscribe to events across distributed server instances or entirely in-memory for local testing.

### 💉 Dependency Injection

- **DI container**: A lightweight, type-safe dependency injection container for managing service lifetimes, resolving dependencies, and composing large applications in a modular and testable way.

### 🧰 Utilities

- **Serde**: Add custom serialization and deserialization logic that integrates transparently with every other component in the library.
- **Collection**: Effortlessly work with Arrays, Iterables, and AsyncIterables using a rich, composable, and lazy collection API.
- **Execution context**: Propagate request-scoped data — user info, trace IDs, tenant context — across async boundaries. Integrates transparently with all components and adapters.
- **Config accessor**: Read typed application config values through a small accessor with optional schema validation.
- **Env accessor**: Load and validate environment variables from one or more sources with type-safe access.

---

## 🔮 Upcoming Components

Components currently in design or development — not yet available in any release.

### ⏰ Job Scheduling

- **Job scheduler**: Schedule work with full flexibility — immediate dispatch, delayed execution, and recurring jobs.

### 🔀 Structured Concurrency

- **Structured cancellations**: Planning to support running async tasks in structured scopes where child tasks are tied to their parent's lifetime — with automatic cancellation, error propagation, and resource cleanup.
- **Promise queue**: Planning to add a configurable promise queue to control the number of concurrently executing promises and prevent resource exhaustion.

###  Notifications

- **Notifications**: Planning to support sending notifications through multiple channels with flexible dispatch strategies — synchronous dispatching, immediate enqueueing, delayed enqueueing, and recurring messages. Planned channel adapters include Slack, Discord, email, SMS, and WebSocket (browser push).

### 🗄️ Data Integrity

- **Transaction context**: Planning to support coordinating database transactions across components with the after-commit, outbox, and inbox patterns for reliable, exactly-once message delivery.
- **Idempotent cache**: Planning to add built-in idempotency support for the Job Scheduler and Event Bus to prevent duplicate job execution and event processing.

### 🐘 Database

- **MikroORM** _(primary)_: Planning first-class integration with [MikroORM](https://mikro-orm.io/) as the main recommended database layer — full ORM support across PostgreSQL, MongoDB, SQLite, and more, with deep integration across all components.

### 🔍 Text Search

- **Text search**: Planning to support synchronising your database — synchronously or asynchronously — with an external search engine, queryable through a unified, ergonomic interface. First-class integrations with MikroORM, PostgreSQL (via Kysely), and MongoDB are planned so no glue code will be required.

### 🌐 HTTP

- **HTTP server**: Planning to support defining HTTP servers using the standard Web platform `Request`/`Response` API — portable across runtimes with no framework lock-in.
- **OpenAPI**: Planning first-class OpenAPI support — define your API schema alongside your handlers and get spec generation, validation, and documentation out of the box.

### 🔐 Security

- **Session management**: Planning to support managing user sessions securely with a pluggable, adapter-driven API.
- **Authorization gates**: Planning to implement Laravel-inspired gate primitives for fine-grained, policy-based access control.
- **Apache Casbin integration**: Planning integration with [Casbin](https://casbin.org/) for advanced authorization using attribute-based, role-based, and relationship-based access control models.
- **Authentication**: Planning first-class support for username/password, email verification, OAuth, and WebAuthn — with a [Better Auth](https://www.better-auth.com/) integration for batteries-included setups.

---

## 🌟 Vision

@daiso-tech/core will be built around one core idea: **production-grade backend primitives that work great standalone, but are even better together** — all inside your existing fullstack TypeScript app.

### Composable by design, not by requirement

Every component will be self-contained and will have zero hard dependencies on the others. You will be able to drop the Cache, the Lock, or the EventBus into any project in isolation. But when you use them together, they will integrate seamlessly — sharing the same execution context, serde layer, adapters, and conventions without any extra wiring.

### No DI container required — but supported when you want it

Components will remain plain classes you instantiate yourself. There will be no forced dependency injection framework. The DI container will become a first-class citizen that understands every component in the library — so when you do want a container, it will work with no adapters and no boilerplate.

### One server, one app

The library's HTTP primitives will be built on the standard Web platform `Request`/`Response` API, which will allow your route handlers to run natively inside **Next.js, SvelteKit, Nuxt, SolidStart, Analog (Angular), TanStack Start, cloudflare workers, vercel functions, netlify functions and many more platforms by leveraging Hono js** — with no separate backend server to host, deploy, or maintain. Your fullstack app will become your backend.

### A cohesive experience for the JavaScript ecosystem

The long-term vision will be to give TypeScript developers a cohesive, batteries-included experience — authentication, authorization, job scheduling, notifications, queues, caching, file storage, and more — designed from the ground up for the modern JavaScript fullstack world. There will be no framework lock-in, no vendor lock-in, just great primitives that fit together.

### The framework experience

On top of the agnostic core, a separate opinionated, batteries-included framework layer will be introduced. Unlike the core library, it will not be agnostic — it will make deliberate choices so you will not have to. It will be delivered as a **Vite plugin** that can be dropped into most modern frontend frameworks — Next.js, SvelteKit, Nuxt, SolidStart, TanStack Start, Analog, and more — and will lean heavily on **code generation** to eliminate boilerplate, auto-wire components, and provide a truly integrated developer experience with a convention-over-configuration feel directly inside your existing fullstack app.

---

## ⭐ Find this library useful?

If you see potential in @daiso-tech/core, starring the repo on GitHub helps others discover it and motivates continued development. It takes one click and means a lot.

[Star on GitHub](https://github.com/daiso-tech/daiso-core)

---

## 📖 Get Started

Check out the [documentation](https://daiso-tech.dev/docs/installation) to get up and running in minutes.
