---
sidebar_position: 1
---

# Installation

## Prerequisites

- Node.js installed (version 20.0.0)
- npm/yarn/pnpm package manager

## Install the Package

Run the following command to install the library:

```bash
npm install @daiso-tech/core
```

## Configuration

#### Set Module Type:

`@daiso-tech/core` exclusively uses ESM (ECMAScript Modules). To configure your project:

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
