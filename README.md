# @daiso-tech/core

[![npm version](https://img.shields.io/npm/v/@daiso-tech/core)](https://www.npmjs.com/package/@daiso-tech/core)
![NPM Downloads](https://img.shields.io/npm/dy/@daiso-tech/core)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white)
[![ES Modules](https://img.shields.io/badge/module%20type-ESM-blue)](https://nodejs.org/api/esm.html)
[![License](https://img.shields.io/npm/l/@daiso-tech/core)](LICENSE)

`@daiso-tech/core` is a **TypeScript-first backend toolkit** designed for building resilient web applications and API servers. It provides a suite of decoupled, high-performance components that work seamlessly across any JavaScript runtime.

[**Explore the Docs**](https://daiso-core.vercel.app/docs/installation) | [**NPM Package**](https://www.npmjs.com/package/@daiso-tech/core)

---

## 🚀 Key Features

* **Framework Agnostic** No Dependency Injection (DI) containers required. Effortlessly integrate with Express, NestJS, AdonisJS, or full-stack frameworks like Next.js, Nuxt, and TanStack Start.
* **Runtime Portability** Leverages the **Adapter Pattern** to decouple your logic from the runtime. Switch between Node.js, Cloudflare Workers (Durable Objects), or AWS Lambda without rewriting core logic.
* **Test-Driven Excellence** Every component includes a built-in **"in-memory" adapter**. Run unit tests instantly without spinning up databases or external infrastructure.
* **Type Safety & DX** Deep IntelliSense support and strict type-safety. Designed for auto-imports and modern developer workflows.
* **Standard Schema Support** Native integration with [Standard Schema](https://standardschema.dev/), allowing you to use **Zod**, **Valibot**, or **ArkType** for unified runtime validation.

---

## 🛠 Quick Start

```bash
npm install @daiso-tech/core
```

## 📦 Core Components

The `@daiso-tech/core` ecosystem provides a growing collection of officially maintained primitives for building robust systems:

### Resilience
| | |
| :--- | :--- |
| **Circuit Breaker** | Prevents cascading failures by stopping calls to failing external services. |
| **Rate Limiter** | Controls traffic flow to protect your network interfaces and services. |
| **Retry** | Retry middleware with support for different backoffs with jitter. |
| **Timeout** | Timeout middleware that prevents resource exhaustion by killing long-running tasks. |
| **Fallback** | Fallback middleware that ensures graceful degradation by returning default values. |

### Concurrency
| | |
| :--- | :--- |
| **Lock** | Ensures mutual exclusion for shared resources across servers or procceses. |
| **Semaphore** | Limits the number of concurrent servers or procceses accessing a specific resource. |
| **Shared Lock** | Reader-writer lock coordinating concurrent reads and exclusive writes. |

### Misc
| | |
| :--- | :--- |
| **Cache** | High-performance caching with support for multiple store adapters. |
| **EventBus** | Decoupled event-driven communication (In-memory or Distributed via redis). |

### Utilities
| | |
| :--- | :--- |
| **Hooks** | Agnostic sync/async middleware that integrates with all components. |
| **Serde** | Custom serialization/deserialization logic that integrates with all components. |
| **Collection** | Precision filtering and transformation for Arrays, Iterables, AsyncIterables and ArrayLike objects. |
| **TimeSpan** | A duration class offering seamless time manipulation while integrating with all components. |
---

## 🛠 Quick Start

```bash
npm install @daiso-tech/core
```