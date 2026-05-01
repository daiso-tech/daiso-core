---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating shared-lock adapters
tags:
    - Shared-lock
    - Creating adapters
    - Creating database adapters
keywords:
    - Shared-lock
    - Creating adapters
    - Creating database adapters
---

# Creating shared-lock adapters

## Implementing your custom ISharedLockAdapter

In order to create an adapter you need to implement the [`ISharedLockAdapter`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLockAdapter.html) contract.

## Testing your custom ISharedLockAdapter

We provide a complete test suite to test your shared-lock adapter implementation. Simply use the [`sharedLockAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Lock.lockAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MySharedLockAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { sharedLockAdapterTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
import { MemorySharedLockAdapter } from "./MemorySharedLockAdapter.js";

describe("class: MySharedLockAdapter", () => {
    sharedLockAdapterTestSuite({
        createAdapter: () => new MemorySharedLockAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom IDatabaseSharedLockAdapter

We provide an additional contract [`IDatabaseSharedLockAdapter`](https://daiso-tech.github.io/daiso-core/types/SharedLock.IDatabaseSharedLockAdapter.html) for building custom shared-lock adapters tailored to databases.

## Testing your custom IDatabaseSharedLockAdapter

We provide a complete test suite to test your database shared-lock adapter implementation. Simply use the [`databaseSharedLockAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/SharedLock.databaseSharedLockAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { databaseSharedLockAdapterTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
import { MyDatabaseSharedLockAdapter } from "./MyDatabaseSharedLockAdapter.js";

describe("class: MyDatabaseSharedLockAdapter", () => {
    databaseSharedLockAdapterTestSuite({
        createAdapter: async () => {
            return new MyDatabaseSharedLockAdapter(),
        },
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ISharedLockFactory class

In some cases, you may need to implement a custom [`SharedLockFactory`](https://daiso-tech.github.io/daiso-core/classes/SharedLock.SharedLockFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ISharedLockFactory`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLockFactory.html) contract.

## Testing your custom ISharedLockFactory class

We provide a complete test suite to verify your custom event bus class implementation. Simply use the [`sharedLockProviderTestSuite`](https://daiso-tech.github.io/daiso-core/functions/SharedLock.sharedLockProviderTestSuite.html) function:

- Preconfigured Vitest test cases
- Standardized event bus behavior validation
- Common edge case coverage

Usage example:

```ts
// filename: MySharedLockFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { sharedLockProviderTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
import { MySharedLockFactory } from "./MySharedLockFactory.js";

describe("class: MySharedLockFactory", () => {
    sharedLockProviderTestSuite({
        createSharedLockFactory: () => new MySharedLockFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Further information

For further information refer to [`@daiso-tech/core/shared-lock`](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) API docs.
