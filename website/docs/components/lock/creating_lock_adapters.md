---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating lock adapters
tags:
 - Lock
 - Creating adapters
 - Creating database adapters
keywords:
 - Lock
 - Creating adapters
 - Creating database adapters
---

# Creating lock adapters

## Implementing your custom ILockAdapter

In order to create an adapter you need to implement the [`ILockAdapter`](https://daiso-tech.github.io/daiso-core/types/Lock.ILockAdapter.html) contract.

## Testing your custom ILockAdapter

We provide a complete test suite to test your lock adapter implementation. Simply use the [`lockAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Lock.lockAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MyLockAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { lockAdapterTestSuite } from "@daiso-tech/core/lock/test-utilities";
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

## Implementing your custom IDatabaseLockAdapter

We provide an additional contract [`IDatabaseLockAdapter`](https://daiso-tech.github.io/daiso-core/types/Lock.IDatabaseLockAdapter.html) for building custom lock adapters tailored to databases.

## Testing your custom IDatabaseLockAdapter

We provide a complete test suite to test your database lock adapter implementation. Simply use the [`databaseLockAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Lock.databaseLockAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { databaseLockAdapterTestSuite } from "@daiso-tech/core/lock/test-utilities";
import { MyDatabaseLockAdapter } from "./MyDatabaseLockAdapter.js";

describe("class: MyDatabaseLockAdapter", () => {
    databaseLockAdapterTestSuite({
        createAdapter: async () => {
            return new MyDatabaseLockAdapter(),
        },
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ILockFactory class

In some cases, you may need to implement a custom [`LockFactory`](https://daiso-tech.github.io/daiso-core/classes/Lock.LockFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ILockFactory`](https://daiso-tech.github.io/daiso-core/types/Lock.ILockFactory.html) contract.

## Testing your custom ILockFactory class

We provide a complete test suite to verify your custom lock factory class implementation. Simply use the [`lockFactoryTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Lock.lockFactoryTestSuite.html) function:

- Preconfigured Vitest test cases
- Standardized lock factory behavior validation
- Common edge case coverage

Usage example:

```ts
// filename: MyLockFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { lockFactoryTestSuite } from "@daiso-tech/core/lock/test-utilities";
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

For further information refer to [`@daiso-tech/core/lock`](https://daiso-tech.github.io/daiso-core/modules/Lock.html) API docs.
