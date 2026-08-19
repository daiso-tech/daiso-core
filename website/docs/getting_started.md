---
sidebar_position: 1
---

# Getting started

**Write business logic once. Replace infrastructure anytime.**

eridu-tech is an adapter-first backend platform for TypeScript, purpose-built for developing and operating majestic modular monoliths. It provides a comprehensive ecosystem of officially maintained components—caching, locking, rate limiting, event buses, HTTP routing, resilience, and more—that integrate seamlessly with popular frameworks like Next.js, Nuxt, Express, and NestJS.

Built on a unified architecture of a single serialization engine, a single execution context, and composable middleware, eridu-tech keeps your code decoupled from vendors. Switch infrastructure without rewriting business logic, test everything without Docker using in-memory adapters, and stay type-safe from day one.

This guide covers the basics: installation and configuration.

## Prerequisites

- Node.js installed (version 24 and up)
- npm/yarn/pnpm package manager

## Installation

Run the following command to install the library:

```bash
npm install eridu-tech
```

## Configuration

#### Set Module Type:

`eridu-tech` exclusively uses ESM (ECMAScript Modules). To configure your project:

1. Open your `package.json`
2. Add or update the `type` field:

```json
{
    "type": "module"
    // ... your existing configurations
}
```

:::info
This is only required when running in Node.js. Frameworks like `Next.js`, `SvelteKit.js` and `Nuxt.js` use bundlers that support ESM modules automatically.
:::
