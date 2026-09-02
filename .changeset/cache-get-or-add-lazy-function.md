---
"eridu-tech": minor
---

`ICacheAdapter.getOrAdd` now always takes a lazy function that produces the value to cache, instead of accepting either a plain value or a function. The value producer is invoked **only on a cache miss** (when the key is missing or expired), so the value is never computed when a cached entry already exists.

This also makes adapters easier to implement: they no longer need to branch between plain values and functions and can rely on a single, uniform lazy invocation for the value to add.
