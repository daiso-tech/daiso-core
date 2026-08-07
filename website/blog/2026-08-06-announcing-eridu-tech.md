---
slug: announcing-eridu-tech
title: eridu-tech Announcement - A Modular Backend Platform for TypeScript
authors: [yousif]
tags: [announcement]
date: 2026-08-06
---
<!-- - ta punkt form. 
- läg in "Four years ago, in a project I tried ..."
-  skriv is still inte lika enkelt: "It wasnt that easy as I though. I tried ..." 
-  minska på hela text -->


**eridu-tech Announcement - A Modular Backend Platform for TypeScript**

<!-- ## Adasda

Four years ago, I tried running NestJS inside Next.js, but neither approach worked: embedding NestJS's server relied on Next.js config that was untyped, and using NestJS as a DI container depended on TypeScript's experimental decorators, which didn't work well with Next.js.

So I split the app into separate frontend and backend parts, first two repos, then a monorepo. Both added overhead: monorepos are complex to set up, and separate repos mean separate servers and deploys to keep in sync. I then tried embedding Hono directly into Next.js, but Hono isn't battery-included, so I ended up patching together different libraries to fill the gaps.

At work, I ended up with a monorepo containing a frontend and backend. Beyond the monorepo overhead, new pains showed up. Transactions, logging, and observability cluttered my business logic. That made the code genuinely hard to read, test, and maintain, and even AI couldn't help. Deployment had no blue-green deployments, no rollbacks, and no integrated CI/CD. It was a slow, manual, and risky process.

Those pains are why I built eridu-tech: adapter-first components, framework-agnostic middleware, an embeddable router, and a deployment CLI, all type-safe and built to work together. -->


## My story

Four years ago, I tried running NestJS inside Next.js, but neither approach worked: embedding NestJS's server relied on Next.js config that was untyped, and using NestJS as a DI container depended on TypeScript's experimental decorators, which didn't work well with Next.js.

So I split the app into separate frontend and backend parts, first two repos, then a monorepo. Both added overhead: monorepos are complex to set up, and separate repos mean separate servers and deploys to keep in sync. I then tried embedding Hono directly into Next.js, but Hono isn't battery-included, so I ended up patching together different libraries to fill the gaps.

At work, I ended up with a monorepo containing a frontend and backend. Beyond the monorepo overhead, new pains showed up. Transactions, logging, and observability cluttered my business logic. That made the code genuinely hard to read, test, and maintain, and even AI couldn't help. Deployment had no blue-green deployments, no rollbacks, and no integrated CI/CD. It was a slow, manual, and risky process. All of these problems came from extremely tight deadlines: there was never time to do things properly.

Those pains are why I built eridu-tech. It answers exactly these problems: adapter-first components, framework-agnostic middleware, an embeddable router, and a deployment CLI, all type-safe and built to work together. It's built for speed, so under tight deadlines you can ship quality instead of cutting corners and wasting time patching together different libraries.

---

## 💡 The idea behind eridu-tech

### 🔄 Switch infrastructure without rewriting business logic:
Postgres today, Redis tomorrow, no refactoring required, switch to different adapters.

### 🧪 Test everything without Docker:
Every component ships with an in-memory adapter making application tests faster. Most component comes with built-in reusable tests making it easier creating custom adapters.

### 🧩 Bring your own framework:
eridu-tech doesn't require a DI container, so you can plug it into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start. A package tied to a framework's container forces you to work with that DI container, and its scopes and lifecycle become implicit constraints on your architecture. Moving it elsewhere means untangling or rewriting those bindings. eridu-tech has none of that.

### 🛡️ Type-safe from day one:
Full TypeScript support with precise generics, standard schema validation built in, and ESM-native, no CommonJS baggage.

