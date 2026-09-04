---
slug: /components/backoff_policies
tags:
    - Utilities
keywords:
    - Utilities
---

# Backoff policies

The `eridu-tech/backoff-policies` component

## Predefined backoff policies

The library includes predefined backoff policies:

- `constantBackoff` - Constant backoff policy with jitter

```ts file=./samples/constant_backoff.ts
```

- `exponentialBackoff` - Exponential backoff policy with jitter

```ts file=./samples/exponential_backoff.ts
```

- `linearBackoff` - Linear backoff policy with jitter

```ts file=./samples/linear_backoff.ts
```

- `polynomialBackoff` - Polynomial backoff policy with jitter

```ts file=./samples/polynomial_backoff.ts
```

## Further information

For further information refer to [`eridu-tech/backoff-policies`](https://eridu-tech.github.io/eridu-tech-core/modules/BackoffPolicy.html) API docs.
