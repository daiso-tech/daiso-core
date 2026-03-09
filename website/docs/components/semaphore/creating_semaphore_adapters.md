---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating semaphore adapters
tags:
 - Semaphore
 - Creating adapters
 - Creating database adapters
keywords:
 - Semaphore
 - Creating adapters
 - Creating database adapters
---

# Creating semaphore adapters

## Implementing your custom ISemaphoreAdapter

In order to create an adapter you need to implement the [`ISemaphoreAdapter`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphoreAdapter.html) contract.

## Testing your custom ISemaphoreAdapter

We provide a complete test suite to test your semaphore adapter implementation. Simply use the [`semaphoreAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Semaphore.semaphoreAdapterTestSuite.htmll) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MySemaphoreAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreAdapterTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
import { MemorySemaphoreAdapter } from "./MemorySemaphoreAdapter.js";

describe("class: MySemaphoreAdapter", () => {
    semaphoreAdapterTestSuite({
        createAdapter: () => new MemorySemaphoreAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom IDatabaseSemaphoreAdapter

We provide an additional contract [`IDatabaseSemaphoreAdapter`](https://daiso-tech.github.io/daiso-core/types/Semaphore.IDatabaseSemaphoreAdapter.html) for building custom semaphore adapters tailored to databases.

## Testing your custom IDatabaseSemaphoreAdapter

We provide a complete test suite to test your database semaphore adapter implementation. Simply use the [`databaseSemaphoreAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Semaphore.databaseSemaphoreAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { databaseSemaphoreAdapterTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
import { MyDatabaseSemaphoreAdapter } from "./MyDatabaseSemaphoreAdapter.js";

describe("class: MyDatabaseSemaphoreAdapter", () => {
    databaseSemaphoreAdapterTestSuite({
        createAdapter: async () => {
            return new MyDatabaseSemaphoreAdapter(),
        },
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ISemaphoreProvider class

In some cases, you may need to implement a custom [`SemaphoreProvider`](https://daiso-tech.github.io/daiso-core/classes/Semaphore.SemaphoreProvider.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ISemaphoreProvider`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphoreProvider.html) contract.

## Testing your custom ISemaphoreProvider class

We provide a complete test suite to verify your custom event bus class implementation. Simply use the [`semaphoreProviderTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Semaphore.semaphoreProviderTestSuite.html) function:

- Preconfigured Vitest test cases
- Standardized event bus behavior validation
- Common edge case coverage

Usage example:

```ts
// filename: MySemaphoreProvider.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreProviderTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
import { MySemaphoreProvider } from "./MySemaphoreProvider.js";

describe("class: MySemaphoreProvider", () => {
    semaphoreProviderTestSuite({
        createSemaphoreProvider: () => new MySemaphoreProvider(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Further information

For further information refer to [`@daiso-tech/core/semaphore`](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) API docs.
