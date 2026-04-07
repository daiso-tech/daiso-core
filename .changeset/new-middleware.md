---
"@daiso-tech/core": minor
---

- **Unified Middleware System**: Introduced a new middleware component that replaces the legacy Hooks system.
    - **Hybrid Support**: Natively handles both synchronous and asynchronous functions within a single interface.
    - **Execution Context**: Added full support for passing execution context through the middleware chain.
    - **Priority Management**: Built-in support for defining execution order via priority levels.

### Changed

- **Deprecated Hooks Component**: The legacy Hooks system is being phased out to reduce architectural complexity.
    - **Simplified API**: Removed the need for separate classes for sync and async hooks, significantly reducing boilerplate.
    - **Refined DX**: Replaced the verbose and complex Hooks API with a more ergonomic and streamlined middleware pattern.
