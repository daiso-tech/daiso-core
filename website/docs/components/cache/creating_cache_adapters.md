---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating cache adapters
tags:
    - Cache
    - Creating adapters
keywords:
    - Cache
    - Creating adapters
---

# Creating cache adapters

## Implementing your custom ICacheAdapter

In order to create an adapter you need to implement the [`ICacheAdapter`](https://eridu-tech.github.io/eridu-tech/types/Cache.ICacheAdapter.html) contract.

## Testing your custom ICacheAdapter

We provide a complete test suite to test your cache adapter implementation. Simply use the [`cacheAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech/functions/Cache.cacheAdapterTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized cache adapter contract conformance
testing.

Usage example:

```ts
// filename: MyCacheAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheAdapterTestSuite } from "eridu-tech/cache/test-utilities";
import { MemoryCacheAdapter } from "./MemoryCacheAdapter.js";

describe("class: MyCacheAdapter", () => {
    cacheAdapterTestSuite({
        createAdapter: () => new MemoryCacheAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ICache class

In some cases, you may need to implement a custom [`Cache`](https://eridu-tech.github.io/eridu-tech/classes/Cache.Cache.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ICache`](https://eridu-tech.github.io/eridu-tech/types/Cache.ICache.html) contract.

## Testing your custom ICache class

We provide a complete test suite to verify your custom cache class implementation. Simply use the [`cacheTestSuite`](https://eridu-tech.github.io/eridu-tech/functions/Cache.cacheTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized cache contract conformance testing.

Usage example:

```ts
// filename: MyCache.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheTestSuite } from "eridu-tech/cache/test-utilities";
import { MyCache } from "./MyCache.js";

describe("class: MyCache", () => {
    cacheTestSuite({
        createCache: () => new MyCache(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech/modules/Cache.html) API docs.
