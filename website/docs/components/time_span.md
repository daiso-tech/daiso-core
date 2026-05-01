---
tags:
    - Utilities
keywords:
    - Utilities
---

# TimeSpan

The `@daiso-tech/core/time-span` component provides an easy way for defining, manipulating, and comparing durations. Furthermore, it is designed for easy integration with external time libraries like Luxon and Dayjs.

## TimeSpan class

The `TimeSpan` class is used for representing time interval.

:::info
Note `TimeSpan` cannot be negative.
:::

### Creating a TimeSpan

Creating `TimeSpan` from milliseconds:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const timeSpan = TimeSpan.fromMilliseconds(100);
```

Creating `TimeSpan` from seconds:

```ts
const timeSpan = TimeSpan.fromSeconds(30);
```

Creating `TimeSpan` from minutes:

```ts
const timeSpan = TimeSpan.fromMinutes(15);
```

Creating `TimeSpan` from hours:

```ts
const timeSpan = TimeSpan.fromHours(1);
```

Creating `TimeSpan` from days:

```ts
const timeSpan = TimeSpan.fromDays(1);
```

Creating `TimeSpan` from date range:

```ts
const timeSpan = TimeSpan.fromDateRange({
    start: new Date("2000-01-01"),
    end: new Date("2010-01-01"),
});
```

Creating `TimeSpan` from `string`:

```ts
const timeSpan = TimeSpan.fromStr("5s");
```

:::info
Under the hood, this method leverages [@lukeed/ms](https://www.npmjs.com/package/@lukeed/ms) package to convert various time formats into milliseconds.
Refer to its documentation for a complete list of supported time formats and units.
:::

### Adding time to TimeSpan

You can add milliseconds to a `TimeSpan`:

```ts
timeSpan.addMilliseconds(200);
```

You can add seconds to a `TimeSpan`:`

```ts
timeSpan.addSeconds(30);
```

You can add minutes to a `TimeSpan`:

```ts
timeSpan.addMinutes(20);
```

You can add hours to a `TimeSpan`:

```ts
timeSpan.addHours(2);
```

You can add days to a `TimeSpan`:

```ts
timeSpan.addDays(14);
```

You can add 2 `TimeSpan` together:

```ts
timeSpan.addTimeSpan(TimeSpan.fromDays(14).addHours(20));
```

### Subtracting time from TimeSpan

You can subtract milliseconds from a `TimeSpan`:

```ts
timeSpan.subtractMilliseconds(200);
```

You can subtract seconds from a `TimeSpan`:`

```ts
timeSpan.subtractSeconds(30);
```

You can subtract minutes from a `TimeSpan`:

```ts
timeSpan.subtractMinutes(20);
```

You can subtract hours from a `TimeSpan`:

```ts
timeSpan.subtractHours(2);
```

You can subtract days from a `TimeSpan`:

```ts
timeSpan.subtractDays(14);
```

You can subtract 2 `TimeSpan` together:

```ts
timeSpan.subtractTimeSpan(TimeSpan.fromDays(14).addHours(20));
```

### Multiplying and dividing a TimeSpan

Dividing a timespan:

```ts
// Will be now 100 milliseconds
TimeSpan.fromMilliseconds(200).divide(2);
```

Multiplying a timespan:

```ts
// Will be now 400 milliseconds
TimeSpan.fromMilliseconds(200).multiply(2);
```

### Comparing TimeSpan:s

Equals:

```ts
// Returns false
TimeSpan.fromSeconds(1).equal(TimeSpan.fromSeconds(2));
```

Greater than:

```ts
// Returns false
TimeSpan.fromSeconds(1).gt(TimeSpan.fromSeconds(2));
```

Greater than or equals:

```ts
// Returns false
TimeSpan.fromSeconds(1).gte(TimeSpan.fromSeconds(2));
```

Less than:

```ts
// Returns true
TimeSpan.fromSeconds(1).lt(TimeSpan.fromSeconds(2));
```

Less than or equals:

```ts
// Returns true
TimeSpan.fromSeconds(1).lte(TimeSpan.fromSeconds(2));
```

### Converting a TimeSpan

You can get amount of milliseconds contained in the `TimeSpan`:

```ts
TimeSpan.fromSeconds(1).toMilliseconds();
```

You can get amount of seconds contained in the `TimeSpan`:

```ts
TimeSpan.fromMinutes(1).toSeconds();
```

You can get amount of minutes contained in the `TimeSpan`:

```ts
TimeSpan.fromHours(1).toMinutes();
```

You can get amount of hours contained in the `TimeSpan`:

```ts
TimeSpan.fromDays(1).toHours();
```

You can get amount of days contained in the `TimeSpan`:

```ts
TimeSpan.fromHours(48).toDays();
```

You can get end date relative to a start date:

```ts
// Will return date of "2002-01-01"
TimeSpan.fromDays(365).toEndDate(new Date("2001-01-01"));
```

You can get start date relative to a end date:

```ts
// Will return date of "2000-01-01"
TimeSpan.fromDays(365).toStartDate(new Date("2001-01-01"));
```

### Serialization and deserialization of TimeSpan

The `TimeSpan` class supports serialization and deserialization, allowing you to easily convert instances to and from serialized formats. However, registration is required first:

```ts
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import { TimeSpan } from "@daiso-tech/core/time-span";

const serde = new Serde(new SuperJsonSerdeAdapter());

serde.registerClass(TimeSpan);

const timeSpan = TimeSpan.fromSeconds(12);
const serializedTimeSpan = serde.serialize(timeSpan);
const deserializedTimeSpan = serde.deserialize(serializedTimeSpan);

// logs false
console.log(serializedTimeSpan === deserializedTimeSpan);
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

```ts
import {
    ITimeSpan,
    TO_MILLISECONDS,
} from "@daiso-tech/core/time-span/contracts";

export class Duration implements ITimeSpan {
    constructor(private readonly timeInMs: number) {}

    [TO_MILLISECONDS](): number {
        return this.timeInMs;
    }
}
```

## Further information

For further information refer to [`@daiso-tech/core/time-span`](https://daiso-tech.github.io/daiso-core/modules/TimeSpan.html) API docs.
