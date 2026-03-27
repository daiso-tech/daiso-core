# @daiso-tech/core

[![npm version](https://img.shields.io/npm/v/@daiso-tech/core)](https://www.npmjs.com/package/@daiso-tech/core)
![NPM Downloads](https://img.shields.io/npm/dy/@daiso-tech/core)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white)
[![ES Modules](https://img.shields.io/badge/module%20type-ESM-blue)](https://nodejs.org/api/esm.html)
[![License](https://img.shields.io/npm/l/@daiso-tech/core)](LICENSE)

`@daiso-tech/core` is a **TypeScript-first backend toolkit** designed for building resilient web applications and API servers. It provides a suite of decoupled, high-performance components that work seamlessly across any JavaScript runtime. 

This framework is specifically optimized for building **modular monoliths** or **majestic monoliths** rather than distributed server architectures.

[**Explore the Docs**](https://daiso-tech.dev/docs/Installation) | [**NPM Package**](https://www.npmjs.com/package/@daiso-tech/core)

---

## 🚀 Key Features

* **Framework Agnostic**: No Dependency Injection (DI) containers required. Effortlessly integrate with Express, NestJS, AdonisJS, or full-stack frameworks like Next.js, Nuxt, and TanStack Start.
* **Runtime Portability**: Leverages the **Adapter Pattern** to decouple your logic from the runtime. Switch between Node.js, Cloudflare Workers (Durable Objects), or AWS Lambda without rewriting core logic.
* **Test-Driven Excellence**: Every component includes a built-in **"in-memory" adapter**. Run integration and unit tests instantly without spinning up databases or external infrastructure.
* **Type Safety & DX**: Deep IntelliSense support and strict type-safety. Designed for auto-imports and modern developer workflows.
* **Standard Schema Support**: Native integration with [Standard Schema](https://standardschema.dev/), allowing you to use **Zod**, **Valibot**, or **ArkType** for unified runtime validation.

---

## 📦 Core Components

The `@daiso-tech/core` ecosystem provides a growing collection of officially maintained primitives for building robust systems:

### 🛡️ Resilience
| Component | The Problem | The Daiso Solution |
| :--- | :--- | :--- |
| **Circuit Breaker** | Cascading failures from external services. | Stops calls to failing services to maintain system stability. |
| **Rate Limiter** | Network interfaces overwhelmed by traffic. | Controls traffic flow to protect services. |
| **Hooks** | Brittle retry/timeout logic. | Agnostic middleware for **Retry, Fallback, and Timeout**. |

### 🚦 Concurrency
| Component | Use Case | Developer Benefit |
| :--- | :--- | :--- |
| **Lock** | Shared resources accessed by multiple processes. | Ensures mutual exclusion to prevent race conditions. |
| **Semaphore** | Limiting access to a specific resource. | Limits the number of concurrent processes. |
| **Shared Lock** | Coordinating reads and writes. | Manages concurrent reads and exclusive writes. |

### 💾 Storage
| Component | Description | Adapters |
| :--- | :--- | :--- |
| **Cache** | High-performance caching. | Supports multiple store adapters. |
| **FileStorage** | High-performance file storage. | Supports multiple storage adapters. |

### 📥 Messaging
| Component | Description | Adapters |
| :--- | :--- | :--- |
| **EventBus** | Decoupled communication. | In-memory or Distributed. |

### 🧰 Utilities
| Component | Feature |
| :--- | :--- |
| **Serde** | Custom serialization/deserialization that integrates with all other components. |
| **TimeSpan** | Easily manage durations that seamlessly integrate with all other components. |
| **FileSize** | Easily manage file-size that seamlessly integrate with all other components. |
| **Collection** | Precision filtering and transformation for Arrays, Iterables, and **AsyncIterables**. |

---

## 🛠 Quick Start

```bash
npm install @daiso-tech/core