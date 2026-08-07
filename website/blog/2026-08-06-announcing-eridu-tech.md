---
slug: 2026-08-06-announcing-eridu-tech
title: Announcing eridu-tech - A Modular Backend Platform for TypeScript
authors: [yousif]
tags: [announcement]
date: 2026-08-06
---

# Announcing eridu-tech

**eridu-tech is a framework-agnostic backend platform for TypeScript: composable infrastructure components, middleware, configuration, and routing that can be embedded into the framework you already use.**

## My story

Four years ago, I tried running NestJS inside Next.js. It wasn't as simple as I expected. Embedding NestJS's server meant relying on Next.js configuration that wasn't typed, while using NestJS as a DI container depended on TypeScript's experimental decorators, which didn't work well with Next.js.

So I split the application into separate frontend and backend parts. First, I used two repositories; later, I moved to a monorepo. Neither approach was ideal. Separate repositories meant separate servers and deployments to keep in sync, while the monorepo added its own setup and maintenance overhead.

I then tried embedding Hono directly into Next.js. That solved the routing problem, but Hono is intentionally lightweight, so I ended up patching together different libraries to fill the gaps.

At work, I ran into another set of problems with a frontend and backend in a monorepo. Transactions, logging, and observability started leaking into business logic, making the code harder to read, test, and maintain. Deployment was also slow and manual, without blue-green deployments, easy rollbacks, or integrated CI/CD.

These problems were amplified by tight deadlines. There was rarely enough time to build the surrounding infrastructure properly, so we ended up cutting corners or spending time stitching libraries together.

**That's why I built eridu-tech: to provide the reusable backend infrastructure I kept needing without tying it to a specific application framework.** It combines adapter-first components, framework-agnostic middleware, an embeddable HTTP router, and a common type-safe foundation.

The goal is simple: **make it easier to ship maintainable backend systems under real-world time constraints, without sacrificing architecture just to move faster.**

## 💡 The idea behind eridu-tech

eridu-tech is built around a few core ideas.

#### 🧩 Bring your own framework

**Your backend infrastructure shouldn't force you to adopt a particular application framework.**

eridu-tech doesn't require its own DI container, so it can be integrated with frameworks such as Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start. A package tied to a framework's container also ties you to that container's scopes and lifecycle, which can become implicit constraints on your architecture. Moving the package elsewhere can then mean untangling or rewriting those bindings.

eridu-tech keeps those concerns separate.

#### 🔄 Switch infrastructure without rewriting business logic

**Infrastructure choices should stay behind stable adapters.**

Postgres today, another storage implementation tomorrow. Adapter-based components let you change infrastructure implementations without coupling your business logic directly to them.

#### 🧪 Test components without Docker

**Every component ships with an in-memory adapter where practical, making application tests faster and easier to run.**

Components also come with reusable tests that can be used when creating custom adapters, helping verify that different implementations behave consistently.

#### 🛡️ Type-safe from day one

**TypeScript is part of the design rather than an afterthought.**

eridu-tech uses precise generics, schema validation, and ESM-native packages without CommonJS baggage.

## 🏗️ A unified foundation

**The components are designed to work together through a small set of shared primitives rather than through a framework-specific runtime.**

- **Serde** — a shared serialization engine used across components.
- **Execution context** — a shared execution context that can travel across components.
- **Config & env access** — standardized, type-safe patterns for reading configuration and environment variables through `ConfigAccessor` and `EnvAccessor`.
- **Middleware** — composable, framework-agnostic middleware that can be applied to methods or functions.
- **HttpRouter** — a framework-agnostic HTTP router built on the performant Hono router engine and implementing the WinterTC Fetch API, designed to embed directly into full-stack frameworks such as Next.js.

The platform is also being extended with **transaction context, observability, dependency injection, deployment tooling, and component introspection**. These are part of the roadmap rather than capabilities I want to present as finished today.

## 🧑‍💻 The developer workflow

Here's the workflow I'm building toward with eridu-tech: **start with validated inputs, keep configuration structured, wire dependencies consistently, and keep infrastructure concerns out of business logic.**

1. 🔑 **Environment variables are often read inconsistently** — missing validation, runtime errors, and duplicated parsing logic can spread throughout an application. eridu-tech provides a **standardized, type-safe way to read and validate environment variables**, so your application gets the values it expects.

2. ⚙️ **Configuration becomes difficult to maintain as applications grow.** A small configuration can turn into a deeply nested, untyped object or a collection of smaller configurations scattered across the codebase. eridu-tech provides a **standardized, type-safe pattern for defining domain configurations**, with a **maximum nesting depth of two**, and deriving values from validated environment variables.

3. 🔌 **Manually wiring services and infrastructure gets harder to maintain as an application grows.** eridu-tech provides a **structured way to wire your own services and infrastructure components** by dependency injection container, using domain configuration to drive the setup so the wiring remains consistent and maintainable.

4. 🛠️ **Cross-cutting concerns can quickly leak into business logic.** Retries, timeouts, rate limiting, circuit breaking, concurrency control, and observability can make otherwise simple methods difficult to read and test. eridu-tech provides **predefined, framework-agnostic middleware** so these concerns can be applied without cluttering business logic.

   - 🔁 Retry
   - ⏱️ Timeout
   - 🚦 Rate limiting
   - 🧯 Circuit breaking
   - 🔒 Concurrency control — distributed locks, semaphores, and reader-writer locks
   - 📊 Observability — logging, tracing, and metrics

5. 🔁 **Coordinating transactions across databases, event buses, and job schedulers is error-prone.** The roadmap includes a **shared transaction context and transaction middleware** so components can participate in the same transaction, with event dispatch coordinated around successful commits and scheduled jobs able to participate in the transaction model.

6. 📡 **Propagating execution context across servers, processes, and asynchronous boundaries can require significant boilerplate.** The roadmap includes **serialization and propagation of execution context across runtimes**, so request and correlation information can remain available throughout distributed systems.

7. 🌐 **Full-stack applications can require separate backend services, repositories, and deployments.** The embeddable `HttpRouter` is designed to let the backend run directly inside full-stack frameworks such as Next.js, providing a path toward deploying the frontend and backend together without maintaining a separate backend service.

8. 🚀 **Deploying an application and its infrastructure can be slow and manual.** The roadmap includes a **deployment CLI** for deploying applications and infrastructure to a VPS via SSH, with blue-green deployments, rollbacks, and GitHub Actions CI/CD scripts.

9. 🔍 **When something goes wrong, component runtime state can be difficult to inspect.** The roadmap includes **component-level introspection APIs** that would allow the CLI to inspect runtime data during development and production.

## What's available today

**The current focus is the composable foundation and the components that are already usable.** The roadmap features above are being developed incrementally rather than being presented as completed capabilities.

The [component overview](/docs/components/overview) walks through the available eridu-tech components — including the foundation, storage, and infrastructure building blocks — with in-memory adapters for fast testing and pluggable adapters for real infrastructure.

## 🔗 What's next

eridu-tech is pre-v1 and evolving quickly. The [roadmap](/docs/roadmap) shows what's planned and in progress across the ecosystem.

If the problems behind eridu-tech sound familiar, **try the components, explore the architecture, and let me know what you think.** I'm especially interested in feedback from developers who have dealt with the same problems around framework coupling, infrastructure abstractions, testing, and keeping backend code maintainable under tight deadlines.
