---
sidebar_position: 0
---

# Overview

`@daiso-tech/core` is a modular, adapter-first TypeScript library for building
production-ready backend applications. Every component ships with in-memory
adapters for fast, deterministic testing — and pluggable adapters to swap in
real infrastructure without touching your
business logic.

Here is an index of every component, grouped by responsibility.

## Foundation

The building blocks that power the rest of the ecosystem.

- **[Middleware and AOP](/docs/components/middleware)** — Composable middleware
  pipeline with before/after hooks and error handling — the foundation for
  every component's plugin system.
- **[Collection](/docs/components/collection)** — Type-safe collection
  utilities with powerful query, transform, and pagination primitives.
- **[Serde](/docs/components/serde)** — Serialize and deserialize data with a
  built-in SuperJSON adapter (Date, Map, Set, BigInt) and custom serializers —
  the backbone for all data interchange across the ecosystem.
- **[Codec](/docs/components/codec)** — Encode and decode data with a unified,
  type-safe interface — includes a built-in Base64 codec and lets you build
  custom codecs for any protocol.
- **[Execution Context](/docs/components/execution_context)** — Type-safe,
  composable context propagation for request IDs, user info, and tracing
  metadata across async boundaries — without thread-local hacks.
- **[Typed Config Access](/docs/components/config_accessor)** — Standardized
  type-safe access to domain configuration variables — with optional schema
  validation and full TypeScript inference.
- **[Typed Env Access](/docs/components/env_accessor)** — Type-safe environment
  variable access from multiple sync/async sources with parsing, defaults, and
  validation — never read `process.env` raw again.

## Storage

Persist and retrieve data behind a single, portable API.

- **[Cache](/docs/components/cache/cache_usage)** — Caching with
  pluggable stores (in-memory, Redis, etc.), TTL policies, and stampede
  protection.
- **[File Storage](/docs/components/file_storage/file_storage_usage)** —
  Abstract file storage with adapters for local disk, S3-compatible, and other
  backends — upload, stream, and serve with one API.

## Reliability

Keep your services available and responsive under load and failure.

- **[Circuit Breaker](/docs/components/circuit_breaker/circuit_breaker_usage)**
  — Prevent cascading failures with configurable thresholds, half-open
  recovery, and custom fallback strategies.
- **[Rate Limiter](/docs/components/rate-limiter/rate_limiter_usage)** —
  Throttle request rates with configurable limits, sliding windows, and
  pluggable backends — protect your services from overload.
- **[Resilience](/docs/components/resilience)** — Timeout, fallback, and retry,
  with configurable policies and backoffs.

## Concurrency

Coordinate access to shared resources across processes and machines.

- **[Lock](/docs/components/lock/lock_usage)** — Distributed lock primitives
  with lease management, blocking and non-blocking acquisition, and automatic
  release.
- **[Shared Lock](/docs/components/shared_lock/shared_lock_usage)** — Read-write
  distributed locks for coordinating concurrent access with shared and
  exclusive modes.
- **[Semaphore](/docs/components/semaphore/semaphore_usage)** — Rate-limit
  concurrent access to shared resources with dynamic permit allocation.

## Messaging

Decouple your services with reliable, asynchronous communication.

- **[Event Bus](/docs/components/event_bus/event_bus_usage)** — Pub/sub event
  bus for dispatching and listening to events with pluggable transport
  backends — independent of underlying technology.

## Web

Serve HTTP and build framework-agnostic APIs.

- **[HTTP Router](/docs/components/http_router/http_router_usage)** —
  Framework-agnostic HTTP router built on the Hono router engine — implements
  the Winter TC fetch standard with middleware chains and typed path
  parameters.

## Utilities

Small, focused helpers shared across the ecosystem.

- **[Backoff policies](/docs/components/backoff_policies)** — Predefined
  constant and exponential backoff policies with jitter support for
  controlling retry and resilience delays.
- **[FileSize](/docs/components/file_size)** — An easy way to define,
  manipulate, and compare file sizes — designed for easy integration with
  external file-size libraries.
- **[TimeSpan](/docs/components/time_span)** — An easy way to define,
  manipulate, and compare durations — designed for easy integration with
  external time libraries like Luxon and Dayjs.