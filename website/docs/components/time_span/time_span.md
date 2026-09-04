---
slug: /components/time_span
tags:
    - Utilities
keywords:
    - Utilities
---

# TimeSpan

The `eridu-tech/time-span` component provides an easy way for defining, manipulating, and comparing durations. Furthermore, it is designed for easy integration with external time libraries like Luxon and Dayjs.

## TimeSpan class

The `TimeSpan` class is used for representing time interval.

:::info
Note `TimeSpan` cannot be negative.
:::

### Creating a TimeSpan

Creating `TimeSpan` from milliseconds:

```ts file=./samples/creating_from_milliseconds.ts
```

Creating `TimeSpan` from seconds:

```ts file=./samples/creating_from_seconds.ts
```

Creating `TimeSpan` from minutes:

```ts file=./samples/creating_from_minutes.ts
```

Creating `TimeSpan` from hours:

```ts file=./samples/creating_from_hours.ts
```

Creating `TimeSpan` from days:

```ts file=./samples/creating_from_days.ts
```

Creating `TimeSpan` from date range:

```ts file=./samples/creating_from_date_range.ts
```

Creating `TimeSpan` from `string`:

```ts file=./samples/creating_from_str.ts
```

:::info
Under the hood, this method leverages [@lukeed/ms](https://www.npmjs.com/package/@lukeed/ms) package to convert various time formats into milliseconds.
Refer to its documentation for a complete list of supported time formats and units.
:::

### Adding time to TimeSpan

You can add milliseconds to a `TimeSpan`:

```ts file=./samples/adding_milliseconds.ts
```

You can add seconds to a `TimeSpan`:`

```ts file=./samples/adding_seconds.ts
```

You can add minutes to a `TimeSpan`:

```ts file=./samples/adding_minutes.ts
```

You can add hours to a `TimeSpan`:

```ts file=./samples/adding_hours.ts
```

You can add days to a `TimeSpan`:

```ts file=./samples/adding_days.ts
```

You can add 2 `TimeSpan` together:

```ts file=./samples/adding_time_span.ts
```

### Subtracting time from TimeSpan

You can subtract milliseconds from a `TimeSpan`:

```ts file=./samples/subtracting_milliseconds.ts
```

You can subtract seconds from a `TimeSpan`:`

```ts file=./samples/subtracting_seconds.ts
```

You can subtract minutes from a `TimeSpan`:

```ts file=./samples/subtracting_minutes.ts
```

You can subtract hours from a `TimeSpan`:

```ts file=./samples/subtracting_hours.ts
```

You can subtract days from a `TimeSpan`:

```ts file=./samples/subtracting_days.ts
```

You can subtract 2 `TimeSpan` together:

```ts file=./samples/subtracting_time_span.ts
```

### Multiplying and dividing a TimeSpan

Dividing a timespan:

```ts file=./samples/dividing.ts
```

Multiplying a timespan:

```ts file=./samples/multiplying.ts
```

### Comparing TimeSpan:s

Equals:

```ts file=./samples/comparing_equal.ts
```

Greater than:

```ts file=./samples/comparing_gt.ts
```

Greater than or equals:

```ts file=./samples/comparing_gte.ts
```

Less than:

```ts file=./samples/comparing_lt.ts
```

Less than or equals:

```ts file=./samples/comparing_lte.ts
```

### Converting a TimeSpan

You can get amount of milliseconds contained in the `TimeSpan`:

```ts file=./samples/converting_to_milliseconds.ts
```

You can get amount of seconds contained in the `TimeSpan`:

```ts file=./samples/converting_to_seconds.ts
```

You can get amount of minutes contained in the `TimeSpan`:

```ts file=./samples/converting_to_minutes.ts
```

You can get amount of hours contained in the `TimeSpan`:

```ts file=./samples/converting_to_hours.ts
```

You can get amount of days contained in the `TimeSpan`:

```ts file=./samples/converting_to_days.ts
```

You can get end date relative to a start date:

```ts file=./samples/converting_to_end_date.ts
```

You can get start date relative to a end date:

```ts file=./samples/converting_to_start_date.ts
```

### Serialization and deserialization of TimeSpan

The `TimeSpan` class supports serialization and deserialization, allowing you to easily convert instances to and from serialized formats. However, registration is required first:

```ts file=./samples/serde_serialization.ts
```

## ITimeSpan contract

The `ITimeSpan` contract provides a standardized way to express a duration as milliseconds.

Key components, including `Cache` and `Lock`, rely on this contract, ensuring they are not tightly coupled to a specific duration implementation.

This decoupling is crucial for interoperability, allowing seamless integration with external time libraries like `Luxon` or `Dayjs`.
To integrate a new library, its duration objects must simply implement the `ITimeSpan` contract.

:::info
Note `TimeSpan` class implements `ITimeSpan` contract.
:::

The `ITimeSpan` contract requires you to implement the `TO_MILLISECONDS` method on the duration object, which must return the duration in milliseconds.

```ts file=./samples/implementing_itimespan.ts
```

## Further information

For further information refer to [`eridu-tech/time-span`](https://eridu-tech.github.io/eridu-tech-core/modules/TimeSpan.html) API docs.
