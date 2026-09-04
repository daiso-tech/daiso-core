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

In order to create an adapter you need to implement the [`IEventBusAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.IEventBusAdapter.html) contract.

## Testing your custom IEventBusAdapter

We provide a complete test suite to verify your event-bus adapter implementation. Simply use the [`eventBusAdapterTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/EventBus.eventBusAdapterTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized event-bus adapter contract conformance
testing.

Usage example:

```ts file=./creating_event_bus_adapters-samples/event_bus_adapter_test_suite.ts
```

## Implementing your custom IEventBus class

In some cases, you may need to implement a custom [`EventBus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IEventBus`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.IEventBus.html) contract.

## Testing your custom IEventBus class

We provide a complete test suite to verify your custom event-bus class implementation. Simply use the [`eventBusTestSuite`](https://eridu-tech.github.io/eridu-tech-core/functions/EventBus.eventBusTestSuite.html) function:

The suite provides preconfigured Vitest test cases with common edge
case coverage and standardized event-bus contract conformance testing.

Usage example:

```ts file=./creating_event_bus_adapters-samples/event_bus_test_suite.ts
```

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.
