---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating cache adapters
tags:
    - Cache
    - Creating adapters
    - Creating database adapters
keywords:
    - Cache
    - Creating adapters
    - Creating database adapters
---

# Creating cache adapters

## Implementing your custom ICacheAdapter

In order to create an adapter you need to implement the [`ICacheAdapter`](https://daiso-tech.github.io/daiso-core/types/Cache.ICacheAdapter.html) contract.

## Testing your custom ICacheAdapter

We provide a complete test suite to test your cache adapter implementation. Simply use the [`cacheAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Cache.cacheAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MyCacheAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheAdapterTestSuite } from "@daiso-tech/core/cache/test-utilities";
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

## Implementing your custom IDatabaseCacheAdapter

We provide an additional contract [`IDatabaseCacheAdapter`](https://daiso-tech.github.io/daiso-core/types/Cache.IDatabaseCacheAdapter.html) for building custom cache adapters tailored to databases.

## Testing your custom IDatabaseCacheAdapter

We provide a complete test suite to test your database cache adapter implementation. Simply use the [`databaseCacheAdapterTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Cache.databaseCacheAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { databaseCacheAdapterTestSuite } from "@daiso-tech/core/cache/test-utilities";
import { MyDatabaseCacheAdapter } from "./MyDatabaseCacheAdapter.js";

describe("class: MyDatabaseCacheAdapter", () => {
    databaseCacheAdapterTestSuite({
        createAdapter: async () => {
            return new MyDatabaseCacheAdapter(),
        },
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom ICache class

In some cases, you may need to implement a custom [`Cache`](https://daiso-tech.github.io/daiso-core/classes/Cache.Cache.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ICache`](https://daiso-tech.github.io/daiso-core/types/Cache.ICache.html) contract.

## Testing your custom ICache class

We provide a complete test suite to verify your custom event bus class implementation. Simply use the [`cacheTestSuite`](https://daiso-tech.github.io/daiso-core/functions/Cache.cacheTestSuite.html) function:

- Preconfigured Vitest test cases
- Standardized event bus behavior validation
- Common edge case coverage

Usage example:

```ts
// filename: MyCache.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheTestSuite } from "@daiso-tech/core/cache/test-utilities";
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

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.
