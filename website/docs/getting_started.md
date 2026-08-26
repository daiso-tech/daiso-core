---
sidebar_position: 1
---

# Getting started

**Write business logic once. Replace infrastructure anytime.**

eridu-tech is an adapter-first backend foundation toolkit for TypeScript, purpose-built for developing majestic modular monoliths. It provides a comprehensive ecosystem of officially maintained components like caching, locking, rate limiting, event buses, HTTP routing, resilience, and more that integrate seamlessly with popular frameworks like Next.js, Nuxt, Express, and NestJS.

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
