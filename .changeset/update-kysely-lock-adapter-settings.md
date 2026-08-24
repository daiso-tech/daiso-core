---
"eridu-tech": minor
---

Removed the `currentDate` option from `KyselySharedLockAdapterSettings`. It was an internal testing setting that is no longer used. The adapter now always uses the current time `Date.now()`.
