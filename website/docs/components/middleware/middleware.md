---
slug: /components/middleware
sidebar_label: Middleware
pagination_label: Middleware
tags:
    - Middleware - Utilities
keywords:
    - Middleware - Function Interception - Middleware Pipeline
---

# Middleware

The `eridu-tech/middleware` module provides a flexible middleware system for intercepting and composing function calls. It enables you to wrap functions with pre-processing and post-processing logic, similar to middleware patterns found in web frameworks like Express.js.

## Middleware basics

### Creating a simple middleware

A middleware is a function that receives middleware arguments (containing the original arguments, a next function, and the name of the function) and returns the result:

```ts file=./samples/simple_middleware.ts
```

### Applying middleware to a function

Use the `use` function to apply one or more middlewares to a function:

```ts file=./samples/use_function.ts
```

### Applying multiple middlewares

You can apply multiple middlewares, which are executed in order of their priority:

```ts file=./samples/multiple_middlewares.ts
```

## Middleware types

### MiddlewareFn

A function that receives middleware arguments and returns a result:

```ts file=./samples/fn_type.ts
```

### IMiddlewareObject

A middleware object with an optional priority property:

```ts file=./samples/object_type.ts
```

### MiddlewareArgs

The argument passed to each middleware:

```ts file=./samples/args_type.ts
```

### defineMiddleware

A helper function for defining middleware with accurate type inference. It ensures the provided handler conforms to the `MiddlewareFn` signature while preserving exact parameter and return types, without needing explicit generic annotations:

```ts file=./samples/define_middleware.ts
```

## Patterns

### Priority-based ordering

Set priority on middleware objects to control execution order (lower numbers execute first):

```ts file=./samples/priority_ordering.ts
```

### Async middleware

Middleware can be asynchronous:

```ts file=./samples/async_middleware.ts
```

### Short-circuiting middleware

Skip calling `next()` to bypass subsequent middleware and the original function:

```ts file=./samples/caching_middleware.ts
```

### Error handling middleware

Catch and handle errors in middleware:

```ts file=./samples/error_handling_middleware.ts
```

## Enhancing Methods with `enhance`

The `enhance` function provides a convenient way to apply middleware to methods of class instances, enabling interception and augmentation of method calls without manually wrapping each function.

### Usage Example

```ts file=./samples/enhance_greeter.ts
```

### Enhancing Object Literal Methods

You can enhance methods on plain object literals as well:

```ts file=./samples/enhance_object_literal.ts
```

### Enhancing Static Methods

Static methods on classes can also be enhanced:

```ts file=./samples/enhance_static.ts
```

### Enhancing Class Prototype Methods

You can enhance all instances of a class by enhancing its prototype:

```ts file=./samples/enhance_prototype.ts
```

### How it Works

- The `enhance` function replaces the specified method on the object with a wrapped version that runs the provided middleware pipeline.
- If the target property is not a function, a `TypeError` is thrown.
- Multiple middlewares can be provided (as an array or single value).

:::danger
Because `enhance` mutates the object **in-place**, when one enhanced method internally calls another enhanced method via `this`, the internal call goes through the already-enhanced wrapper again, causing the middleware to apply **twice**. Be mindful of inter-method calls when using `enhance` on multiple methods of the same instance.
:::

This pattern is useful for adding cross-cutting concerns (logging, validation, authorization, etc.) to class methods in a reusable and declarative way.

## Applying Plugins with `withPlugin` {#plugin}

The `withPlugin` function provides a way to apply one or more plugins to a class instance or object literal, where each plugin can use the `enhance` function to wrap methods with middleware. This is useful for encapsulating cross-cutting concerns into reusable plugin units.

### Usage with Class Instances

```ts file=./samples/with_plugin_class.ts
```

### Usage with Object Literals

`withPlugin` also works with plain object literals:

```ts file=./samples/with_plugin_object_literal.ts
```

### Applying Multiple Plugins

You can apply multiple plugins at once by passing an array:

```ts file=./samples/with_plugin_multiple.ts
```

### Object-based Plugins

For plugins with state or configuration, use the object form:

```ts file=./samples/with_plugin_object_based.ts
```

### How it Works

- `withPlugin` **always** creates a copy of the target (whether a class instance or object literal), preserving the original unchanged.
- Each plugin is invoked in order, receiving the copied target and the `enhance` function.
- The `enhance` function wraps the specified method with a middleware pipeline in-place on the copy.
- The enhanced copy is returned, leaving the original untouched.

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
This pattern is ideal for building reusable feature packs (logging, monitoring) that can be composed and applied to any class instance or object literal.
:::

## Further information

For further information refer to [`eridu-tech/middleware`](https://eridu-tech.github.io/eridu-tech-core/modules/Middleware.html) API docs.
