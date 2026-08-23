---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating Semaphore adapters
tags:
    - Semaphore
    - Creating adapters
keywords:
    - Semaphore
    - Creating adapters
---

# Creating Semaphore adapters

## Implementing your custom ISemaphoreAdapter

In order to create an adapter you need to implement the [`ISemaphoreAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/Semaphore.ISemaphoreAdapter.html) contract.

## Testing your custom ISemaphoreAdapter

We provide a complete test suite to test your semaphore adapter implementation. Simply use the [`semaphoreAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Semaphore.semaphoreAdapterTestSuite.htmll) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized semaphore adapter contract conformance
testing.

Usage example:

```ts
// filename: MySemaphoreAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreAdapterTestSuite } from "eridu-tech/semaphore/test-utilities";
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

## Implementing your custom ISemaphoreFactory class

In some cases, you may need to implement a custom [`SemaphoreFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/Semaphore.SemaphoreFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ISemaphoreFactory`](https://eridu-tech.github.io/eridu-tech-core/types/Semaphore.ISemaphoreFactory.html) contract.

## Testing your custom ISemaphoreFactory class

We provide a complete test suite to verify your custom event-bus class implementation. Simply use the [`semaphoreFactoryTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/Semaphore.semaphoreFactoryTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized semaphore factory contract conformance
testing.

Usage example:

```ts
// filename: MySemaphoreFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreFactoryTestSuite } from "eridu-tech/semaphore/test-utilities";
import { MySemaphoreFactory } from "./MySemaphoreFactory.js";

describe("class: MySemaphoreFactory", () => {
    semaphoreFactoryTestSuite({
        createSemaphoreFactory: () => new MySemaphoreFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.
