---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating SharedLock adapters
tags:
    - SharedLock
    - Creating adapters
keywords:
    - SharedLock
    - Creating adapters
---

# Creating SharedLock adapters

## Implementing your custom ISharedLockAdapter

In order to create an adapter you need to implement the [`ISharedLockAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.ISharedLockAdapter.html) contract.

## Testing your custom ISharedLockAdapter

We provide a complete test suite to test your shared-lock adapter implementation. Simply use the [`sharedLockAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Lock.lockAdapterTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized shared-lock adapter contract conformance
testing.

Usage example:

```ts file=./creating_shared_lock_adapters-samples/shared_lock_adapter_test_suite.ts
```

## Implementing your custom ISharedLockFactory class

In some cases, you may need to implement a custom [`SharedLockFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/SharedLock.SharedLockFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ISharedLockFactory`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.ISharedLockFactory.html) contract.

## Testing your custom ISharedLockFactory class

We provide a complete test suite to verify your custom event-bus class implementation. Simply use the [`sharedLockProviderTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/SharedLock.sharedLockProviderTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized shared-lock factory contract conformance
testing.

Usage example:

```ts file=./creating_shared_lock_adapters-samples/shared_lock_factory_test_suite.ts
```

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.
