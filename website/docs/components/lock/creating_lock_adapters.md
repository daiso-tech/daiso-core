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

```ts
// filename: MyLockAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { lockAdapterTestSuite } from "eridu-tech/lock/test-utilities";
import { MemoryLockAdapter } from "./MemoryLockAdapter.js";

describe("class: MyLockAdapter", () => {
    lockAdapterTestSuite({
        createAdapter: () => new MemoryLockAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ILockFactory class

In some cases, you may need to implement a custom [`LockFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/Lock.LockFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ILockFactory`](https://eridu-tech.github.io/eridu-tech-core/types/Lock.ILockFactory.html) contract.

## Testing your custom ILockFactory class

We provide a complete test suite to verify your custom lock factory class implementation. Simply use the [`lockFactoryTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Lock.lockFactoryTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized lock factory contract conformance
testing.

Usage example:

```ts
// filename: MyLockFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { lockFactoryTestSuite } from "eridu-tech/lock/test-utilities";
import { MyLockFactory } from "./MyLockFactory.js";

describe("class: MyLockFactory", () => {
    lockFactoryTestSuite({
        createLockFactory: () => new MyLockFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.
