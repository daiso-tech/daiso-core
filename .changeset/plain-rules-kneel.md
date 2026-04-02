---
"@daiso-tech/core": minor
---

- Breaking Changes
    - Public async APIs now use native Promises instead of the prior task abstraction across many modules (cache, collections, eventing, storage, locks, rate-limiters, semaphores, shared locks). Update integrations accordingly.

- New Features
    - Added a reusable delay utility and a configurable waitUntil hook to control background event/dispatch scheduling.

- Chores
    - Removed legacy task exports, task implementation, and related tests; updated test suites to use the new delay utility.