### 🏗️ The shared foundation:
- **Serde** — a single serialization engine, shared across every component.
- **Execution context** — a single execution context, shared across every component.
- **Config & env access** — standard type-safe patterns for reading configuration and environment variables (ConfigAccessor and EnvAccessor), works across every component.
- **Middleware** — composable, agnostic middleware that can be applied to any method or function, works across every component.
- **Transaction context (coming soon)** — used across every component for transaction awareness.
- **Observability (coming soon)** — traces, logs, and metrics, works across every component.
- **Dependency injection (coming soon)** — Integrates across every component.
- **HttpRouter** — a framework-agnostic HTTP router built on the Hono engine, implements the Winter TC Fetch API that can be embedded directly into fullstack frameworks like Next.js.
- **CLI & deployment (coming soon)** — a prebuilt CLI that deploys your app and its infrastructure to a VPS via SSH with blue-green deployments, easy rollbacks, and GitHub Actions CI/CD scripts for automation.
- **Introspection (coming soon)** — every component implements its own introspection API, so the CLI can inspect each component's runtime data during production and development.

---

## 🧑‍💻 The developer workflow

Here's what building with eridu-tech looks like, step by step:
1. 🔑 Reading environment variables is usually done **inconsistently** — **missing validation, runtime errors, and duplicated parsing logic everywhere**. eridu-tech gives you a **standardized, type-safe way** to read and validate them, so what's in your environment is exactly what your code expects.

2. ⚙️ You start with one small, untyped configuration — but as the app grows you end up with a large, heavily nested config that's still untyped, or a handful of smaller untyped configs scattered across the codebase. eridu-tech gives you a **standardized, type-safe pattern for defining domain configurations** — with a **maximum nesting depth of two** — where you derive values from your validated environment variables, keeping config **simple, typed, and maintainable**.

3. 🔌 Wiring services, infrastructure, and dependencies **by hand gets harder to maintain** as your app grows. eridu-tech gives you a **structured way to wire up your own services and its infrastructure components**, using your **domain configuration to drive the process** — so wiring stays **consistent and maintainable**.

4. 🛠️ Cross-cutting concerns like retries, timeouts, and observability normally end up **scattered through business logic**, making it harder to read, test, and maintain. eridu-tech applies them **automatically with predefined, framework-agnostic middleware**, keeping your **business logic clean**. Here are some of the predefined middlewares:
    - 🔁 Retry
    - ⏱️ Timeout
    - 🚦 Rate limiting
    - 🧯 Circuit breaking
    - 🔒 Concurrency control — distributed locks, semaphores, and reader-writer locks
    - 📊 Observability — logging, tracing, and metrics

5. 🔁 Manually coordinating transactions across databases, event buses, and job schedulers is **error-prone** and can leave **state inconsistent or event delivery unreliable**. In eridu-tech, every component is **transaction-aware and joins the same transaction** — wrap your business logic in **transaction middleware**, and **events are dispatched only after a successful commit** while **scheduled jobs reliably join in**. (coming soon)

6. 📡 Propagating execution context like request or correlation IDs across servers, processes, and async boundaries normally takes **significant boilerplate and is easy to get wrong**. eridu-tech **serializes and propagates execution context across runtimes automatically** — no developer intervention — so **observability stays continuous** throughout distributed systems. (coming soon)

7. 🌐 Full-stack apps usually mean **maintaining separate backend services, repositories, and deployments**. eridu-tech wires everything together with a **framework-agnostic HTTP router that embeds directly into frameworks like Next.js** — so your backend and frontend **deploy together as a single app**, with no separate servers, repositories, or monorepo to manage. (coming soon)

8. 🚀 Deploying an app along with its infrastructure is usually **slow and error-prone** — provisioning servers, wiring things up, and getting the first deploy out can take days. eridu-tech ships a **prebuilt CLI that deploys your app and its infrastructure to a VPS** via SSH with **blue-green deployments and easy rollbacks**, plus **GitHub Actions CI/CD scripts** to automate it all — so you're up and running fast, and safe to ship often. (coming soon)

9. 🔍 When something goes wrong, you're often left guessing — **component runtime state is hidden and hard to inspect**. eridu-tech's CLI lets you **introspect every component's runtime data** during production and development, because every component implements **its own introspection API** — so you can see exactly what's happening and **debug with confidence**. (coming soon)

---

## 🔗 Learn more

The [component overview](/docs/components/overview) walks through every eridu-tech component — the foundation, storage, and infrastructure building blocks — each with in-memory adapters for fast testing and pluggable adapters for real infrastructure. The [roadmap](/docs/roadmap) shows everything planned and in progress across the ecosystem, so you can see what's shipping next.

eridu-tech is pre-v1 and evolving fast. Try the components, check the roadmap, and I'd love your feedback.
