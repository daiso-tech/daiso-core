---
"eridu-tech": minor
---

## Cache adapter API simplification

Simplified the `ICacheAdapter` contract by removing the `removeAll` method and renaming `removeByKeyPrefix` to `removeByPrefix`.

### What changed

- **Removed** `ICacheAdapter.removeAll(context)`.
- **Renamed** `ICacheAdapter.removeByKeyPrefix(prefix, context)` to `ICacheAdapter.removeByPrefix(prefix, context)`.
- Calling `removeByPrefix` with an empty string prefix (`""`) now clears the entire cache, which replaces the removed `removeAll` method.

### Migration

- Replace calls to `removeAll(context)` with `removeByPrefix("", context)`.
- Rename any calls to `removeByKeyPrefix(prefix, context)` to `removeByPrefix(prefix, context)`.
- If you maintain a custom implementation of `ICacheAdapter`, update it to the new contract and remove the `removeAll` method.
