---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating event-bus adapters
tags:
    - Event-bus
    - Creating adapters
keywords:
    - Event-bus
    - Creating adapters
---

# Creating EventBus adapters

## Implementing your custom IEventBusAdapter

In order to create an adapter you need to implement the [`IEventBusAdapter`](https://eridu-tech.github.io/eridu-tech/types/EventBus.IEventBusAdapter.html) contract.

## Testing your custom IEventBusAdapter

We provide a complete test suite to verify your event-bus adapter implementation. Simply use the [`eventBusAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech/functions/EventBus.eventBusAdapterTestSuite.html) function:

- Preconfigured Vitest test cases
- Common edge case coverage

Usage example:

```ts
// filename: MyEventBusAdapter.test.ts

import { describe, test, beforeEach, expect } from "vitest";
import { eventBusAdapterTestSuite } from "eridu-tech/event-bus/test-utilities";
import { MyEventBusAdapter } from "./MyEventBusAdapter.js";

describe("class: MyEventBusAdapter", () => {
    eventBusAdapterTestSuite({
        createAdapter: () => new MyEventBusAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
```

## Implementing your custom IEventBus class

In some cases, you may need to implement a custom [`EventBus`](https://eridu-tech.github.io/eridu-tech/modules/EventBus.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IEventBus`](https://eridu-tech.github.io/eridu-tech/types/EventBus.IEventBus.html) contract.

## Testing your custom IEventBus class

We provide a complete test suite to verify your custom event-bus class implementation. Simply use the [`eventBusTestSuite`](https://eridu-tech.github.io/eridu-tech/functions/EventBus.eventBusTestSuite.html) function:

- Preconfigured Vitest test cases
- Standardized event-bus behavior validation
- Common edge case coverage

Usage example:

```ts
// filename: MyEventBus.test.ts

import { describe, test, beforeEach, expect } from "vitest";
import { eventBusTestSuite } from "eridu-tech/event-bus/test-utilities";
import { MyEventBus } from "./MyEventBus.js";

describe("class: EventBus", () => {
    eventBusTestSuite({
        test,
        expect,
        describe,
        beforeEach,
        createEventBus: () => new MyEventBus(),
    });
});
```

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech/modules/EventBus.html) API docs.
