---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating Lock adapters
tags:
    - Lock
    - Creating adapters
keywords:
    - Lock
    - Creating adapters
---

# Creating Lock adapters

## Implementing your custom ILockAdapter

In order to create an adapter you need to implement the [`ILockAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/Lock.ILockAdapter.html) contract.

## Testing your custom ILockAdapter

We provide a complete test suite to test your lock adapter implementation. Simply use the [`lockAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Lock.lockAdapterTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized lock adapter contract conformance
testing.

Usage example:

```ts file=./creating_lock_adapters-samples/lock_adapter_test_suite.ts
```

## Implementing your custom ILockFactory class

In some cases, you may need to implement a custom [`LockFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/Lock.LockFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ILockFactory`](https://eridu-tech.github.io/eridu-tech-core/types/Lock.ILockFactory.html) contract.

## Testing your custom ILockFactory class

We provide a complete test suite to verify your custom lock factory class implementation. Simply use the [`lockFactoryTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Lock.lockFactoryTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized lock factory contract conformance
testing.

Usage example:

```ts file=./creating_lock_adapters-samples/lock_factory_test_suite.ts
```

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.
