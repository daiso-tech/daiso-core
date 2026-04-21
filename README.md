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

### 🧰 Utilities

- **Serde**: Add custom serialization and deserialization logic that integrates transparently with every other component in the library.
- **Collection**: Effortlessly work with Arrays, Iterables, and AsyncIterables using a rich, composable, and lazy collection API.
- **Execution context**: Propagate request-scoped data — user info, trace IDs, tenant context — across async boundaries. Integrates transparently with all components and adapters.

---

## ⭐ Find this library useful?

If you see potential in @daiso-tech/core, starring the repo on GitHub helps others discover it and motivates continued development. It takes one click and means a lot.

[Star on GitHub](https://github.com/daiso-tech/daiso-core)

---

## 📖 Get Started

Check out the [documentation](https://daiso-tech.dev/docs/installation) to get up and running in minutes.
